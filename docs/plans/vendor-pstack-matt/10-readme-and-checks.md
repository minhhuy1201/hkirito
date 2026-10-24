Spec: [vendor-pstack-matt](../../specs/vendor-pstack-matt.md)

# 10: README and whole-harness checks

**What to build:** a teammate who clones hkirito sees the new flow in the README and gets every new skill from the existing install loop. Every check in the spec's Testing Decisions passes.

**Blocked by:** 01, 02, 03, 04, 05, 06, 07, 08, 09

**Status:** todo

- [ ] The README flow diagram shows `blast-radius` in `pr`, `interrogate` and `wayfinder` in `feature`, and `research` in `understand`
- [ ] The README lists the manual-only skills and notes `statechart`'s first-run download
- [ ] Every `SKILL.md` has `name` equal to its folder and a `description`; manual-only skills carry `disable-model-invocation: true` and skills a route names do not
- [ ] A search of all skills finds no `arena`, `swarm`, `poteto-mode`, `pstack-models`, `grok`, `setup-pstack`, or `setup-matt-pocock-skills`
- [ ] Every skill name a route or skill mentions exists in the repo or is a known external skill
- [ ] Every new skill's provenance comment and `THIRD_PARTY.md` entry name the same commit
- [ ] The install loop from the README, run against a scratch `HOME`, links every skill folder
