Spec: [vendor-pstack-matt](../../specs/vendor-pstack-matt.md)

# 07: interrogate in the feature route

**What to build:** when a design is contested, the `feature` route runs `interrogate` after `architect`. One fresh `reviewer` subagent attacks the design, and the main session sorts its findings into Act on, Consider, and Noted.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `interrogate` is ported: one fresh `reviewer` subagent with no `model` override, no reviewer table, no model fallbacks; it does not carry `disable-model-invocation`
- [x] Its reference files (reviewer prompt, rubric, lead judgment, code-quality lens) are vendored and cleaned of multi-model wording
- [x] The lead-judgment buckets stay, and changes are never auto-applied
- [x] The `feature` route runs it after `architect` only when the design is contested, and says what counts as contested
- [x] Provenance comment marks it as ported; `THIRD_PARTY.md` lists it
