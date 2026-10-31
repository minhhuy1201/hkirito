# 05: Docker commands

Spec: [docs/specs/pixel-blast.md](../../specs/pixel-blast.md)

**What to build:** The mod holds `docker system prune`, `docker volume rm`, `docker volume prune` and `docker compose down -v` (also `docker-compose`), showing the volumes and reclaimable disk they would remove.

**Blocked by:** 01

**Status:** done

- [x] Each command is held with level `high`
- [x] Report lists volumes and sizes from read-only docker commands
- [x] `docker ps`, `docker compose down` without `-v` pass untouched
- [x] Docker not installed or daemon down reads "could not measure"
- [x] Tests cover each command with stubbed dry runs
