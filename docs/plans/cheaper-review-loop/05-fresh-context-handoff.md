Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md)

# 05: Fresh-context handoff for the pr route

**What to build:** the `pr` route runs in a clean context. The review log moves to a per-branch file under the repo's git directory (resolved with `git rev-parse --git-path`), so it survives `/clear` and is never tracked, and gains a `## Handoff` section: spec and plan paths, base, branch, ticket list with status, check commands, delegate on or off, last snapshot reviewed. Step 0 of the `pr` route: when the session did other work first, write the handoff and stop with one message telling the user to `/clear`, switch the main session to Sonnet 5.5, and run `/kirito-mode pr <log path>`. When the `pr` route is the session's first work or was started with a log path, skip step 0 and resume from the log.

**Blocked by:** 04

**Status:** done

- [x] Review log path is under the git directory, per branch, per worktree
- [x] `## Handoff` holds everything listed above, enough to resume without re-exploring
- [x] `pr` route step 0 writes the handoff and stops with the exact resume command and the Sonnet switch
- [x] Step 0 is skipped in a fresh session or when given a log path
- [x] Router accepts `pr <log path>` and routes it to `pr`
