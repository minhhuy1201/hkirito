import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "..", "usage.mjs");
const root = realpathSync(mkdtempSync(join(tmpdir(), "usage-test-")));
after(() => rmSync(root, { recursive: true, force: true }));

const OPUS = "claude-opus-5-5";
const SONNET = "claude-sonnet-5-5";
const OTHER = "claude-mystery-9";

function assistant(id, ts, model, usage) {
  return JSON.stringify({ type: "assistant", timestamp: ts, message: { role: "assistant", id, model, usage } });
}
function user(ts, content) {
  return JSON.stringify({ type: "user", timestamp: ts, message: { role: "user", content } });
}
function usage({ input = 0, output = 0, read = 0, w5 = 0, w1 = 0, breakdown = true }) {
  const u = { input_tokens: input, output_tokens: output, cache_read_input_tokens: read, cache_creation_input_tokens: w5 + w1 };
  if (breakdown) u.cache_creation = { ephemeral_5m_input_tokens: w5, ephemeral_1h_input_tokens: w1 };
  return u;
}

function buildSession(name, { main, subagents }) {
  const dir = join(root, name);
  mkdirSync(join(dir, "subagents"), { recursive: true });
  writeFileSync(`${dir}.jsonl`, main.join("\n") + "\n");
  for (const [id, type, lines] of subagents) {
    writeFileSync(join(dir, "subagents", `agent-${id}.jsonl`), lines.join("\n") + "\n");
    writeFileSync(join(dir, "subagents", `agent-${id}.meta.json`), JSON.stringify({ agentType: type }));
  }
  return dir;
}

function run(args, options = {}) {
  const r = spawnSync("node", [SCRIPT, ...args], { encoding: "utf8", ...options });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}

const full = buildSession("full", {
  main: [
    user("2026-01-01T10:00:00Z", "plan the work"),
    assistant("m1", "2026-01-01T10:00:10Z", OPUS, usage({ input: 100, output: 50, read: 10000, w5: 20000 })),
    assistant("m2", "2026-01-01T10:01:00Z", OPUS, usage({ input: 1, output: 1 })),
    assistant("m2", "2026-01-01T10:01:01Z", OPUS, usage({ input: 200, output: 60, read: 100000 })),
    assistant("m3", "2026-01-01T10:20:00Z", OPUS, usage({ input: 0, output: 10, w1: 40000 })),
    assistant("m4", "2026-01-01T10:21:00Z", SONNET, usage({ input: 0, output: 5, read: 20000 })),
  ],
  subagents: [
    [
      "r1",
      "reviewer",
      [
        user("2026-01-01T10:10:00Z", [{ type: "text", text: "Review the diff\nsecond line" }]),
        assistant("r-a", "2026-01-01T10:10:05Z", OPUS, usage({ input: 10, output: 20, read: 1000, w5: 2000 })),
        assistant("r-b", "2026-01-01T10:20:05Z", OPUS, usage({ input: 0, output: 30, w5: 50000 })),
        assistant("r-c", "2026-01-01T10:35:05Z", OPUS, usage({ input: 0, output: 1, w5: 1000 })),
      ],
    ],
    [
      "i1",
      "implementer",
      [
        user("2026-01-01T10:12:00Z", "Implement ticket 01"),
        assistant("i-a", "2026-01-01T10:12:05Z", OTHER, usage({ input: 1000, output: 100, read: 10000, w5: 4000, breakdown: false })),
        assistant("i-b", "2026-01-01T10:42:05Z", OTHER, usage({ output: 5, w1: 40000 })),
        assistant("i-c", "2026-01-01T11:43:05Z", OTHER, usage({ output: 5, w1: 35000 })),
      ],
    ],
  ],
});

test("main total uses the last usage per message id and a per-model eq", () => {
  const out = run([`${dir()}.jsonl`]);
  assert.match(out, /MAIN total\n {2}claude-opus-5-5: calls=3 write=60\.0K read=110\.0K out=120 eq=110\.8K\n {2}claude-sonnet-5-5: calls=1 write=0 read=20\.0K out=5 eq=1\.0K/);
});

test("main from first reviewer starts at the reviewer's first timestamp", () => {
  const out = run([dir()]);
  assert.match(out, /MAIN from first reviewer \(2026-01-01T10:10:00Z\)\n {2}claude-opus-5-5: calls=1 write=40\.0K read=0 out=10 eq=80\.0K\n {2}claude-sonnet-5-5: calls=1/);
});

test("subagent rows carry type, model, stats and the first prompt line", () => {
  const out = run([dir()]);
  assert.match(out, /10:10:00 reviewer claude-opus-5-5 calls=3 write=53\.0K read=1\.0K out=51 eq=\d.*\| Review the diff$/m);
  assert.match(out, /10:12:00 implementer claude-mystery-9 .*\| Implement ticket 01$/m);
});

test("multipliers: 5m 1.25x, 1h 2x, unknown model read 0.1x, no breakdown counts as 5m", () => {
  const out = run([dir()]);
  assert.match(out, /implementer \/ claude-mystery-9: n=1 calls=3 write=79\.0K read=10\.0K out=110 eq=157\.0K/);
  assert.match(out, /reviewer \/ claude-opus-5-5: n=1 calls=3 .* eq=66\.3K/);
});

test("rewrites: 5m write after idle gap and 1h write after 61 minutes, none inside TTL", () => {
  const out = run([dir()]);
  const section = out.split("CACHE REWRITES")[1];
  assert.match(section, /2026-01-01T10:20:05Z reviewer 10:10:00 5m write=50\.0K gap=10\.0min/);
  assert.match(section, /2026-01-01T11:43:05Z implementer 10:12:00 1h write=35\.0K gap=61\.0min/);
  assert.doesNotMatch(section, /10:42:05Z/);
  assert.doesNotMatch(section, /10:35:05Z/);
  assert.doesNotMatch(section, /10:20:00Z main/);
});

test("prints no cross-model total and no dollar amounts", () => {
  const out = run([dir()]);
  assert.doesNotMatch(out, /\$/);
  assert.doesNotMatch(out, /grand total|all models/i);
  const mainLines = out.split("MAIN total\n")[1].split("MAIN from")[0].trimEnd().split("\n");
  assert.equal(mainLines.length, 2);
  for (const l of mainLines) assert.match(l, /^ {2}claude-[a-z0-9-]+: calls=/);
});

test("accepts several sessions at once", () => {
  const second = buildSession("second", { main: [assistant("x", "2026-01-02T10:00:00Z", OPUS, usage({ input: 5 }))], subagents: [] });
  const out = run([dir(), `${second}.jsonl`]);
  assert.match(out, /### session full/);
  assert.match(out, /### session second/);
  assert.match(out, /MAIN from first reviewer: no reviewer subagent/);
});

test("no argument reads the latest session of the current project", () => {
  const home = join(root, "home");
  const cwd = join(root, "work.dir");
  mkdirSync(cwd, { recursive: true });
  const slug = cwd.replace(/[/.]/g, "-");
  const projectDir = join(home, ".claude", "projects", slug);
  mkdirSync(projectDir, { recursive: true });
  const older = join(projectDir, "old-session.jsonl");
  const newer = join(projectDir, "new-session.jsonl");
  writeFileSync(older, assistant("a", "2026-01-01T00:00:00Z", OPUS, usage({ input: 1 })) + "\n");
  writeFileSync(newer, assistant("b", "2026-01-02T00:00:00Z", OPUS, usage({ input: 2 })) + "\n");
  utimesSync(older, new Date(2026, 0, 1), new Date(2026, 0, 1));
  utimesSync(newer, new Date(2026, 0, 2), new Date(2026, 0, 2));
  const out = run([], { cwd, env: { ...process.env, HOME: home } });
  assert.match(out, /### session new-session/);
  assert.doesNotMatch(out, /old-session/);
});

function dir() {
  return join(root, "full");
}
