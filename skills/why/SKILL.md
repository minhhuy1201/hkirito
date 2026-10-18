---
name: why
description: "Use for 'why does X work this way', 'why we picked Y', design rationale, regressions, postmortems, or data-backed thresholds. Searches git history, PRs, and any available issue/doc/chat/error-tracking MCPs, then separates what is documented from what is inferred. Use how for mechanics."
---
<!-- ported from cursor/plugins pstack@101b274 (MIT), inline version, see THIRD_PARTY.md -->

# Why

Find the motivation behind code. `how` answers what the code does; `why` answers what forces gave it this shape. Read-only. Code shows what it does, not why it exists, so the why lives in commits, PRs, tickets, docs, and chat.

## Process

1. **Target and question.** If the referent is vague, guess from conversation context and state the guess in one line.
2. **Code anchor.** Collect file paths and line ranges, key symbols, and history: `git blame -L <start>,<end> <file>`, `git log --follow --oneline -20 -- <file>`, `git log -1 --format=%B <commit>`. PR numbers appear as `(#1234)` in merge subjects; read the PR body and review threads with `gh pr view <n> --comments`.
3. **Other sources.** Query each of these only if an MCP or CLI for it is available this session: issue tracker, long-form docs, team chat, error tracking, observability. Run them yourself, one at a time. Dispatch parallel subagents only when several sources are large and independent. Record each source you could not search as a gap.
4. **Write up** using the tiers below. List every source consulted, including empty ones and skipped ones with the reason.

## Confidence tiers

Put every claim in one tier and phrase it to match.

- **Direct.** Someone wrote the reason down. State it plainly with the citation: "This exists because X ([PR #12])."
- **Supported.** Several indirect pieces converge. Cite each: "The evidence points to X: A, B, C."
- **Inferred.** Your reading, with the chain explicit: "Given A and B, C seems likely because D."
- **Speculative.** A guess on thin evidence. Say so: "One possibility is X; no direct evidence."
- **Unknown.** You looked and found nothing. Say what you searched: "Searched PRs touching this file since <date> and grepped for <terms>; no explanation found."

"Because", "was designed to", and "fixes" claim author intent, so use them only in Direct or Supported claims, with a citation next to them. Avoid "obviously", "clearly", "just", and "I think". Do not retrofit a clean rationale onto messy history, and do not assume the latest commit is authoritative: the current shape is often many decisions stacked. If the user's question carries a guess ("I assume it's for performance?"), test it as one candidate. Do not confirm it by default.

## Output

The question, the code in question, what we found (Direct and Supported), what we can reasonably infer, competing hypotheses, what we don't know, sources consulted. When the question precedes a change, end with Preserve / Change / Avoid / Risk bullets for planning it.
