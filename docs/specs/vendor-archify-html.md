# Spec: vendor archify as a user-invoked `/archify` skill for HTML diagrams

Status: approved

## Problem Statement

`flow-map` draws Mermaid only. That is right for specs and PR bodies, which must render on GitHub, but the author also wants archify's interactive standalone HTML diagrams when they ask for a diagram directly. The earlier spec ([vendor-archify-flow-map](vendor-archify-flow-map.md)) ported only archify's method, so no renderer is present.

## Solution

Copy archify's `archify/` package at commit `a4065941` into `skills/archify/` and keep it offline:

- The update check is always off: `updatesDisabled()` in `scripts/check-update.mjs` returns `true`, and `startDeliveryUpdateCheck` in `bin/delivery-update.mjs` returns `disabled` before it spawns a child.
- Remote brand capture is off: `captureRemoteBrand` in `renderers/shared/brand-marks.mjs` returns `unavailable`, and `archify brands capture` fails with a message. Built-in brand marks still work.
- `SKILL.md` sets `disable-model-invocation: true`, so the skill runs only when the author types `/archify`. Its update-awareness section and its offer to write a proactive-mode line into the global rules file are removed.
- The rendered demo HTML under `examples/` (about 13 MB) is dropped. The `*.json` examples and `examples/locales/` stay, because `SKILL.md` and `references/authoring-contract.md` tell the agent to read them.

`flow-map` is unchanged: specs, PR sketches, and inline answers keep Mermaid.

Rendering still launches a local headless Chromium for the `browser-check` gate. That is local, not a network call.

## Verification

- `unshare -rn node bin/archify.mjs finalize sequence <copy of examples/cache-miss-request.sequence.json> out.html --quality showcase --json` exits 0 with all four gates passing, with no network namespace.
- The rendered HTML loads no external resource; its only `https` reference is an `href` credit link.
