# Route: feature

New behaviour or a design change across modules. Spec first, then a plan, then test-first code.

0. **Too big?** If the task is too big and foggy for one session to hold (greenfield project, whole subsystem), stop and suggest `/wayfinder` to chart the decisions first. `wayfinder` is user-only. Run each slice it resolves through this route.
1. **Ground (optional).** If the area is unfamiliar, run `how` on it so the interview starts from facts.
2. **Grill.** Run `grill-with-docs`. It interviews the user one round at a time and records terms in `GLOSSARY.md` and decisions in ADRs. If a question needs a runnable answer (state, business logic, a UI to see), run `prototype`, then bring the answer back. Keep steps 2-5 in one context window.
3. **Spec.** Run `to-spec`. It writes `docs/specs/<feature>.md` with `Status: draft` and asks the user to confirm the test seams. Wait for the user to approve the spec. Do not start tickets on a draft.
4. **Design (optional).** If the work crosses a module boundary or adds an interface, run `architect` and keep its sketch with the spec. If the design is contested (several valid shapes, an interface other code will depend on, or a choice that is costly to undo), run `interrogate` on the sketch before you write tickets. It dispatches one fresh `reviewer`; act on its "Act on" findings and show the user the rest. Skip it for routine designs.
5. **Plan.** Run `to-tickets`. It writes `docs/plans/<feature>/NN-<slug>.md`, one vertical slice per file, with blocking edges. Write each ticket so a fresh session can do it cold: a reader with no memory of this conversation must be able to start. Wait for the user to approve the breakdown.
6. **Implement.** For each ticket, blockers first: run `tdd` at the seams agreed in the spec. Mark the ticket `Status: done` when its acceptance criteria pass. Run typecheck between tickets and the full suite after the last. On a long feature, suggest `/clear` between tickets, since each ticket is self-contained. For long or unattended work, keep a decision log with `show-me-your-work`.
7. **Finish.** Follow the Finish section of `SKILL.md`. Commit per ticket or once per feature, whichever keeps each commit reviewable.
