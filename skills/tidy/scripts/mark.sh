#!/usr/bin/env bash
# Record that tidy ran on exactly the currently staged diff.
# The commit gates (hooks/commit-gate.sh, githooks/pre-commit) compare this hash to the staged diff at commit time.
set -euo pipefail

git_dir=$(git rev-parse --git-dir)
hash=$(git diff --cached | sha256sum | cut -d' ' -f1)
printf '%s\n' "$hash" > "$git_dir/kirito-tidy"
