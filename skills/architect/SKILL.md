---
name: architect
description: "Sketch types, signatures, and module structure before code, then fill in implementation against the sketch. Use for /architect, 'design this', or non-trivial work that crosses a module boundary and would lock in the wrong shape if coded straight away."
---
<!-- ported from cursor/plugins pstack@101b274 (MIT), lite inline version without arena, see THIRD_PARTY.md -->

# Architect

Sketch types, function signatures, and module boundaries with `not implemented` bodies, then fill them in. One agent, inline. The deep-module vocabulary (module, interface, depth, seam) comes from `codebase-design`.

## Phases

1. **Ground.** Run `how` over each system the new code touches. Naming a file is not grounding. If the design changes ownership or layering, run `why` on the existing shape so its rationale becomes a constraint, not a guess. Skip only for greenfield work.
2. **Sketch twice.** Write the caller's usage first: the README or quickstart snippet and two or three realistic call sites. Derive the types from it. Produce two structurally different shapes (different module split or data model), not two flavours of one shape. Screen each against `design-red-flags.md`. Assume the next contributor is an agent that sees only the files it opened and copies the nearest example: prefer the shape where a change that looks right from one file is right for the whole repo.
3. **Choose.** Compare on interface depth: prefer the shape that hides more complexity behind a smaller public surface. A deep call chain is not a deep module. State the choice and what it gave up. Write the result using `rationale-template.md` (one page) next to the sketch. Show the user the sketch and stop for sign-off when they asked for a checkpoint; otherwise continue.
4. **Implement against the sketch.** Replace `not implemented` bodies with code, test-first via `tdd`. The sketch is the contract. A deviation is a signal: ask whether the sketch was wrong, a requirement was missed, or the implementation is overreaching. Surface it, do not absorb it silently.
5. **Scrap when the shape is wrong.** Watch for a pattern, not single cases: the same workaround across unrelated code, types that need `any` or casts to compile, callers that must know the abstraction's internal rules, two or more deviations of the same shape. Then re-run `how` on what exists, redesign as if the new constraints were day-one, subtract before adding, and return to step 2.

## Output

The usage sketch first, then the type sketch (one file for a small change; a module map plus type definitions for larger work), then the rationale.
