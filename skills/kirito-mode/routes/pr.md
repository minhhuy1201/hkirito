# Route: pr

Runs only when the user asks to open or update a PR.

1. **Blast radius.** Run `blast-radius` once over the whole change, before the first review round. Show the user its writeup: the one fact the change is safe because of (proven or marked unproven), the risks, and what it cleared.
2. **Review.** Run `review-loop`. It dispatches a fresh `reviewer` subagent each round and ends at the `pr-review` gate (project or global) when one exists. Relay the reviewer's **Needs human review** list to the user.
3. **Body.** Read `.github/pull_request_template.md` (or `.github/PULL_REQUEST_TEMPLATE/`) and fill every section. Run `pr-sketch` before writing the body. Link the spec and plan files the change carries.
4. **Open.** Push and run `gh pr create` only when the user's message names that action. Then stop at the PR link; do not poll CI.
