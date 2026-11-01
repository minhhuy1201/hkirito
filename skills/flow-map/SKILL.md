---
name: flow-map
description: "Draw a flow as Mermaid in Markdown: business workflow, data flow, UI journey, request path, system map, state, or schema. Use for 'show me the flow', 'how do the screens connect', 'where does this data go', when a spec needs a `## Flows` section, or when an answer needs a diagram traced from code with `file:line` evidence."
---
<!-- ported from tt-a1i/archify@a4065941 (Apache-2.0), modified: Mermaid output, no CLI, see THIRD_PARTY.md -->

# Flow map

Answer one question with one Mermaid diagram that renders on GitHub with nothing installed. Two modes:

- **Repository mode** traces existing code. Every node is backed by a `file:line` in an evidence table.
- **Planned mode** draws behaviour that does not exist yet, for a spec. No file paths.

## Pick the view

Choose the view from the question, not from what the code contains.

| Question | View | Mermaid |
|---|---|---|
| What is it made of, what talks to what? | System map | `flowchart TB`; `subgraph` only for a real boundary (process, deployment, trust, persistence) |
| What steps does the business process take? | Business workflow | `flowchart TD`; gates and conditions as decision nodes `{...}` |
| What happens on one request or call? | Request path | `sequenceDiagram`; `-)` for async, `alt` / `opt` for branches |
| Where does data come from and where does it land? | Data flow | `flowchart LR`; every edge labelled with the data's shape |
| How do the screens connect? | UI journey | `flowchart LR`; node = screen as `route · Component`, edge = the user action |
| Where does a record or job stand? | Status and state | `stateDiagram-v2`; terminal states to `[*]`, retries as real transitions back |
| What are the tables and keys? | Schema | `erDiagram`; keys (`PK`, `FK`, `UK`) and cardinality |

When the subject has several parts (say a system map plus the request path of its main call), draw a short series, one diagram per question, each with its own heading. Do not merge two questions into one diagram.

## Trace from evidence

Repository mode only. The source is the authority; a README, a package description, or a config value is a lead, not a fact.

1. **Freeze identity.** Record `git rev-parse --short HEAD` and `git status --short`. Cite committed lines only; if a path you cite is dirty, say so under the diagram.
2. **Map the slice.** Start at the entry point for the question (route, command, handler, job, exported function) using manifests, registrations, and config. Follow imports and call sites until the flow reaches its real input, output, or side effect. Read a small connected slice; do not scan the repo for a convenient label.
3. **Trace ownership.** Draw each edge from the code that actually performs it. An edge to a file, database, queue, or API starts at the code that reads or writes it, not at the caller that asked for it. A pure in-memory transform receives and returns values; it does not own the I/O around it. A configured provider, an injected adapter, a stub, and a real service are different claims: label the one the source shows.
4. **Follow what runs.** Trace real branches, retries, fallbacks, and error paths. Code that is exported or configured but never called on the normal path is optional: leave it off the runtime path, or show it dashed and labelled `optional`. For a state change or a permission, trace to the actual write or check and the condition that guards it; an upstream caller alone does not prove the condition.
5. **Record evidence while reading.** Read with line numbers (`nl -ba <file> | sed -n '40,90p'`) and copy start and end lines from what you see. Keep each fact with its location as you go.
6. **Name uncertainty.** Resolve an open question by reading the next relevant range, or keep it as an unknown on the diagram (see Compose). Never turn a name into an unobserved behaviour.

Stop when every node and edge the question needs is backed by a line you read and the remaining unknowns cannot change the picture. There is no node or citation count to hit.

## Compose

- **Lead with the main path.** The reader's main journey reads top to bottom or left to right; branches, stores, and error paths hang off the node that owns them.
- **Group only for a reason.** Merge cooperating code into one node when splitting would not answer the question. Split when merging would hide who owns an action, a trust or persistence boundary, or a state the reader asked about. Discovering a helper does not earn it a node.
- **Conditions on the edge.** An approval, permission check, feature flag, or state guard goes on the edge or decision node it affects. A note elsewhere cannot make an unconditional arrow conditional.
- **Labels carry meaning.** Label an edge with the action, the data, the protocol, or `async`. Omit a label only when both ends already say it. Keep labels short; detail goes in the evidence table.
- **Data flow lineage.** Work backward from each output to the values its producer actually consumes. A step that combines two inputs gets one labelled edge from each. A node may only pass on values it actually produces. Name a store by its real table, file, or bucket.
- **Unknowns stay visible.** Mark an unresolved node or edge with a `?` prefix in its label and list it under **Unknowns** below the diagram.
- **Async and optional.** Use `-.->` for an async or optional edge and say which in its label.
- **Readable size.** Mermaid lays out automatically, so a crowded diagram cannot be fixed by placement. When one passes roughly 15 nodes, regroup or split into a series.
- **Mermaid that renders on GitHub.** Node IDs are plain words (`orderApi`), labels go in quotes when they hold punctuation (`orderApi["POST /orders"]`), no `click` directives, no inline `style`; use `classDef` for classes.

## Planned mode

For a spec, or any behaviour that is not built yet.

- No file paths, line numbers, or function names: name the behaviour, screen, or store, so the diagram does not go stale before the code exists.
- Mark what the feature adds with a `new` class; existing parts stay plain:

  ````markdown
  ```mermaid
  flowchart LR
      cart["Cart"] -->|checkout| pay["Payment"]:::new
      pay -->|paid| confirm["Order confirmed"]
      classDef new stroke-width:3px,stroke-dasharray:4 2
  ```
  ````

- In the `feature` route, add a `## Flows` section to the spec after `## Solution`, with the views the feature needs among business workflow, data flow, and UI journey. Skip a view that would only restate the Solution.

## Output

For each diagram, in this order:

1. A `###` heading naming the question it answers.
2. The `mermaid` block.
3. Repository mode: `Traced at <short sha>.` plus any dirty cited paths.
4. Repository mode: the evidence table, one row per node (and per edge whose owner is not obvious):

   | Node | Evidence | Proves |
   |---|---|---|
   | `orderApi` | `src/api/orders.ts:42-58` | handles `POST /orders`, validates the body |

5. **Unknowns**, when any: one line each, beside the claim they affect.

Then one or two sentences with the takeaway, only when it is not already obvious from the picture. State a deliberately narrowed scope or an omitted part a reader would expect. Do not recap the steps you took.
