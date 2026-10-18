# Route: pr

Runs only when the user asks to open or update a PR.

1. **Review.** Run `review-loop`. It dispatches a fresh `reviewer` subagent each round and ends at the `pr-review` gate (project or global) when one exists. Relay the reviewer's **Needs human review** list to the user.
2. **Body.** Read `.github/pull_request_template.md` (or `.github/PULL_REQUEST_TEMPLATE/`) and fill every section. Run `pr-sketch` before writing the body. Link the spec and plan files the change carries.
3. **Open.** Push and run `gh pr create` only when the user's message names that action. Then stop at the PR link; do not poll CI.
