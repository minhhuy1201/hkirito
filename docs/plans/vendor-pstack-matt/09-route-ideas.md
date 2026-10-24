Spec: [vendor-pstack-matt](../../specs/vendor-pstack-matt.md)

# 09: playbook ideas in bug, refactor, and the router

**What to build:** the `bug` route reverts code motivated by a hypothesis that evidence refuted. The `refactor` route subtracts before adding and reverts a change that does not lower reader load. The router sends an empirical question to `prototype` instead of asking the user.

**Blocked by:** 03 (both edit the `bug` route)

**Status:** todo

- [ ] The `bug` route says to revert what a refuted hypothesis motivated
- [ ] The `refactor` route keeps its "Lock behaviour" step, adds subtract-before-add, and ends with a reader-load check that reverts a change that does not lower it
- [ ] The router's rules send a question that running something can answer to `prototype`, and keep asking the user for intent and preference
- [ ] `THIRD_PARTY.md` credits the pstack playbooks for these ideas
