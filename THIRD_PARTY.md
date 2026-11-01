# Third-party notices

Skills in this repo are copied from, or adapted from, the projects below. `mattpocock/skills` and `cursor/plugins` are MIT licensed; `tt-a1i/archify` is Apache-2.0. Each copied `SKILL.md` carries a provenance comment naming its source and commit.

## mattpocock/skills

- Source: https://github.com/mattpocock/skills, commit `49dd158`
- Copyright (c) 2026 Matt Pocock
- Used in: `grilling`, `grill-with-docs`, `domain-modeling`, `tdd`, `codebase-design`, `diagnosing-bugs`, `prototype`, `improve-codebase-architecture`, `retro`, `handoff`, `writing-for-agents`, `to-spec` (adapted), `to-tickets` (adapted), `learn` (renamed from `teach`)
- Added at commit `5beb35b`: `wait-what`, `to-questionnaire`, `wizard`, `research` (copied), `wayfinder` (adapted: map and tickets are files, no issue tracker), and the two review axes plus the smell baseline in `review-loop` (adapted from `code-review`)
- Synced at commit `7739eae`: the fresh-context line in `grilling`, `research`, `improve-codebase-architecture`, `codebase-design`; plus the idea from `implement-spec` at `a496f55` (a fresh implementer per ticket) in the `feature` route's delegate mode

## cursor/plugins, pstack

- Source: https://github.com/cursor/plugins/tree/main/pstack, commit `101b274`
- Copyright (c) 2026 Lauren Tan
- Ideas from the `poteto-mode` playbooks (refuted hypotheses are reverted, subtract before adding, reader load as the refactor test, run it before you ask) live in the `bug` and `refactor` routes and the router's rules.
- Used in: `unslop` (copied), `how`, `why`, `explain` (renamed from `teach`), `architect` (ported to run inline, without the multi-model arena), and the comment keep-list in `tidy`
- Added at commit `9580c23`: `sharpen`, `correct`, `statechart` (with its scripts and tests), `create-formal-verification-skill`, `maintain-formal-verification-skill` (all copied), `blast-radius` (ported to run inline, without the multi-model arena), `interrogate` (ported, then re-ported at `ab1f702`, see below), `show-me-your-work` (ported: no transcript audit, one fresh `reviewer` for the independent review)
- Re-ported at commit `ab1f702`: `interrogate` (one fresh worktree adversary, findings proven by a run, references removed)
- Ideas from `ab1f702`: restate the goal (`poteto-mode`) in `kirito-mode`, must-fix needs evidence (Autopilot playbooks) in `review-loop`, write the decision before measuring (`principle-explain-the-number`) in the `bug` route

## tt-a1i/archify

- Source: https://github.com/tt-a1i/archify, commit `a4065941`
- Copyright (c) 2026 tt-a1i (Archify)
- Copyright (c) 2025 Cocoon AI
- License: Apache-2.0, full text in `skills/flow-map/LICENSE`
- Used in: `flow-map` (ported). The method only: its Type router and Mermaid input (`archify/SKILL.md`), `references/repository-authoring.md`, and the Composition and meaning and Dataflow lineage parts of `references/authoring-defaults.md`, condensed and rewritten for Mermaid output. No code, schema, example, viewer, or CLI was taken. The UI journey view is an hkirito addition.
- Used in: `archify` (vendored). The `archify/` package copied at the same commit, with its own `LICENSE`, `NOTICE`, and `THIRD_PARTY_NOTICES.md`. Changes: the update check is always off (`scripts/check-update.mjs`, `bin/delivery-update.mjs`), remote brand capture returns unavailable and the CLI and diagnostics no longer point to it (`renderers/shared/brand-marks.mjs`, `bin/archify.mjs`, `references/brand-marks.md`, `schemas/README.md`, `brand-marks/README.md`), `references/update-awareness.md` and the rendered demo HTML under `examples/` are removed, and `SKILL.md` is user-invoked only, with the update notice and the proactive explainer modes removed (also in `references/explainer-authoring.md`).

## MIT License text

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
