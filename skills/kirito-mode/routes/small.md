# Route: small

A short, contained change. No spec. A plan only when it spans several files.

1. **Size it.** Count the files the change touches.
   - One or two files, no interface change: go to step 3.
   - Several files, or an interface change: step 2.
2. **Plan.** Run `to-tickets` for the change. Wait for the user to approve the breakdown. Tickets land in `docs/plans/<slug>/`.
3. **Implement.**
   - Behaviour you can test at a seam: run `tdd`.
   - Pure UI or styling with no cheap test: make the change, run the app (use the `run` skill when present) and look at the result. State what you looked at. Prefer no test over a test that only checks mocks.
4. **Finish.** Follow the Finish section of `SKILL.md`.

If the task grows past this (new behaviour, decisions the user has not made), say so and switch to the `feature` route.
