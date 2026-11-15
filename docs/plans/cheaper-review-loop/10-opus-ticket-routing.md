Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md)

# 10: Opus ticket routing

**What to build:** a ticket can say `Model: opus`. `to-tickets` checks the conditions in order, first match wins: `opus` when the ticket migrates a schema, stored data, or a wire format that existing data or other callers depend on, or when one of its acceptance criteria is a measured performance target; then the existing `haiku` conditions; then `sonnet`. In delegate mode the main session dispatches `implementer` with `model: opus` for such a ticket. An inline session stays on Sonnet, so the `feature` route's boundary message names the `opus` tickets and recommends `--delegate`. A review batch runs on Opus when any of its findings sits on an `opus` ticket. Escalation and retry by cause do not change.

**Blocked by:** 07

**Model:** sonnet - wording across several coupled docs

**Status:** done

- [x] `to-tickets` quiz line, rules, and template include `opus` with its two conditions, checked before `haiku`
- [x] `feature` route boundary message names `opus` tickets and recommends `--delegate`; the dispatch line lists all three values
- [x] `review-loop` batch fix runs on Opus when a finding sits on an `opus` ticket
- [x] `README.md`, `CLAUDE-huykrito.md`, and the spec name the third value
- [x] `agents/implementer.md` frontmatter default stays Sonnet
