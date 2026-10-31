# pixel-blast

A Claude Code mod that holds risky Bash commands, measures what they would touch with read-only dry runs, and shows a compact pixel-styled report (plain text, `■` size bars) before you decide.

```
rm -rf build
3 files (492K)

build/app.js      ■■■■■■   392K
build/app.css     ■          88K
build/sub/x.txt   ■           4K

1: proceed   2: cancel
```

Press `1` and the command runs as written. Press `2`, press Esc, or interrupt the turn and Claude receives a refusal that says what the command would have touched.

## What it holds

| Class | Commands |
| --- | --- |
| Delete | `rm -r` / `rm -rf` |
| Git | `git reset --hard`, force push (`--force`, `-f`, `--force-with-lease`, `--mirror`, `+refspec`) |
| Git | `git clean -f` (with `-d`, `-x`) |
| Migrations | prisma, rails/rake, alembic, flyway, knex, sequelize, django, typeorm, drizzle-kit, goose, dbmate |

Everything else runs untouched, including Docker, Terraform and kubectl. `sh -c "..."`, `sudo`, `&&` chains and pipes are looked through.

Dry runs never use a shell and never fetch a remote or a package. When one fails, the call is still held and the report says `could not measure`.

## Look

The `■` size bars are drawn for the terminal only, and only when the pane is at least 32 columns wide. Other surfaces get the same facts as plain text. The report opens in a side pane when the terminal is wide enough, and above the prompt otherwise.

## Install

No marketplace. Clone this repo and point Claude Code at the folder:

```sh
claude --plugin-dir /path/to/hkirito/mods/pixel-blast
```

Or load it in every session:

```sh
export CLAUDE_CODE_PLUGIN_DIRS=/path/to/hkirito/mods/pixel-blast
```

Needs Claude Code 2.1.287 or later (developed on 2.1.316).

## Develop

```sh
claude plugin validate mods/pixel-blast
claude plugin test mods/pixel-blast
```

## Order of events

The hold runs before Claude Code's own permission prompt, so the dry runs also run for a command a permission rule would refuse. Pressing `1` hands the command on to the normal permission flow.

## Limits

Dry runs use only the variables that pick a target (`DATABASE_URL`, `RAILS_ENV`, `DJANGO_SETTINGS_MODULE`, ...) and never `PATH` or `LD_*`. Options that point git at another repository (`--git-dir`, `GIT_DIR`) are not repeated, so those commands are held but not measured. `git -C <dir>` is repeated only for a directory inside the working directory. Dry runs of migrations run the project's own status command, so measuring inside a repo you do not trust is not safe.

This is a safety net, not a permission system. It reads the command text, so `$(...)`, aliases and scripts that call `rm` get past it. Globs are not expanded, so `rm -rf build/*` is held but not measured. A hot reload of the mod during a hold refuses the held command. Use permission rules for a hard block.
