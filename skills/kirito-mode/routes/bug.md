# Route: bug

Reproduce first, fix the root cause, lock it with a test.

1. **Diagnose.** Run `diagnosing-bugs`. Do not theorise before a tight pass/fail feedback loop exists that goes red on this bug, as close as possible to how a user hits it. Redact secrets in anything you show.
2. **Fix.** Make the smallest change at the first place the system went wrong. A guard counts as a fix only when the state it handles is legitimate.
3. **Regression test.** `diagnosing-bugs` ends with a regression test at the right seam. If it did not, run `tdd` to add one that fails without the fix. If the seam is expensive, use the closest executable check and say why.
4. **Finish.** Follow the Finish section of `SKILL.md`.

If the bug depends on the order of events (a double submit, a cancel mid-flight, a retry, a lease that expires, parts that change independently) and `diagnosing-bugs` finds no tight loop, suggest the user run `/statechart`. It is user-only and downloads TLC on its first run, so do not invoke it.

If the real finding is that no seam exists to lock the bug down, tell the user and suggest the `refactor` route.
