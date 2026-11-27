Spec: [sync-upstream-2026-11-27](../../specs/sync-upstream-2026-11-27.md)

# 06: Apply to ~/.claude

**What to build:** the author's machine runs what the repo ships. Done by the main session, never an `implementer`, after `review-loop` and just before `gh pr create`. `~/.claude/skills/archify` is already a link to the repo; most other skills are copies.

**Blocked by:** 01, 02, 03, 04, 05

**Model:** sonnet - edits outside the repo; main session only

**Status:** todo

- [ ] `reframe`, `flow-map`, `kirito-mode`, `tidy` copied into `~/.claude/skills/`; `diff -rq` against the repo is clean for those four
- [ ] `~/.claude/settings.json` parses and has `hooks.SubagentStart` pointing at the repo's hook script
- [ ] `~/.claude/CLAUDE.md` edited in place with the ticket 05 text change, not overwritten; `diff` against `CLAUDE-huykrito.md` shows only differences that existed before
- [ ] Final report lists local-only leftovers (extra `agents/` folders in four skills, `references/` in `interrogate`) without touching them
