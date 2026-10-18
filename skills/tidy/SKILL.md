---
name: tidy
description: "Run before every commit of agent-written code: strip needless comments and AI-sounding prose from the staged diff. Inline, no subagent. Outputs only 'done'. Use for /tidy or when a route reaches its pre-commit step."
---
<!-- original; keep-list adapted from cursor/plugins pstack@101b274 agents/comment-sicko.md (MIT), see THIRD_PARTY.md -->

# Tidy

Clean the staged diff. Work inline: no subagent, no report. The only output is `done`.

## Scope

`git diff --cached`. If nothing is staged, use `git diff` against HEAD and stage the touched files first. Touch only lines the diff added or changed. Never change application logic.

## Steps

1. Read the diff. List every comment, docstring, and string of prose the diff adds.
2. Delete a comment unless it matches the keep-list:
   - License or legal headers.
   - A non-obvious reason the code cannot show: an external dependency, platform, or protocol quirk, a business constraint, a workaround with its cause, a decision already agreed.
   - Public API doc comments that define a contract.
   - Issue or RFC links explaining a constraint the code cannot express.
   - Tool directives (`prettier-ignore`, `eslint-disable` with a faulty or style-only rule).
   Delete narration ("loop over users"), banners, section dividers, commented-out code, and `TODO` notes that restate the task. When unsure whether a keep applies, delete.
3. Leave suppressions (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`) alone unless the fix is a small change inside the diff (a rename or a narrower type). Then make that fix and drop the suppression.
4. Rewrite the surviving comments, docstrings, and user-facing strings the diff added with the `unslop` rules (`../unslop/SKILL.md`): plain words, active voice, no filler, no em dashes, no "ensures", "leverage", "seamlessly". Keep them short and in the language of the surrounding code.
5. Re-stage the files you edited. Run `bash <this skill dir>/scripts/mark.sh` to record the tidy marker for the staged diff. Do not run it before step 5.
6. Reply `done` and nothing else. If a step fails (nothing staged and nothing changed, `mark.sh` error), reply with the one-line error instead.

Commit messages are not tidy's job: use `caveman:caveman-commit` for them.
