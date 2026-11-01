# Spec: port archify's flow-tracing method into hkirito as `flow-map`

Status: approved

## Problem Statement

The author joins new projects often and starts each one without knowing its business flow, its data flow, or how its screens connect. Reading code file by file is slow, and an answer in prose is hard to hold in mind.

When the author builds a feature, the same gap appears in reverse: the spec describes the behaviour in words, and the author cannot see the flow before tickets are cut.

[Archify](https://github.com/tt-a1i/archify) solves the first problem: an agent traces a repository and renders an interactive HTML diagram whose nodes cite `file:line`. Installing it, though, means running third-party code on every diagram: an update `fetch` to `tt-a1i.github.io` on each `finalize` (`archify/scripts/update-contract.mjs:3`, `archify/scripts/check-update.mjs:1397`), outbound fetches for brand logos (`archify/renderers/shared/brand-marks.mjs:192`), and a headless Chrome launch (`archify/bin/visual-check.mjs:1591`). The author does not want to install it.

## Solution

Port archify's method, not its code. A new model-invocable skill, `flow-map`, tells the agent which view answers which question, how to trace a repository to evidence, and how to compose a readable diagram. It renders in Mermaid inside Markdown, so the diagram shows on GitHub and in the spec with nothing installed.

Three places call it:

- `feature` route, step 3: after `to-spec` writes the draft, `flow-map` adds a `## Flows` section to the spec, so the author approves the picture along with the words.
- `understand` route: "show me the flow" of a repository or feature runs `flow-map`.
- `pr-sketch`: when the PR's spec has a `## Flows` section, the PR sketch reuses a trimmed copy of it.

## User Stories

1. As the author new to a repository, I want to ask for its business flow and get a Mermaid diagram, so that I see the main journey without reading every file.
2. As the author new to a repository, I want to ask for its data flow and get a diagram whose edges name the data passing along them, so that I see where data comes from and where it lands.
3. As the author new to a repository, I want to ask how its screens connect and get a UI journey diagram, so that I know which route and component each screen is before I run the app.
4. As the author, I want each node of a repository diagram to cite `file:line` in a table under the diagram, so that I can check any claim in one click.
5. As the author, I want the diagram to name the commit it was traced at, so that I know when it went stale.
6. As the author, I want an edge to a store drawn from the code that actually reads or writes it, so that the diagram does not credit a caller with I/O it never does.
7. As the author, I want exported but unused code left off the runtime path, so that the diagram shows what runs, not what could run.
8. As the author, I want an unresolved fact marked as unknown on the diagram, so that a guess never looks like a fact.
9. As the author, I want one diagram per question, and a short series when the subject has many parts, so that no single diagram is too crowded to read.
10. As the author, I want approval gates, conditions, and async steps shown on the edge they affect, so that a conditional path never looks unconditional.
11. As the author building a feature, I want the spec to carry its business flow, data flow, and UI journey before I approve it, so that I catch a wrong flow before tickets are cut.
12. As the author building a feature, I want new nodes styled apart from existing ones, so that I see what the feature adds.
13. As the author building a feature, I want the spec's diagrams free of file paths, so that they follow the `to-spec` rule and do not go stale.
14. As a reviewer of the author's PR, I want the PR sketch to reuse the spec's flow, so that the PR and the spec show the same picture.
15. As the author, I want `flow-map` to run no third-party code and make no network call, so that using it carries no supply-chain risk.
16. As the author, I want the provenance and Apache-2.0 notice recorded, so that the port respects archify's license.

## Implementation Decisions

**Port, not vendor.** Archify's `schemas/` and most of its `references/` describe its JSON renderer and its validation gates, so they are useless without its CLI. Three parts carry over to Mermaid and are condensed into `flow-map`:

| Archify source (commit `a4065941`) | Becomes in `flow-map` |
|---|---|
| `archify/SKILL.md` Type router and Mermaid input | "Pick the view": question to Mermaid form |
| `archify/references/repository-authoring.md` | "Trace from evidence" |
| `archify/references/authoring-defaults.md`, Composition and meaning, Dataflow lineage | "Compose" |

**Views.** System map (`flowchart` with `subgraph` only for a real boundary), business workflow (`flowchart`, gates as decision nodes), request path (`sequenceDiagram`), data flow (`flowchart LR`, each edge labelled with the data's shape), status and state (`stateDiagram-v2`), schema (`erDiagram` with keys). The UI journey (`flowchart`, node = screen as `route · component`, edge = the user action) is an hkirito addition: archify has no UI view.

**Two modes.** Repository mode traces existing code and cites evidence. Planned mode draws behaviour that does not exist yet: no file paths, and new nodes carry a `new` class.

**Evidence table.** Mermaid has no per-node links, so the source citations go in a table under each diagram: node, `file:line`, and what the line proves.

**Not taken.** Any `.mjs` file, `schemas/`, `examples/`, the viewer, the update notifier, the explainer page, and archify's offer to edit the global rules file.

**License.** Archify is Apache-2.0. `skills/flow-map/LICENSE` ships the license text, the provenance comment states the file was modified, and `THIRD_PARTY.md` carries archify's `NOTICE` copyright lines.

## Testing Decisions

A good check tests what a user of the harness sees: the skill loads, its references resolve, and a route produces its diagram. It does not test wording.

- **Frontmatter.** `skills/flow-map/SKILL.md` has `name: flow-map` and a `description`, and no `disable-model-invocation`, since routes call it. Prior art: `docs/plans/vendor-pstack-matt/10-readme-and-checks.md`.
- **No code path back to archify.** A search of `skills/flow-map` finds no `archify.mjs`, `finalize`, or `npx`, and its `SKILL.md` has no `http` URL. The verbatim `LICENSE` keeps the Apache URL in its header, which is not a code path.
- **Provenance.** The provenance comment and the `THIRD_PARTY.md` entry name the same commit.
- **References resolve.** Every skill name the changed routes mention exists in `skills/`.
- **Dry run.** `flow-map` in repository mode on the archify checkout, asked how `finalize` delivers an artifact, produces one `sequenceDiagram` and an evidence table; three citations are read back and match.

## Out of Scope

- Interactive HTML output, validation gates, or any renderer.
- Installing Mermaid CLI to check syntax locally (machine scope). Syntax is checked in the GitHub preview.
- Syncing with later archify releases.

## Further Notes

- Upstream read for this spec: `tt-a1i/archify` at `a4065941f12be7967436261d9934784e381d423c`, Apache-2.0, files listed in the table above.
