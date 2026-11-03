# 01: design-taste-frontend makes no network calls of its own

**What to build:** the vendored `design-taste-frontend` (taste-skill@12af471f) stops before any outbound request, the same way `archify` was vendored. Open-collection search and download in `scripts/assets.mjs` print a notice and exit 1. `--credits` and `--help` still run. Every instruction that told the agent to run that search is removed or rewritten. Built pages may still load picsum.photos photographs and Google Fonts in the browser; this ticket does not change that.

**Blocked by:** None (can start immediately)

**Model:** sonnet

**Status:** done

Files:

- `skills/design-taste-frontend/scripts/assets.mjs`: the dispatch guard after `--credits`, plus the header comment and `USAGE` note.
- `skills/design-taste-frontend/scripts/draw.mjs`: the imagery sheet text, `ASSETS_CMD`, and the unused `assetQueries`.
- `skills/design-taste-frontend/scripts/lib/rules.mjs`: hints for `few-pictures`, `no-real-pictures`, `no-footage`.
- `skills/design-taste-frontend/SKILL.md`, `README.md`, `references/imagery.md` (§3, §11), `references/scenes.md`.
- `THIRD_PARTY.md`, `README.md` Credits, `docs/specs/pixel-blast.md` (design source renamed).

Acceptance:

- [x] With a preload that turns `fetch` into exit 9, `assets.mjs "ghent postcard"`, `--get commons:1` and `--video river` exit 1 with the notice, never 9
- [x] `assets.mjs --help` exits 0, and `--credits` reads `credits.json` without fetching
- [x] The sheet `draw.mjs` prints does not mention `assets.mjs`
- [x] `node --check` passes on every script
- [x] The provenance comment and `THIRD_PARTY.md` list the changes
