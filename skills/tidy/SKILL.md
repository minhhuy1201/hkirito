---
name: tidy
description: "Run before every commit of agent-written code: strip needless comments and AI-sounding prose from the staged diff. Inline, no subagent. Outputs 'done', plus one line per offer to encode a constraint comment. Use for /tidy or when a route reaches its pre-commit step."
---
<!-- original; keep-list adapted from cursor/plugins pstack@101b274 agents/comment-sicko.md, constraint offers from pstack@93b916d skills/no-comments (MIT), see THIRD_PARTY.md -->

# Tidy

Clean the staged diff. Work inline: no subagent, no report. The output is `done`, plus any encoding offers.

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
   - Constraint comments (step 3).
   Delete narration ("loop over users"), banners, section dividers, commented-out code, and `TODO` notes that restate the task. When unsure whether a keep applies, delete.
3. A constraint comment tells the reader what not to do: `do not remove`, `do not change wording`, `talk to X before changing`. Keep it. If it guards code we own and a cheap check inside the diff's files could enforce it (a type, a runtime assert, a test, a lint rule), note one offer: `offer: <file>:<line> - encode "<constraint>" as <type|assert|test|lint>: <one-line how>`. Leave the encoding until the user approves the offer (see below). A constraint about something we cannot change (a third-party API, an external protocol) gets no offer.
4. Leave suppressions (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`) alone unless the fix is a small change inside the diff (a rename or a narrower type). Then make that fix and drop the suppression.
5. Rewrite the surviving comments, docstrings, and user-facing strings the diff added with the `unslop` rules (`../unslop/SKILL.md`): plain words, active voice, no filler, no em dashes, no "ensures", "leverage", "seamlessly". Keep them short and in the language of the surrounding code.
6. Re-stage the files you edited. Run `bash <this skill dir>/scripts/mark.sh` to record the tidy marker for the staged diff. Do not run it before step 6.
7. Reply `done`, then the offer lines from step 3, one per line, and nothing else. If a step fails (nothing staged and nothing changed, `mark.sh` error), reply with the one-line error instead.

An offer does not block the commit. When the user approves one, add the encoding, delete the comment, stage both, and run `tidy` again.

Commit messages are not tidy's job: use `caveman:caveman-commit` for them.
