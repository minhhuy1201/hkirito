Spec: [vendor-pstack-matt](../../specs/vendor-pstack-matt.md)

# 04: research in the understand route

**What to build:** a question about an external system's docs or API, routed to `understand`, is answered by `research`: one background subagent reads primary sources and writes a cited Markdown file.

**Blocked by:** None (can start immediately)

**Status:** todo

- [ ] `research` is vendored from mattpocock/skills, model-invocable, with a provenance comment
- [ ] The `understand` route names `research` for questions about external docs and APIs
- [ ] One run of the `understand` route in a throwaway repo prints the route line and produces a Markdown file whose claims each cite a source
- [ ] `THIRD_PARTY.md` lists it
