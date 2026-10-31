---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"challenge this\", \"stress test this design\", \"find blind spots\", or \"tear this apart\". An adversary tries to break a change or design, and only findings proven by a run survive."
---
<!-- vendored from cursor/plugins pstack@ab1f702 (MIT), ported: one fresh worktree adversary replaces the multi-model fan-out, see THIRD_PARTY.md -->

# Interrogate

An adversary tries to break a change or a design. A finding survives only when a run proves it. Report the findings. Do not apply fixes.

## Frame

The scope is what the user names. Otherwise it is the branch diff from its merge base with the base branch, through the working tree. State the intent in your own words (the goal and the problem), from the user's message, the commits, and the PR description. Ask the user when the intent is unclear.

## Fan out

Record `git rev-parse HEAD`. Save the scope's uncommitted changes as a patch in the session scratchpad: `git diff --binary HEAD` plus the untracked files (list them with `git ls-files --others --exclude-standard` and include each as a new-file diff, for example `git diff --binary --no-index /dev/null <file>`). Make one new `Agent` call with `subagent_type: "general-purpose"`, `isolation: "worktree"`, and no `model` override, so the adversary starts with fresh context. A new worktree may start from the default branch, not your HEAD, so tell the adversary to run `git checkout --detach <recorded sha>` and then `git apply <patch>` before anything else. Then give it the scope, the intent, and this brief:

> Break this change. Prove each finding with a run against the real code, such as a failing test, a repro script, or command output that shows the wrong behavior. For a design or plan, run a prototype or probe the current tree. Keep repros in your own worktree. Report each finding with a title, the exact command, the output it printed, and the output the intent requires. Leave out anything you did not run. That covers style, naming, structure, and risks that need a future change to matter. No findings is a valid result.

## Verify

Rerun each finding's command in the adversary's worktree. Keep a finding when the output shows the failure and the failure breaks the intent. Drop the rest. Merge findings that share a root cause. Report the worktree path and leave removing it to the user.

## Output

- **Intent**: the restatement.
- **Findings**: for each verified finding, the command, its output, and how it breaks the intent. Say "no verified findings" when none survive.
- **Dropped**: the count of dropped findings and why.
