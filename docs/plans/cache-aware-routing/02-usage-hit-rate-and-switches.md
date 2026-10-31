Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md)

# 02: usage.mjs reports cache hit rate and model switches

**What to build:** make cache health measurable, so the routing change in 01 can be checked on real sessions.

- `skills/review-loop/scripts/usage.mjs`: `sumCalls` also sums `fresh`; `statsLine` adds `hit=<n>%` = `read / (read + write + fresh)` with one decimal, `hit=-` when the denominator is 0. Applies to every MAIN, SUBAGENTS, and SUMS line.
- New section `MODEL SWITCHES (main)` after CACHE REWRITES: walk the main transcript's calls, skipping `model` null or `"<synthetic>"` (real transcripts contain it); for each change print `  <ts> <from> -> <to> write=<w5+w1 of that call>`, else `  none`.
- `README.md` line describing `usage.mjs` mentions both.
- `skills/review-loop/scripts/test/usage.test.mjs`: update existing exact-line regexes for `hit=`; assert MAIN opus `hit=64.6%` in the `full` fixture; assert the switch `2026-01-01T10:21:00Z claude-opus-5-5 -> claude-sonnet-5-5 write=0`; add a fixture with a `<synthetic>` call between two same-model calls that reports `none`.

**Model:** sonnet - new branching in a script with tests

**Blocked by:** none

**Status:** done

- [x] `node --test skills/review-loop/scripts/test/` green
- [x] Running `node skills/review-loop/scripts/usage.mjs` on a real session shows `hit=` and `MODEL SWITCHES`
