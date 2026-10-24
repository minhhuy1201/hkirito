Spec: [vendor-pstack-matt](../../specs/vendor-pstack-matt.md)

# 08: wayfinder and the decision log in the feature route

**What to build:** a foggy task too big for one session goes to `wayfinder`, which charts a map of decision tickets as files under the plans folder. Long or unattended work keeps a TSV decision log through `show-me-your-work`. Feature tickets are readable cold, and the route suggests `/clear` between tickets on long features.

**Blocked by:** 07 (both edit the `feature` route)

**Status:** done

- [x] `wayfinder` is adapted: the map and its decision tickets are Markdown files under the plans folder, blocking is written in each ticket, and no issue tracker or `setup-matt-pocock-skills` is needed; it keeps `disable-model-invocation: true`
- [x] `show-me-your-work` is ported: log script and template copied, transcript audit replaced by a git and files audit, one fresh `reviewer` reviews the trail only when it is committed; model-invocable, with references to `poteto-mode` and principle skills removed
- [x] `show-me-your-work`'s log script writes a header and one row to a scratch file
- [x] The `feature` route and the router's signals send too-big, foggy work to `wayfinder` instead of "run in slices"
- [x] The `feature` route uses `show-me-your-work` for long or unattended work, requires each ticket to be readable cold, and suggests `/clear` between tickets on long features
- [x] `THIRD_PARTY.md` lists both
