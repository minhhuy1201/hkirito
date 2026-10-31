Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md) (amended by this ticket)

# 01: Model switches only at a cleared phase boundary

**What to build:** the prompt cache is per model, so a `/model` switch mid-context re-bills the whole context uncached ([source](https://claude.dev/blog/lessons-from-building-claude-code-prompt-caching-is-everything/)). Every model switch happens only at a phase boundary: write the handoff, STOP, and tell the user to `/clear`, `/model <x>`, then run a resume command. The `pr` route already works this way; extend it to the `feature` route.

- `skills/kirito-mode/SKILL.md`: rewrite the "Model switch points" bullet to the cleared-boundary rule; in section 2 add the resume entry `feature <plan dir>` (parallel to `pr <log path>`), which routes to `feature` at step 6 and reads the spec and tickets instead of re-exploring.
- `skills/kirito-mode/routes/feature.md`: add a boundary between steps 5 and 6 - once the breakdown is approved and the session is on Opus, STOP with one message: `/clear`, `/model` Sonnet 5.5, `/kirito-mode [--delegate] feature <plan dir>`. Drop the mid-session switch wording from the delegate bullet; returning to Opus for later spec work means a new session.
- `skills/kirito-mode/routes/pr.md`: check only; change nothing unless its wording conflicts.
- `CLAUDE-huykrito.md` and `~/.claude/CLAUDE.md`: Model routing bullet states the same rule in each file's own wording; `implementer` and `reviewer` model rules unchanged.
- `README.md`: Models bullet, delegate paragraph, mermaid feature path (boundary node after `to-tickets`).
- `docs/specs/cheaper-review-loop.md`: story 33 and the "Main session model" paragraph match the new rule.

**Model:** sonnet - wording across several coupled docs

**Blocked by:** none

**Status:** done

- [x] No file asks for a `/model` switch mid-context (`grep -rn -i "/model" skills README.md CLAUDE-huykrito.md docs/specs ~/.claude/CLAUDE.md`)
- [x] `feature <plan dir>` resume entry documented in `SKILL.md` and `routes/feature.md`
- [x] Spec, README, and both CLAUDE files agree
