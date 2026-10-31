# 01: Hold `rm -rf` end to end

Spec: [docs/specs/pixel-blast.md](../../specs/pixel-blast.md)

**What to build:** When Claude calls Bash with `rm -rf <path>`, the mod holds the call, measures the files under the targets, and shows a plain-text report in a pane with `1: proceed` and `2: cancel`. Proceed runs the command as written; cancel refuses it, and Claude receives a refusal that names what would have been deleted. Every other Bash command runs untouched. This ticket lays the mod skeleton (manifest, hooks module, `$.state` type contract) under `mods/pixel-blast/`.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A safe command (`ls`) passes through with no pane opened
- [x] `rm -rf build` (and `rm -fr`, `rm -r -f`) is held and the pane lists the files with sizes, a total count and total size
- [x] Pressing `1` lets the call run; pressing `2` resolves it denied with the summary in the reason
- [x] Dry runs use `$.process.run` with an argv array and a timeout; a failed dry run still holds and shows "could not measure"
- [x] The wait loop uses `$.process.run` sleeps, not `$.clock.sleep`
- [x] The `tool.call` hook carries a `.catch` that denies when it had not called `next`
- [x] `claude plugin validate`, `tsc -p` and `claude plugin test` on the mod folder pass
