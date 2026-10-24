---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"challenge this\", \"stress test this design\", \"find blind spots\", or \"tear this apart\". One fresh reviewer attacks a contested design or change; the main session sorts the findings. Never auto-applies changes."
---
<!-- vendored from cursor/plugins pstack@9580c23 (MIT), ported: one fresh reviewer replaces the multi-model panel, see THIRD_PARTY.md -->

# Interrogate

Spawn one fresh `reviewer` subagent to attack a change or a design from outside the author's context. The deliverable is a sorted verdict. Do NOT auto-apply changes.

Use it when a design is contested: several valid shapes, an interface other code will depend on, or a choice that is costly to undo. Skip it for routine changes.

## Step 1, Scope

Identify what to review from context:

- If the user points at files or a diff, use that.
- If a design sketch exists (for example from `architect`), review the sketch and its rationale.
- On a feature branch, run `git diff <base>...HEAD` for the full change.

Package the diff, sketch, or file contents with the surrounding files the reviewer needs.

## Step 2, Intent

State the intent in one paragraph from the user's message, commit messages, the PR description if one exists, and the code. If the intent is unclear, ask the user before you continue.

## Step 3, Dispatch

Fill `references/reviewer-prompt.md` with the intent, the scope from step 1, `references/rubric.md`, and `references/code-quality-review.md`. Make one new `Agent` call with `subagent_type: reviewer` and no `model` override, and pass the filled prompt. Use a fresh subagent every time, so the review stays independent of this session.

## Step 4, Lead judgment

You are the lead reviewer, a pragmatic senior engineer, not a relay. Read `references/lead-judgment.md`. Check each finding against the code yourself before you bucket it. Put every finding in one bucket, with a one-line reason:

- **Act on.** Real issues affecting correctness, security, or maintainability given the actual goals. They would block a real PR.
- **Consider.** Legitimate, but unclear whether they outweigh the cost of fixing now. Worth the user's attention.
- **Noted.** Valid but not actionable: context-dependent, premature optimisation, or low impact now.
- **Dismissed.** Wrong, nitpicky, or missing context, with a brief reason.

## Output format

### Intent
> [The stated intent paragraph]

### Act on
[Each: description, why it matters.]

### Consider
[Each: description, the tradeoff.]

### Noted
[Brief list.]

### Dismissed
[Each with a brief rationale.]
