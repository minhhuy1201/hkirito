Spec: [vendor-pstack-matt](../../specs/vendor-pstack-matt.md)

# 08: wayfinder and the decision log in the feature route

**What to build:** a foggy task too big for one session goes to `wayfinder`, which charts a map of decision tickets as files under the plans folder. Long or unattended work keeps a TSV decision log through `show-me-your-work`. Feature tickets are readable cold, and the route suggests `/clear` between tickets on long features.

**Blocked by:** 07 (both edit the `feature` route)

**Status:** todo

- [ ] `wayfinder` is adapted: the map and its decision tickets are Markdown files under the plans folder, blocking is written in each ticket, and no issue tracker or `setup-matt-pocock-skills` is needed; it keeps `disable-model-invocation: true`
- [ ] `show-me-your-work` is vendored with its log script and template, model-invocable, with references to `poteto-mode` and principle skills removed
- [ ] `show-me-your-work`'s log script writes a header and one row to a scratch file
- [ ] The `feature` route and the router's signals send too-big, foggy work to `wayfinder` instead of "run in slices"
- [ ] The `feature` route uses `show-me-your-work` for long or unattended work, requires each ticket to be readable cold, and suggests `/clear` between tickets on long features
- [ ] `THIRD_PARTY.md` lists both
