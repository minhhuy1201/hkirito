---
name: wayfinder
description: Plan a huge chunk of work (more than one agent session can hold) as a map of decision tickets in repo files, and resolve them one at a time until the way to the destination is clear.
disable-model-invocation: true
---
<!-- vendored from mattpocock/skills@5beb35b (MIT), adapted: the map and tickets are Markdown files under docs/plans, no issue tracker, see THIRD_PARTY.md -->

A loose idea has arrived, too big for one agent session, and wrapped in fog: the way from here to the **destination** is not visible yet. Wayfinding is about finding that way, not charging at the destination. This skill charts the way as a **map** in repo files, then works its **decision tickets** (questions whose resolution is a decision, not slices of a build to execute) one at a time until the route is clear.

The destination varies per effort, and naming it is the first act of charting: it shapes every ticket. It might be a spec to hand off and iterate on, a decision to lock before planning starts, or a change made in place like a data-structure migration.

## Plan, don't do

Wayfinder is **planning** by default: each ticket resolves a decision, and the map is done when the way is clear, with nothing left to decide before someone goes and does the thing. The pull to just do the work is usually the signal you have reached the edge of the map and it is time to hand off. An effort can override this in its **Notes**, carrying execution into the map itself, but absent that, produce decisions, not deliverables. The usual hand-off is `to-spec`, then `to-tickets`.

## Refer by name

Every map and ticket has a **name**: its title. In everything the human reads (narration, the map's Decisions so far), refer to it by that name, never by a bare number or slug. A wall of `03, 04, 05` is illegible; names read at a glance. The file link rides _inside_ the name, never stands in for it.

## Where it lives

One folder per effort: `docs/plans/<effort-slug>/`.

- The map is `docs/plans/<effort-slug>/MAP.md`, the canonical artifact.
- Each decision ticket is `docs/plans/<effort-slug>/NN-<slug>.md`, numbered from `01` in the order created.

Specs and plans ship in the PR, so the answers stay readable after the session ends.

## The Map

The map is an **index**, not a store. It lists the decisions made and points at the tickets that hold their detail; a decision lives in exactly one place, its ticket, so the map never restates it, only gists it and links.

```markdown
# Map: <effort name>

## Destination

<what reaching the end of this map looks like: the spec, decision, or change this effort is finding its way to. One or two lines; every session orients to it before choosing a ticket.>

## Notes

<domain; skills every session should consult; standing preferences for this effort>

## Decisions so far

<!-- the index: one line per closed ticket, enough to judge relevance, then open the link for the detail the ticket holds -->

- [<closed ticket title>](NN-slug.md): <one-line gist of the answer>

## Not yet specified

<!-- see "Fog of war": in-scope fog you can't ticket yet; graduates as the frontier advances -->

## Out of scope

<!-- see "Out of scope": work ruled beyond the destination; closed, never graduates -->
```

Open tickets are **not** listed in the map: they are the ticket files whose `Status` is not `closed`.

### Tickets

Each ticket is one file. Its body is the question, sized to one 100K token agent session:

```markdown
# NN: <Ticket title>

**Type:** research | prototype | grilling | task

**Status:** open

**Blocked by:** <numbers and titles of the tickets that gate this one, or "None">

## Question

<the decision or investigation this ticket resolves>
```

Status is `open`, `claimed`, or `closed`. A session **claims** a ticket by setting `Status: claimed` **first**, before any work, so a concurrent session skips it. An `open` ticket is unclaimed.

A ticket is **unblocked** when every ticket in its `Blocked by` line is `closed`. The **frontier** is the `open`, unblocked tickets: the edge of the known.

The answer is not part of the original question; it is recorded on resolution as an `## Answer` section (see [Work through the map](#work-through-the-map)). Assets created while resolving a ticket are linked from the ticket, not pasted in.

## Ticket Types

Every ticket is either **HITL** (human in the loop, worked _with_ a human who speaks for themselves) or **AFK**, driven by the agent alone. A HITL ticket only resolves through that live exchange; the agent never stands in for the human's side of it (a grilling agent that answers its own questions has broken this).

- **Research** (AFK): Reading documentation, third-party APIs, or local resources to surface a fact a decision waits on. Resolved by calling the Skill tool with "research". Use when knowledge outside the current working directory is required.
- **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to (an outline, a rough take, a stub, or UI/logic code) by calling the Skill tool with "prototype". Link the prototype from the ticket. Use when "how should it look" or "how should it behave" is the key question.
- **Grilling** (HITL): Conversation. The default case. Always call the Skill tool twice, for "grilling" and "domain-modeling".
- **Task** (HITL or AFK): Manual work that must happen before a _decision_ can be made: nothing to decide, prototype, or research, but the discussion is blocked until it is done. Signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen. This is the one type that _does_ rather than decides, and it earns its place by unblocking a decision, not by delivering the destination. The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Resolved when the work is done; the answer records what was done and any resulting facts (credentials location, new URLs, row counts) later tickets depend on.

## Fog of war

The map is _deliberately_ incomplete: do not chart what you cannot yet see. Beyond the live tickets lies the **fog of war**: the dim view of decisions and investigations you can tell are coming but cannot yet pin down, because they hang on questions still open. Resolving a ticket clears the fog ahead of it, graduating whatever is now specifiable into fresh tickets, one at a time, until the way to the destination is clear and no tickets remain.

The map's **Not yet specified** section is where that dim view is written down: the suspected question, the area to revisit later. It is the undiscovered frontier _toward_ the destination: everything here is in scope, just not sharp enough to ticket. Write as loosely or as fully as the view allows; it doubles as a signpost for collaborators reading where the effort is headed.

**Fog or ticket?** The test is whether you can state the question precisely now, _not_ whether you can answer it now.

- **Ticket when** the question is already sharp, even if it is blocked and you cannot act on it yet.
- **Not yet specified when** you cannot yet phrase it that sharply. Do not pre-slice the fog into ticket-sized pieces: it is coarser than a ticket, and one patch may graduate into several tickets, or none, once the frontier reaches it.

**Not yet specified** excludes what is already decided (Decisions so far), what is already a live ticket, and what is out of scope (the next section).

## Out of scope

Fog only ever gathers _toward_ the destination. The destination fixes the scope, so work beyond it is **out of scope**: it is not fog, and it does not belong in **Not yet specified**. It gets its own **Out of scope** section on the map: work you have consciously ruled out of _this_ effort. Scope, not sharpness, lands it here.

Out-of-scope work never graduates (the frontier stops at the destination), so it returns only if the destination is redrawn, and then as a fresh effort, not a resumption.

Ruling something out of scope is a scoping act, not a step on the route. When a ticket that already exists turns out to sit past the destination (mis-scoped in while charting, or exposed by a resolution), **close it** with an `## Answer` of "Out of scope: <why>" and leave one line in the **Out of scope** section: the gist plus why, linking the closed ticket. It stays out of **Decisions so far**, which records the route actually walked; a scope boundary is not a step on it.

## Invocation

Two modes. Either way, **never resolve more than one ticket per session**, with the exception of research tickets.

### Chart the map

User invokes with a loose idea.

1. **Name the destination.** Call the Skill tool twice, for "grilling" and "domain-modeling", to pin down what this map is finding its way to: the spec, decision, or change. The destination fixes the scope, so it is settled first.
2. **Map the frontier.** Grill again, **breadth-first** this time: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now. **If this surfaces no fog** (the way to the destination is already clear, the whole journey small enough for one session), you do not need a map. Stop and ask the user how they would like to proceed.
3. **Write `MAP.md`**: Destination and Notes filled in, Decisions so far empty, the fog sketched into **Not yet specified**.
4. **Write the tickets you can specify now**, one file each, with `Blocked by` filled in. Write cross-references with the real ticket number and title. Everything you cannot yet specify stays in the fog.
5. **Resolve the research tickets.** Run each one through the `research` skill, one at a time, and write its finding into the ticket's `## Answer`. Run research tickets in parallel only when three or more are independent, and then at most three at once.
6. Stop: charting is one session's work; it hand-resolves nothing but research.

### Work through the map

User invokes with a map (`MAP.md` path or effort name). A ticket is **optional**: without one, you pick the next decision, not the user.

1. Load the **map**: the low-res view, not every ticket body.
2. Choose the ticket. If the user named one, use it. Otherwise take the first `open` frontier ticket in number order. **Claim it**: set `Status: claimed` before any work.
3. Resolve it as the type its `Type` line names (see [Ticket Types](#ticket-types)). Read the line, not just the body: the body never states the type. **Zoom as needed**: open the full body of any related or closed ticket on demand; call the Skill tool for whichever skills the `## Notes` block names. If in doubt, call the Skill tool twice, for "grilling" and "domain-modeling".
4. Record the resolution: write the answer under `## Answer` in the ticket, set `Status: closed`, and add one line to the map's **Decisions so far**.
5. Add newly-surfaced tickets; graduate any fog the answer has made specifiable, clearing each graduated patch from **Not yet specified** so it lives only as its new ticket. If the answer reveals that a ticket (this one or another) sits beyond the destination, **rule it out of scope** rather than resolving it on the route. If the decision invalidates other parts of the map, update or delete those tickets.

Another session may be editing the same files. Re-read `MAP.md` and the ticket's `Status` right before you write.
