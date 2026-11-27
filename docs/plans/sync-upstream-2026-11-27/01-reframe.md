Spec: [sync-upstream-2026-11-27](../../specs/sync-upstream-2026-11-27.md)

# 01: Add /reframe

**What to build:** the author can type `/reframe <vague description>` and get the expert terms for what they are building, copied from pstack. The skill runs only when typed. Upstream source: the local clone of cursor/plugins at `/Users/huy.dao/github-stuff/plugins`, commit `b7b93c36`, folder `pstack/skills/reframe`. Follow the vendor-copy pattern of `skills/unslop` (a provenance comment under the frontmatter naming source and commit, plus a line in the pstack section of `THIRD_PARTY.md`).

**Blocked by:** None (can start immediately)

**Model:** haiku - 2 files, follows the existing vendor-copy pattern of `unslop`, no logic

**Status:** done

- [x] The new skill folder holds a `SKILL.md` identical to upstream except one provenance comment line naming `pstack@b7b93c36`
- [x] `disable-model-invocation: true` is kept and `name` equals the folder name
- [x] `THIRD_PARTY.md` pstack section lists `reframe` (copied) at `b7b93c36`
- [x] `diff` against upstream shows only the provenance line
