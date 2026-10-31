# 06: Infra commands

Spec: [docs/specs/pixel-blast.md](../../specs/pixel-blast.md)

**What to build:** The mod holds `terraform destroy` (listing resources from `terraform state list`, level `critical`), `terraform apply` (showing the workspace, level `high`), `kubectl delete` (listing objects via `--dry-run=client -o name` and the current context), and any mutating `kubectl` command on a context whose name matches `prod` (level `critical`).

**Blocked by:** 01

**Status:** done

- [x] `terraform plan` and `terraform state list` pass untouched; no dry run calls `plan`
- [x] `kubectl get` passes; `kubectl apply` on a non-prod context passes
- [x] `kubectl apply/delete/patch/scale/rollout/edit/replace` on a prod context is held as `critical`
- [x] Missing CLI reads "could not measure"
- [x] Tests cover each case with stubbed dry runs
