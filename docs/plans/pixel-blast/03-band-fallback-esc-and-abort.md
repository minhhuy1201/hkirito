# 03: Band fallback, Esc and abort

Spec: [docs/specs/pixel-blast.md](../../specs/pixel-blast.md)

**What to build:** When the terminal is too narrow for an unasked pane, the report draws in the band above the prompt instead, yielding to a survey. Esc closing the pane, or the turn being interrupted, counts as cancel. A hot reload during a hold fails closed: the held call is refused and the pane is cleared.

**Blocked by:** 01

**Status:** partial

- [x] `$.ui.open` answering `isPlaced: false` draws the report in `AbovePrompt`, with working hotkeys
- [x] The band passes with `next(e)` when `hasSurvey` is set or nothing is held
- [ ] Esc (person closes the pane) denies the call (implemented, not covered by a test: the test kit cannot raise a person-origin close)
- [ ] `next.signal` aborting ends the wait and denies the call (implemented, not covered by a test)
- [x] The report lives in `$.state`; `session.start` clears any leftover hold and closes the pane after a reload
- [ ] Tests cover each path (band fallback is covered; Esc and abort are not)
