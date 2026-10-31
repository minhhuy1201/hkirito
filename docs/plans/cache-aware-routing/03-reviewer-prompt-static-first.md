Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md)

# 03: Reviewer prompt puts static instructions first

**What to build:** caching is a prefix match, so the round-independent part of the reviewer prompt goes first and rounds share a longer cached prefix.

- `skills/review-loop/SKILL.md`, section "Reviewer prompt": reorder the template to static instructions (round-independent lines of `## This round`, `## Two axes`, `## Output`) -> `## Task spec & acceptance criteria` -> `## Review log` -> `## This round` (round number, gate flag, scope, diff stat, related files, pr-review path) -> `## Checks`.
- Lead sentence: static instructions first, then the fixed spec, then per-round data, so the prefix stays stable across rounds.
- Fix cross-references ("see the Checks block below", "the task spec above") so they read correctly after the move.

**Model:** haiku - one file, reorder of existing text, no new rule

**Blocked by:** none

**Status:** done

- [x] Template order matches the list above; no instruction lost (diff the old and new template line sets)
- [x] Every "above"/"below" reference points the right way
