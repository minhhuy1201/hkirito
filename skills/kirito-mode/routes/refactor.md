# Route: refactor

Restructure with no behaviour change.

1. **Find the shape.** Use `codebase-design` for the vocabulary (module, interface, depth, seam). To survey for candidates first, run `improve-codebase-architecture`.
2. **Lock behaviour.** Before moving anything, make sure tests at the public seams cover current behaviour. Add missing ones with `tdd`, passing on the current code.
3. **Restructure in verifiable units.** One step at a time. Run the tests after each step. Migrate every caller and delete the old API in the same change; do not leave a compatibility layer.
4. **Finish.** Follow the Finish section of `SKILL.md`. Tests must pass unchanged, other than imports and paths.

If the restructure needs a design decision with several valid answers, run `architect` first. If it changes behaviour, switch to the `feature` route.
