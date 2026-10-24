Spec: [vendor-pstack-matt](../../specs/vendor-pstack-matt.md)

# 06: two-axis review in review-loop

**What to build:** each `review-loop` round reports findings under two separate axes, Standards and Spec, from one reviewer subagent. The Spec axis reports missing or partial requirements, scope creep, and wrong implementations, each quoting the spec line. The Standards axis checks the repo's documented standards plus a code-smell baseline, with the repo winning on conflict.

**Blocked by:** None (can start immediately)

**Status:** in progress

- [x] The reviewer prompt asks for both axes, the three Spec questions, and names the standards sources to read
- [x] The smell baseline (twelve Fowler smells, each a judgement call) lives beside `review-loop` as a reference file the reviewer reads
- [x] Each finding in the JSON output carries an axis; the main session relays findings grouped by axis and never reranks across axes
- [x] The final round through `pr-review` keeps that skill's template unchanged
- [ ] One round on a throwaway change that breaks a written standard and adds unrequested behaviour returns at least one finding on each axis (not run yet, left for ticket 10)
- [x] `THIRD_PARTY.md` credits Matt's `code-review` for the axes and the smell baseline
