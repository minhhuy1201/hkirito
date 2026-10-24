Spec: [vendor-pstack-matt](../../specs/vendor-pstack-matt.md)

# 03: statechart and formal verification

**What to build:** the author can type `/statechart` to draw a TLA+ model as a chart, or turn an agreed chart into a TLA+ skeleton, and can generate and maintain a project-local formal verification skill. The `bug` route suggests `/statechart` for state or ordering bugs.

**Blocked by:** None (can start immediately)

**Status:** todo

- [ ] `statechart` is vendored with its scripts and their tests; its own test suite passes from the new location
- [ ] `create-formal-verification-skill` and `maintain-formal-verification-skill` are vendored and point at each other by their hkirito names
- [ ] All three keep `disable-model-invocation: true` and have provenance comments
- [ ] References to `how` and `why` resolve to hkirito's skills; no reference to `poteto-mode`, `arena`, or `swarm` remains
- [ ] The `bug` route suggests `/statechart` for bugs about states or ordering, as a suggestion to the user, not an invocation
- [ ] `THIRD_PARTY.md` lists all three
