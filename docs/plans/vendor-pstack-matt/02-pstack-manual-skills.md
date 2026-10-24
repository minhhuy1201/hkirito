Spec: [vendor-pstack-matt](../../specs/vendor-pstack-matt.md)

# 02: pstack manual-only skills

**What to build:** the author can type `/sharpen` to deepen a task prompt and `/correct` to turn repeated agent mistakes into structural fixes.

**Blocked by:** None (can start immediately)

**Status:** todo

- [ ] `sharpen` and `correct` are vendored from cursor/plugins pstack at the commit read for the spec
- [ ] Each keeps `disable-model-invocation: true` and has a provenance comment
- [ ] Neither mentions `poteto-mode`, `arena`, `swarm`, `pstack-models`, or a principle skill hkirito does not ship
- [ ] `THIRD_PARTY.md` lists both under pstack with the same commit
