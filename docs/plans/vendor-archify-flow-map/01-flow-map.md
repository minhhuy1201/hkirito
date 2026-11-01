Spec: [vendor-archify-flow-map](../../specs/vendor-archify-flow-map.md)

# 01: flow-map skill and its three call sites

**What to build:** a model-invocable `flow-map` skill, ported from archify's method, that draws Mermaid flows with an evidence table; the `feature` route adds a `## Flows` section to the spec with it, the `understand` route runs it on request, `how` points to it for diagrams, and `pr-sketch` reuses a spec's flow.

**Blocked by:** None (can start immediately)

**Model:** sonnet

**Status:** done

Files:

- New `skills/flow-map/SKILL.md`, with the provenance comment `<!-- ported from tt-a1i/archify@a4065941 (Apache-2.0), modified: Mermaid output, no CLI, see THIRD_PARTY.md -->`. Sections: Pick the view, Trace from evidence, Compose, Planned mode, Output. Sources to condense: `archify/SKILL.md` (Type router, Mermaid input), `archify/references/repository-authoring.md`, `archify/references/authoring-defaults.md` (Composition and meaning, Dataflow lineage) in the archify checkout at that commit.
- New `skills/flow-map/LICENSE`: a copy of archify's `LICENSE`.
- `skills/kirito-mode/routes/feature.md` step 3 and the `feature` flow line in `skills/kirito-mode/SKILL.md`.
- `skills/kirito-mode/routes/understand.md`.
- `skills/how/SKILL.md`, the mermaid line under Output.
- `skills/pr-sketch/SKILL.md`, a reuse rule.
- `THIRD_PARTY.md`: an archify section with source, commit, NOTICE copyright lines, Apache-2.0, "Used in: `flow-map` (ported)".
- `README.md`: `flow-map` in the routes table.

Acceptance:

- [x] `skills/flow-map/SKILL.md` has `name: flow-map`, a `description`, and no `disable-model-invocation`
- [x] A search of `skills/flow-map` finds no `archify.mjs`, `finalize`, or `npx`, and `SKILL.md` has no `http` URL (the verbatim `LICENSE` keeps the Apache URL)
- [x] The provenance comment and `THIRD_PARTY.md` name commit `a4065941`
- [x] Every skill name the changed routes and skills mention exists in `skills/` or is a known external skill
- [x] Dry run on the archify checkout ("how does `finalize` deliver an artifact"): one `sequenceDiagram` plus an evidence table; three citations read back and match
- [ ] Mermaid blocks render in the GitHub preview of the PR - checked when the PR is open
