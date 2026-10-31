#!/usr/bin/env node
// Token usage report for Claude Code sessions. Zero dependencies.
// Usage: node usage.mjs [path ...]   (path = session .jsonl or session directory)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";

const REWRITE_MIN_TOKENS = 30_000;
const TTL_MS = { w5: 5 * 60_000, w1: 60 * 60_000 };

function readMultiplier(model) {
  const name = String(model ?? "");
  if (name.includes("opus-5-5") || name.includes("sonnet-5-5")) return 0.05;
  if (name.includes("fable-5-1") || name.includes("mythos-5-1")) return 0.025;
  return 0.1;
}

function cacheWrites(usage) {
  const breakdown = usage.cache_creation;
  const w5 = breakdown?.ephemeral_5m_input_tokens;
  const w1 = breakdown?.ephemeral_1h_input_tokens;
  if (w5 == null && w1 == null) return { w5: usage.cache_creation_input_tokens ?? 0, w1: 0 };
  return { w5: w5 ?? 0, w1: w1 ?? 0 };
}

function inputEquivalent(call) {
  return call.fresh + call.w5 * 1.25 + call.w1 * 2 + call.read * readMultiplier(call.model);
}

function textOf(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((part) => (typeof part === "string" ? part : (part?.text ?? ""))).join("\n");
}

function loadTranscript(file) {
  const byId = new Map();
  let firstTs = null;
  let firstPrompt = null;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const ts = entry.timestamp ?? null;
    if (ts && firstTs === null) firstTs = ts;
    const message = entry.message ?? {};
    if (firstPrompt === null && entry.type === "user") {
      const first = textOf(message.content).split("\n").find((l) => l.trim()) ?? "";
      firstPrompt = first.trim();
    }
    if (message.role !== "assistant" || !message.usage || !message.id) continue;
    const u = message.usage;
    const { w5, w1 } = cacheWrites(u);
    // Streaming repeats a message id on several lines; the last line carries the final usage.
    byId.set(message.id, {
      ts,
      model: message.model ?? null,
      fresh: u.input_tokens ?? 0,
      out: u.output_tokens ?? 0,
      read: u.cache_read_input_tokens ?? 0,
      w5,
      w1,
    });
  }
  const calls = [...byId.values()].sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  return { calls, firstTs, firstPrompt: firstPrompt ?? "" };
}

function sumCalls(calls) {
  const s = { calls: 0, write: 0, read: 0, out: 0, eq: 0 };
  for (const c of calls) {
    s.calls += 1;
    s.write += c.w5 + c.w1;
    s.read += c.read;
    s.out += c.out;
    s.eq += inputEquivalent(c);
  }
  return s;
}

function startTime(s) {
  return String(s.firstTs ?? "").slice(11, 19);
}

function perModelLines(calls) {
  return [...groupByModel(calls)].map(([model, c]) => `  ${model}: ${statsLine(sumCalls(c))}`);
}

function groupByModel(calls) {
  const groups = new Map();
  for (const c of calls) {
    const key = c.model ?? "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  return groups;
}

function rewrites(calls) {
  const found = [];
  for (let i = 1; i < calls.length; i += 1) {
    const gap = Date.parse(calls[i].ts) - Date.parse(calls[i - 1].ts);
    if (Number.isNaN(gap)) continue;
    for (const kind of ["w5", "w1"]) {
      const size = calls[i][kind];
      if (size > REWRITE_MIN_TOKENS && gap > TTL_MS[kind]) {
        found.push({ ts: calls[i].ts, kind: kind === "w5" ? "5m" : "1h", size, gapMin: gap / 60_000, model: calls[i].model });
      }
    }
  }
  return found;
}

function fmt(n) {
  const v = Math.round(n);
  return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v);
}

function statsLine(s) {
  return `calls=${s.calls} write=${fmt(s.write)} read=${fmt(s.read)} out=${fmt(s.out)} eq=${fmt(s.eq)}`;
}

function resolveSession(input) {
  const path = resolve(input.replace(/\/+$/, ""));
  if (path.endsWith(".jsonl")) return { main: path, dir: path.slice(0, -".jsonl".length) };
  return { main: `${path}.jsonl`, dir: path };
}

function latestSession() {
  const slug = process.cwd().replace(/[^a-zA-Z0-9]/g, "-");
  const projectDir = join(homedir(), ".claude", "projects", slug);
  if (!existsSync(projectDir)) return null;
  const files = readdirSync(projectDir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => ({ f: join(projectDir, f), mtime: statSync(join(projectDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length ? files[0].f : null;
}

function loadSubagents(dir) {
  const subDir = join(dir, "subagents");
  if (!existsSync(subDir)) return [];
  const subs = [];
  for (const f of readdirSync(subDir).filter((n) => n.endsWith(".jsonl"))) {
    const t = loadTranscript(join(subDir, f));
    const metaFile = join(subDir, f.replace(/\.jsonl$/, ".meta.json"));
    let type = "?";
    try {
      type = JSON.parse(readFileSync(metaFile, "utf8")).agentType ?? "?";
    } catch {}
    subs.push({ ...t, type, model: t.calls[0]?.model ?? null });
  }
  return subs.sort((a, b) => String(a.firstTs).localeCompare(String(b.firstTs)));
}

function report({ main, dir }) {
  const lines = [];
  const mainT = loadTranscript(main);
  const subs = loadSubagents(dir);
  lines.push(`### session ${basename(main, ".jsonl")}`);

  lines.push("MAIN total");
  lines.push(...perModelLines(mainT.calls));

  const firstReviewer = subs.find((s) => s.type === "reviewer");
  if (firstReviewer) {
    const since = firstReviewer.firstTs;
    lines.push(`MAIN from first reviewer (${since})`);
    const after = mainT.calls.filter((c) => c.ts && c.ts >= since);
    lines.push(...perModelLines(after));
  } else {
    lines.push("MAIN from first reviewer: no reviewer subagent");
  }

  lines.push("SUBAGENTS");
  for (const s of subs) {
    const stats = sumCalls(s.calls);
    const time = startTime(s);
    lines.push(`  ${time} ${s.type} ${s.model ?? "unknown"} ${statsLine(stats)} | ${s.firstPrompt.slice(0, 80)}`);
  }

  lines.push("SUMS per agent type and model");
  const sums = new Map();
  for (const s of subs) {
    const key = `${s.type} / ${s.model ?? "unknown"}`;
    if (!sums.has(key)) sums.set(key, { n: 0, calls: [] });
    const g = sums.get(key);
    g.n += 1;
    g.calls.push(...s.calls);
  }
  for (const [key, g] of sums) lines.push(`  ${key}: n=${g.n} ${statsLine(sumCalls(g.calls))}`);

  lines.push(`CACHE REWRITES (write > ${fmt(REWRITE_MIN_TOKENS)} after idle gap > TTL)`);
  const sources = [["main", mainT.calls], ...subs.map((s) => [`${s.type} ${startTime(s)}`, s.calls])];
  let any = false;
  for (const [label, calls] of sources) {
    for (const r of rewrites(calls)) {
      any = true;
      lines.push(`  ${r.ts} ${label} ${r.kind} write=${fmt(r.size)} gap=${r.gapMin.toFixed(1)}min`);
    }
  }
  if (!any) lines.push("  none");
  return lines.join("\n");
}

function main(args) {
  const inputs = args.length ? args : [latestSession()];
  if (!inputs[0]) {
    console.error("No session found for the current project; pass a session .jsonl or directory.");
    process.exit(1);
  }
  const out = [];
  for (const input of inputs) {
    const session = resolveSession(input);
    if (!existsSync(session.main)) {
      console.error(`Main transcript not found: ${session.main}`);
      process.exit(1);
    }
    out.push(report(session));
  }
  console.log(out.join("\n\n"));
}

main(process.argv.slice(2));
