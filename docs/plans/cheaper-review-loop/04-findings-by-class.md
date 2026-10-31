Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md)

# 04: Findings by class

**What to build:** reviewers report one finding per class of defect, listing every location, so one fix pass clears the class. The output schema's finding gains `class` and replaces `file` / `line` with `locations`. The reviewer searches the reviewed scope for siblings before reporting. A new location of a class already in the log is added to that finding, not raised as a new one. The log's finding line carries the class and all locations.

**Blocked by:** 03

**Status:** done

- [x] Reviewer output JSON schema has `class` and `locations[]`
- [x] Reviewer instructions require a sibling search before reporting
- [x] Log line format and the no-repeat rule cover classes
- [x] `pr-review` mapping (Blocker / Nit / Question) still works with multi-location findings
