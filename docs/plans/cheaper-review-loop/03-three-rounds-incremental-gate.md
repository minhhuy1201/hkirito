Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md)

# 03: Three rounds, incremental gate

**What to build:** the loop runs at most 3 rounds, gate included. Round 1 is a full review; later rounds verify `FIXED` / `ANSWERED` / `DISPUTED` items and review only the diff since the previous reviewed snapshot. Every round follows the `pr-review` checklist (project skill, else global). A round is the gate when its snapshot equals the committed `HEAD` tree with a clean working tree, it returns zero `must-fix`, nothing is `NOT_FIXED` or `UPHELD`, and no `DISPUTED` item is unruled; that round also returns the `## Review Summary` and `## Self-review` block for `HEAD`, and the main session writes the marker as today. A commit after the gate is reviewed only on its own diff and counts toward the cap. The loop stops and reports when round 3 ends without a pass or a reviewer returns `UPHELD`.

**Blocked by:** 02

**Status:** done

- [x] No separate full-review gate round remains in `review-loop`
- [x] Gate condition written exactly as above; a clean round 1 on a committed `HEAD` passes in one round
- [x] Post-gate commit scope is `<gated tree>`..`<new HEAD tree>`
- [x] Cap is 3 rounds including the gate; stop report lists log path, open `must-fix`, latest Needs human review
- [x] Self-review block format, marker write, push gate, and CI self-review check are unchanged and still satisfied
