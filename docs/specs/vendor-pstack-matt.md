# Spec: vendor more pstack and Matt Pocock skills into hkirito

Status: approved

## Problem Statement

hkirito already merges two upstreams: Matt Pocock's skills (spec flow: grill, spec, tickets, tdd) and pstack (understanding and design: `how`, `why`, `architect`). Both upstreams have skills hkirito lacks, and pstack has added more since hkirito pinned it.

pstack assumes a team with a near-unlimited token budget. Many of its skills fan out to several subagents on several models (`arena`, `swarm`, multi-model `interrogate`) and read model choices from a Cursor rule file. The author runs Claude Code only, on a personal budget, and uses subagents sparingly. Copying pstack skills as they are would bring in multi-model fan-out, Cursor-only steps, and references to skills hkirito does not ship.

The author also wants the strongest ideas from the upstream playbooks and Matt's `code-review` inside the existing routes, not as parallel flows that compete with `/kirito-mode`.

## Solution

Vendor a selected set of skills into hkirito, in three kinds:

- **Copied.** Taken close to verbatim, with references to pstack-only skills removed.
- **Ported.** Rewritten to run inline, with at most one fresh subagent where independence matters, and no model choices.
- **Ideas only.** Folded into existing routes or `review-loop` as one or two sentences, with no new skill.

Each new skill gets a place in a route of `/kirito-mode`, or is marked manual-only so it never loads unless the author types it. `THIRD_PARTY.md` and the provenance comment in each file record the upstream and commit.

## User Stories

1. As the author, I want to draw a system's states as a chart from a TLA+ model (`statechart`), so that I can see a state or race bug as a numbered path.
2. As the author, I want to turn an agreed chart into a TLA+ skeleton, so that a design bug shows up before code exists.
3. As the author, I want to generate and maintain a project-local formal verification skill (`create-formal-verification-skill`, `maintain-formal-verification-skill`), so that the most expensive code has a checked model.
4. As the author, I want `blast-radius` to run before review on a PR whose diff touches an interface other code depends on, and to be skipped otherwise, so that breakage outside the diff is found and the one fact that makes the change safe is proved by running code.
5. As the author, I want `blast-radius` to run inline with no multi-model step, so that it costs one session, not a fan-out.
6. As the author, I want `interrogate` to challenge a contested design with one fresh `reviewer` subagent, so that I get adversarial review without paying for several models.
7. As the author, I want `interrogate` to sort findings into Act on, Consider, and Noted, so that I see which findings block and which do not.
8. As the author, I want `interrogate` to run only when a design is contested, so that routine features do not pay for it.
9. As the author, I want a TSV decision log (`show-me-your-work`) for long or unattended work, so that I can audit what the agent chose after stepping away.
10. As the author, I want the decision log kept out of git by default, so that it does not clutter PRs unless the work needs an audit trail.
11. As the author, I want `correct` to find mistakes agents repeat in a repo and block each one at the highest level that works (architecture, then types, then tests, then docs), so that a correction stops being repeated.
12. As the author, I want `sharpen` to rewrite a task prompt into a deeper version before I route it, so that I ask for what a top professional would do.
13. As the author, I want `research` to answer questions about external docs and APIs from primary sources in one background subagent, writing a cited Markdown file, so that my "ground every answer" rule has a tool behind it.
14. As the author, I want `wait-what` to make the agent re-pitch its last message in Simplified Technical English with glossary terms, so that I can recover when an answer did not land.
15. As the author, I want `to-questionnaire` to turn a question I cannot answer alone into a questionnaire for someone else, so that I can collect the missing facts async.
16. As the author, I want `wizard` to generate a bash script that walks a human through steps only a human can do (dashboards, secrets), so that setup is repeatable and secrets never pass through the transcript.
17. As the author, I want `wayfinder` to plan work too big and foggy for one session as a map of decision tickets in repo files, so that I do not need an external issue tracker.
18. As the author, I want the `feature` route to send a too-big, foggy task to `wayfinder` instead of "run in slices", so that the planning for large work has a defined shape.
19. As the author, I want each review round in `review-loop` to report findings under two separate axes, Standards and Spec, so that one axis cannot hide the other.
20. As the author, I want the Spec axis to report missing or partial requirements, unrequested behaviour (scope creep), and requirements that look done but are wrong, each quoting the spec line, so that the review checks the change against what was agreed.
21. As the author, I want the Standards axis to check the repo's documented standards plus a fixed baseline of code smells, with the repo's documents winning on conflict, so that a repo with no standards still gets a quality check.
22. As the author, I want the two axes to come from one reviewer subagent per round, so that review cost does not double.
23. As the author, I want the `bug` route to revert code motivated by a hypothesis that evidence refuted, so that "might help" changes do not ship.
24. As the author, I want the `bug` route to suggest `/statechart` when the bug is about states or ordering, so that I remember the tool exists.
25. As the author, I want the `refactor` route to measure whether the change lowers reader load and to delete before adding, so that a refactor that does not make the code easier to read is reverted.
26. As the author, I want the `understand` route to use `research` for questions about external systems, so that answers about third-party behaviour cite the owner's docs.
27. As the author, I want the `feature` route to say that each ticket must be readable cold, and to suggest `/clear` between tickets on long features, so that context stays small.
28. As the author, I want the router to ask an empirical question by running a `prototype` instead of asking me, when running something can answer it, so that I am asked only about intent and preference.
29. As the author, I want every manual-only skill to carry `disable-model-invocation: true`, so that its description does not load into every session.
30. As the author, I want every skill a route calls to stay model-invocable, so that the router can run it.
31. As the author, I want every vendored file to name its upstream and commit, so that I can diff against upstream later with one `git log <sha>..HEAD` per skill.
32. As the author, I want no vendored skill to mention `arena`, `swarm`, `poteto-mode`, `pstack-models`, grok, or Cursor-only tools, so that no step points at something that does not exist in hkirito.
33. As the author, I want the README flow diagram and skill list to match the new routes, so that a teammate who clones hkirito sees the real flow.
34. As a teammate who clones hkirito, I want the install loop in the README to pick up the new skills with no extra step, so that setup stays one command block.

## Implementation Decisions

**Skill set.**

| Skill | Upstream | Kind | Invocation | Route |
|---|---|---|---|---|
| `statechart` | pstack | Copied, with its scripts and their tests | Manual only | Suggested by `bug` |
| `create-formal-verification-skill` | pstack | Copied | Manual only | None |
| `maintain-formal-verification-skill` | pstack | Copied | Manual only | None |
| `blast-radius` | pstack | Ported: inline, the multi-model step removed | Model | `pr`, before `review-loop`, only when the diff touches a public interface, schema, data format, or widely imported export |
| `interrogate` | pstack | Ported: one fresh `reviewer` subagent, lead-judgment buckets kept | Model | `feature`, after `architect`, only when the design is contested |
| `show-me-your-work` | pstack | Copied, with its log script and template; references to `poteto-mode` and principle skills removed | Model | `feature` for long or unattended work, and `wayfinder` |
| `correct` | pstack | Copied | Manual only | None |
| `sharpen` | pstack | Copied | Manual only | None |
| `research` | Matt | Copied | Model | `understand` |
| `wayfinder` | Matt | Adapted: map and decision tickets as files under the plans folder, no tracker | Manual only | Suggested by `feature` |
| `wait-what` | Matt | Copied | Manual only | None |
| `to-questionnaire` | Matt | Copied | Manual only | None |
| `wizard` | Matt | Copied, with its template script | Manual only | None |

**Decisions the author can revise.** These were defaults chosen without an interview:

- `wayfinder` instead of pstack's `figure-it-out` for too-big work. Reason: it plans decisions in files, which matches hkirito's "files, not tracker" rule, while `figure-it-out` also executes and depends on `arena`.
- `review-loop` runs one reviewer per round that reports both axes, not two parallel subagents as Matt's `code-review` does. This trades some independence between axes for half the review cost.
- `correct` stays a separate manual skill, not merged into `retro`. `retro` looks back at one session; `correct` looks across the repo's history. Merging can happen later if they overlap in use.
- Manual-only skills get `disable-model-invocation: true`. Skills a route calls do not, because the flag also blocks the router.
- `blast-radius` runs once per PR in the `pr` route, not in each code route, so it runs once over the whole change. It runs only when the diff touches something other code depends on, to save tokens; the author asked for this after seeing the cost.

**Porting rule for subagents.** A ported skill runs inline. It opens a subagent only when the raw output would exceed about 25K tokens, when the work needs independence from the author (review), or for at most three truly independent angles. It never passes a `model` override; agents take their model from their frontmatter.

**`review-loop` changes.** The reviewer prompt gains the two axes, the three Spec questions, and the smell baseline (the twelve Fowler smells from Matt's `code-review`, each a judgement call, the repo's documents winning on conflict). Each finding carries an axis. The main session relays findings grouped by axis and never reranks across axes. The baseline lives beside `review-loop` as a reference file the reviewer reads. The final round through `pr-review` keeps that skill's template and is unchanged.

**Route changes.**

- `feature`: `interrogate` after `architect` when the design is contested; a foggy task too big for one session goes to `wayfinder`; `show-me-your-work` for long or unattended work; each ticket readable cold, with `/clear` suggested between tickets on long features.
- `bug`: revert what a refuted hypothesis motivated; suggest `/statechart` for state or ordering bugs.
- `refactor`: subtract before adding; finish with a reader-load check and revert a change that does not lower it. The existing "Lock behaviour" step already pins behaviour and stays.
- `understand`: `research` for external docs and APIs.
- `pr`: `blast-radius` before `review-loop`, only when the diff touches something other code depends on.
- Router rules: an empirical fork goes to `prototype` instead of a question to the user.

**Provenance.** Each vendored `SKILL.md` carries a comment naming the upstream, the commit, and whether it is copied or ported. New pstack skills pin the cursor/plugins commit read for this spec; new Matt skills pin the mattpocock/skills commit read for this spec. `THIRD_PARTY.md` lists every new skill under its upstream. Existing pins stay as they are.

## Testing Decisions

A good check here tests what a user of the harness sees: a skill loads, its references resolve, and a route produces its artifacts. It does not test wording.

- **Frontmatter.** Every `SKILL.md` has `name` equal to its folder and a `description`. Manual-only skills have `disable-model-invocation: true`; skills a route names do not. Prior art: the frontmatter check in the `kirito-mode` spec.
- **No dangling references.** A search of the new and changed skills finds no `arena`, `swarm`, `poteto-mode`, `pstack-models`, `grok`, `setup-pstack`, or `setup-matt-pocock-skills`. Every skill name a route or skill mentions exists in the repo or is a known external skill (`caveman:*`, `run`).
- **Provenance.** Every new skill has a provenance comment and a `THIRD_PARTY.md` entry, and the two name the same commit.
- **Bundled scripts.** `statechart`'s own test suite passes from its new location. `show-me-your-work`'s log script writes a header and one row to a scratch file. `wizard`'s template passes `bash -n`.
- **Routes.** Exercise `pr` (with `blast-radius` and the two-axis review) and `understand` (with `research`) once in a throwaway git repo and check the route line and the artifacts. Prior art: the route exercise in the `kirito-mode` spec.
- **Review axes.** One `review-loop` round on a throwaway change that both breaks a written standard and adds unrequested behaviour returns one finding on each axis.

## Out of Scope

- `arena`, `swarm`, `poteto-mode` and its playbooks, `setup-pstack`, and the `principle-*` skills.
- Any multi-model step, model selection, or Cursor-only feature (bugbot, automations, cloud agents).
- pstack's generated harness tree and its generator script.
- `figure-it-out`, `reflect`, and pstack's other playbooks that depend on fan-out.
- Matt's `implement`, `implement-spec`, `code-review` as a separate skill, `pr`, `triage`, `ask-matt`, and `setup-matt-pocock-skills`.
- Re-porting skills hkirito already vendors (`how`, `why`, `architect`, and the Matt set). The upstream log shows no change to `how` or `architect` since their pin.
- Automated sync with upstream.

## Further Notes

- `statechart` installs TLC and Java with mise on its first run, about 305 MB, and needs the network. That is a machine-scope side effect, so the skill's first run is the author's call.
- `wizard` writes values to `.env` and GitHub secrets from a script the human runs. The agent writes the script; it never reads the secrets.
- Upstream sources read for this spec, both MIT: `pstack/skills/*` and `pstack/skills/poteto-mode/playbooks/*` in cursor/plugins at commit `9580c23`, and `skills/*/*` in mattpocock/skills at commit `5beb35b`. New skills pin these commits.
