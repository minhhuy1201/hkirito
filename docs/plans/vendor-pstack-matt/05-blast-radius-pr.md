Spec: [vendor-pstack-matt](../../specs/vendor-pstack-matt.md)

# 05: blast-radius in the pr route

**What to build:** before `review-loop` runs, the `pr` route runs `blast-radius` once over the whole change. It names the one fact the change is safe because of, proves it by running code or marks it unproven, and lists risks and cleared checks.

**Blocked by:** None (can start immediately)

**Status:** in progress

- [x] `blast-radius` is ported: it runs inline, the multi-model step is gone, and it does not carry `disable-model-invocation`
- [x] Its references to `how`, `why`, and `unslop` resolve to hkirito's skills
- [x] The `pr` route runs it before `review-loop` and relays its writeup to the user
- [ ] One run of the `pr` route on a throwaway change shows the blast-radius writeup before the first review round (not run yet, left for ticket 10)
- [x] Provenance comment marks it as ported; `THIRD_PARTY.md` lists it
