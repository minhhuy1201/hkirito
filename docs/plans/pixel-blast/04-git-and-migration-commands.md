# 04: Git and migration commands

Spec: [docs/specs/pixel-blast.md](../../specs/pixel-blast.md)

**What to build:** The mod also holds `git reset --hard` (showing uncommitted changes it would discard), `git clean -f` with `-d`/`-x` (showing untracked files via `git clean -n`), force pushes (`--force`, `-f`, `--force-with-lease`, showing remote-tracking commits not in `HEAD`, noted as possibly stale), and database migrations (showing pending migrations through the tool's own read-only listing where one exists).

**Blocked by:** 01

**Status:** done

- [x] Each git kind is held
- [x] `git clean -n` mirrors the command's `-d` / `-x` flags
- [x] Force push report notes that no fetch was run
- [x] Migration commands for common tools are held; a tool without a read-only listing reads "no read-only listing for <tool>"
- [x] `git push` without force and `git status` pass untouched
- [x] Tests cover each kind with stubbed dry runs
