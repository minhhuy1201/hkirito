---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
---
<!-- ported from cursor/plugins pstack@101b274 (MIT), inline version, see THIRD_PARTY.md -->

# How

Answer "how does X work?" at the level of a senior engineer onboarding onto a subsystem: enough to build a working mental model, not annotated source code. Read-only.

## Process

1. If the scope is ambiguous, state your interpretation in one line and proceed. The user can redirect.
2. Trace the code yourself with Read, Grep, and Glob. Start at the entry point (route, command, event handler, exported function) and follow the flow to where data lands.
3. For a subsystem too wide to hold in one pass (many services or packages), dispatch one `Explore` subagent per angle, at most 3, in a single message, each with a distinct slice. Merge their findings and check any contradiction in the code yourself. For anything narrower, stay inline: subagents cost tokens.
4. Check every claim against code you read this session. Cite `file:line`. Mark anything you inferred without reading as unknown.

## Output

Use the sections that apply, drop the rest.

- **Overview.** What it is, what it does, why it exists. 1-2 paragraphs.
- **Key concepts.** The types, services, or abstractions needed to follow the rest. Brief.
- **How it works.** The longest section. What triggers it, each step, where data goes, the decision points. Prose with `file:line` references, no large code blocks. Add a mermaid diagram only when several components talk to each other or data changes shape across stages; pick and compose it with `flow-map`.
- **Where things live.** A short file map.
- **Gotchas.** Surprising behaviour and pitfalls. Skip when there are none.

Name concrete things: "`UserService` calls `AuthClient.refresh()`", not "the service delegates to the client". When something is complex, say why. When it is simple, do not pad. Acknowledge gaps instead of hiding them.
