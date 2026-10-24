Spec: [vendor-pstack-matt](../../specs/vendor-pstack-matt.md)

# 01: Matt manual-only skills

**What to build:** the author can type `/wait-what`, `/to-questionnaire`, and `/wizard` in any session. None of them loads into a session unless typed.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `wait-what`, `to-questionnaire`, and `wizard` (with its template script) are vendored from mattpocock/skills at the commit read for the spec
- [x] Each has `disable-model-invocation: true` and a provenance comment naming upstream, commit, and copied or adapted
- [x] No reference to `setup-matt-pocock-skills` or an issue tracker remains
- [x] `wizard`'s template script passes `bash -n`
- [x] `THIRD_PARTY.md` lists all three under mattpocock/skills with the same commit
