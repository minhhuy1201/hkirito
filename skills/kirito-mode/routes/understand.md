# Route: understand

Read-only. Change nothing, except the notes file that `research` writes.

- **How does it work?** Run `how`.
- **Why is it this way?** Run `why`.
- **How does an outside system or API behave** (a library, a vendor API, a spec): run `research`. It starts one background agent that reads primary sources and writes a Markdown file citing each claim. Read that file before you answer.
- **Help me understand it** (a subsystem, a diff, a change), or both of the above: run `explain`.
- **Learn a whole new topic over several sessions:** suggest the user run `/learn`. It is user-only, so do not invoke it.

End with the answer and the `file:line` evidence. If the user then wants a change, re-route with `Route:`.
