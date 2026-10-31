Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md)

# 06: Inline fixes and main-session model switch points

**What to build:** in delegate mode, between rounds, the main session fixes inline any open finding whose fix touches at most 2 files and changes no interface (exports, signatures, schemas, wire formats), whatever its severity, except a `must-fix` on an unescalated `haiku` ticket, which escalates to Sonnet in the batch; the rest go to one fresh `implementer` for the whole batch with finding ids, classes, locations, the spec path, and the instruction to read only the listed files and what they import. Outside delegate mode nothing changes. The router asks the user to switch the main session to Opus 5.5 before grill, spec, tickets, or architect work, and to Sonnet 5.5 when delegate-mode implementation starts. The `reviewer` stays pinned to Opus and is dispatched with no `model` override.

**Blocked by:** 05

**Status:** done

- [x] Inline-fix rule written in `review-loop` for delegate mode, with the batch implementer dispatch for the rest
- [x] Router rules name every model switch point; the `pr` handoff message from 05 is the Sonnet switch for review
- [x] `feature` route's delegate step asks for the Sonnet switch before the first ticket
- [x] Nothing dispatches `reviewer` with a `model` override
