Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md)

# 08: REVIEW.md for recurring finding classes

**What to build:** recurring defects stop costing a review round on every PR. In the commit step before the round it expects to pass, the main session lists each `must-fix` class from the log and proposes, per class, a `REVIEW.md` entry (class name, one-line rule, one short example) at the repo root, or a lint rule when the project's linter can express it; a class that recurs although `REVIEW.md` lists it is proposed as a lint rule. The user approves each entry; approved entries ship in the same PR. No file is created until the first entry is approved. The reviewer's Standards axis treats `REVIEW.md` as a documented standard, and the implementer reads it with the ticket.

**Blocked by:** 04

**Status:** done

- [x] `review-loop` has the proposal step before the round expected to pass, with per-entry user approval
- [x] Entry format defined once, in `review-loop`
- [x] Reviewer Standards axis lists `REVIEW.md` among documented standards
- [x] `agents/implementer.md` reads `REVIEW.md` when present
