Spec: [sync-upstream-2026-11-27](../../specs/sync-upstream-2026-11-27.md)

# 04: archify - turn off v3.3.2's new unasked behaviour

**What to build:** the vendored archify never makes a page unasked, carries no upstream branding footer by default, and its instructions never tell the agent about update notices. Upstream v3.3.2 made Explainer mode `proactive` by default, added a GitHub Star and Feedback footer to every page (hidden by `meta.feedback_links: false`), and added in-page update notice instructions. Keep the update-notice code (it is inert with the update check off) so later syncs stay simple.

**Blocked by:** 03

**Model:** sonnet - changes defaults in code and docs, no existing pattern

**Status:** done

- [x] `SKILL.md` is user-invoked only, with no proactive Explainer mode and no update-notice instructions; `references/explainer-authoring.md` agrees
- [x] Wherever the code or docs set the Explainer default, it is on-demand
- [x] A rendered page has no Star or Feedback footer unless the diagram turns it on
- [x] The archify section of `THIRD_PARTY.md` names `d6b0f71f2` as the source and lists every local change from tickets 03 and 04, and `skills/flow-map`'s LICENSE note still holds
- [x] Static checks from the spec pass: Explainer default on-demand, update check off, brand capture unavailable
