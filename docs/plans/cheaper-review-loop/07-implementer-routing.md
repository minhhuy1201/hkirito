Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md)

# 07: Implementer model routing and escalation

**What to build:** every ticket says which model implements it. `to-tickets` adds a `Model:` line, `haiku` or `sonnet`, with a one-line reason; `haiku` only when the ticket touches at most 2 files, follows a pattern that already exists in the repo (named in the ticket), and adds no business logic, branching rule, or interface change. The user can change it when approving tickets. In delegate mode the main session dispatches `implementer` with the ticket's model as the `model` override; tickets without the line use the agent's Sonnet default. A `haiku` ticket whose implementer hands back failing checks twice, or that draws a `must-fix` in review, is re-dispatched once on Sonnet with the previous hand-back and findings; the ticket records `Escalated: haiku → sonnet (<reason>)`, the review log notes it, and later fixes for that ticket also run on Sonnet.

**Blocked by:** 06

**Status:** done

- [x] `to-tickets` template and rules include `Model:` with the haiku criteria
- [x] `feature` route dispatches `implementer` with the ticket's model, replacing "no `model` override" for implementers only
- [x] Escalation trigger, single re-dispatch, and records are written in the `feature` route and `review-loop`
- [x] `agents/implementer.md` frontmatter default stays Sonnet
