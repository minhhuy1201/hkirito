Spec: [sync-upstream-2026-11-27](../../specs/sync-upstream-2026-11-27.md)

# 02: flow-map evidence rules and reader's-answer check

**What to build:** `flow-map` traces repository flows with archify v3.3.2's stricter evidence rules and checks the finished diagram against the question before output. Source of the method: the local archify clone at `/Users/huy.dao/github-stuff/archify`, commit `d6b0f71f2`, file `archify/references/repository-authoring.md` (diff it against `a7ed6fd66` to see what is new, and read its "Check the reader's answer" section). Rewrite in `flow-map`'s own voice and Mermaid terms; copy no archify sentence.

**Blocked by:** None (can start immediately)

**Model:** sonnet - adds new rules in prose that need judgment, no existing pattern to copy

**Status:** done

- [x] The "Follow what runs" step of "Trace from evidence" covers: every supported branch of a dispatcher, with optional paths labelled by their enabling condition; each direction of a round trip traced separately, including a return through a relay; a state transition taken from the branch that assigns the next state, so an error label alone is not a state; every clause of a shortcut or fallback condition kept
- [x] A new "Check the reader's answer" step sits before Output: answer the original question from the finished diagram alone (who initiates each arrow, who receives it, what crosses it; what selects each branch), compare with the source, and fix the diagram on a mismatch. It applies to repository mode and planned mode
- [x] No `authoring-defaults` notes are ported
- [x] Provenance comment and the archify section of `THIRD_PARTY.md` record the additions from `d6b0f71f2`
- [x] The skill still reads as one procedure: no duplicated rule between steps
