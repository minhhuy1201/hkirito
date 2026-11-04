# Spec: review and verification signal tweaks

Status: approved

## Problem Statement

A comparison of hkirito with a third-party prompt collection and with posts on claude.dev found four gaps:

1. The reviewer has no test-quality criteria. `skills/review-loop/code-smells.md` lists only Fowler smells. Test-quality rules live in `skills/tdd/SKILL.md`, which the reviewer does not read. A test that mocks the code under test, or recomputes its expected value, passes review.
2. A defect in code the change did not touch has no severity of its own. It can be raised as `must-fix` and block the gate, and it reads as the author's fault.
3. The reviewer's free-form hand-back has no count up front, so a reader must scan the list to learn whether anything blocks.
4. The implementer counts as done when the existing checks are green, even when no check runs the changed code.

## Solution

- `code-smells.md` gets a **Test smells** group: Mocked Subject, Tautological Assertion, Happy Path Only. Each entry names the fix.
- `review-loop` gets a fifth severity, `pre-existing`, for a defect in code the round's diff did not add or change. It is never `must-fix` or `should-fix`. It maps to 🟡 Nit in `pr-review`, and it may be closed `WONTFIX`. The Severities list, the WONTFIX rule, the pr-review mapping, the reviewer prompt, and the JSON schema all list it. `agents/reviewer.md` lists it too.
- `agents/reviewer.md` opens its hand-back with one count line per severity and says "no findings" plainly when all counts are zero. A prompt that names a review skill or fixes an output format (such as review-loop's JSON) replaces the count line, so the review-loop JSON output keeps its shape.
- `agents/implementer.md` requires at least one check that runs the changed code (a test that fails without the change, or the changed command). A syntax-only check, or one that failed to start, does not count. A change with no executable surface (docs or prompt text only) is exempt and names `not run: no executable change`. The hand-back names that check.

## Decisions

- `pre-existing` is a severity, not a separate `origin` field. A field would change the log line, the schema, and the relay format, and would add no behaviour. Because it is a non-blocking severity, the gate rule (zero `must-fix`) needs no change. A serious bug in untouched code also never blocks the gate; the author accepted this in review round 1.
- The implementer rule ports only the "real check that exercises the change" idea. The source paragraph also tells the model to install dependencies, which the author's no-install guardrail forbids.
- Not adopted:
  - Anti-rationalization lists and a "verify independently" rule for the reviewer. `review-loop`'s reviewer prompt tells the reviewer not to re-run green checks, to keep review cheap. `kirito-mode` and the must-fix evidence rule already require evidence.
  - A synthesis rule for subagent briefs. Briefs already follow fixed templates.

## Out of scope

The gate hook, the CI workflow, the `pr-review` skill, and `kirito-mode`.

## Testing

The change is prompt text with no behavioural eval. Its effect on catch rate and false positives is unmeasured. A seeded-defect A/B eval with `claude plugin eval` was designed and deferred.

## Sources

- https://claude.dev/blog/solving-code-review-at-anthropic/ - "Each is tagged Important, Nit, or Pre-existing, so a bug the PR didn't introduce doesn't look like the author's fault."; "a summary that starts with a count and says plainly when there's nothing to fix."
- https://claude.dev/blog/building-with-claude-sonnet-5-5/ - "run a real check that exercises the change before reporting it done … A syntax-only check, or a check command that failed to start, does not count"
- `skills/tdd/SKILL.md` (Tautological and Implementation-coupled test definitions), `skills/review-loop/SKILL.md` (the reviewer prompt's "Do not re-run them" rule)
