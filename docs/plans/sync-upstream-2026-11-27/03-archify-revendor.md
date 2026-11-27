Spec: [sync-upstream-2026-11-27](../../specs/sync-upstream-2026-11-27.md)

# 03: Re-vendor archify v3.3.2 core

**What to build:** the vendored archify in `skills/archify` is upstream v3.3.2 with the renderer and checker fixes, without the code-analysis and PR modules, and with hkirito's existing local patches re-applied, so it renders and checks diagrams offline and makes no network call of its own. Upstream: local clone `/Users/huy.dao/github-stuff/archify`, commit `d6b0f71f2`, folder `archify/`. The existing patches are listed in the archify section of `THIRD_PARTY.md`; read the current vendored files for their exact form before replacing them. Known cross-references into the removed dirs (from a static scan): the `start`, `code-analysis`, and `pr` cases of the CLI entry, the finalize Diagnosis offer (already in a try/catch), `doctor`'s checks, package scripts `code-analysis` and `test:code-analysis`, a dead link in `references/delivery-contract.md`, mentions in `SKILL.md` and `references/pr-review.md`, and notices in `THIRD_PARTY_NOTICES.md`. Keep `story/`: the SVG bake imports its HTML parser.

Do not install, fetch, or run any package or tool not already in the project (uvx, pipx, pip install, npx -y, npm i, brew install...). If you need one, stop and report the exact command and why.

**Blocked by:** None (can start immediately)

**Model:** sonnet - many files and patch points, but no data migration or performance target

**Status:** done

- [x] `skills/archify` matches upstream `archify/` at `d6b0f71f2` except: no `modules/`, no `pr/`, no rendered example HTML, no `references/update-awareness.md`, and the patches below
- [x] Update check always off (`updatesDisabled()` returns true without reading the environment) and the background refresh is guarded the same way as before
- [x] Remote brand capture returns unavailable, and the CLI, diagnostics, and docs no longer point to it
- [x] The `start`, `code-analysis`, and `pr` subcommands are gone from the CLI and its help, or exit with a clear "not in this copy" message; `doctor` does not fail on the removed modules
- [x] `SKILL.md`, references, package scripts, and `THIRD_PARTY_NOTICES.md` mention no code analysis, PR workflow, or removed vendored code; no dead relative link remains
- [x] Offline smoke: for each diagram type, render one upstream example JSON with the vendored CLI and run `check` on the output; all pass. `export-svg` runs on one diagram when a local Chrome exists, otherwise noted as skipped
- [x] `grep` finds no reference to `modules/` or `pr/` paths in the vendored tree
