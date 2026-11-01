# Brand marks

Use a brand mark only when a real product, provider, model family, channel, or
service identity helps the reader. Semantic `type` still explains what the node
does; `brand` explains whose product it is.

## Agent decision path

1. Search the built-in catalogue when the request names a recognizable brand:

   ```bash
   node bin/archify.mjs brands "Claude" --json
   ```

2. Put the returned canonical ID in the node, participant, or state:

   ```json
   {
     "id": "planner",
     "type": "backend",
     "label": "Claude",
     "brand": "claude"
   }
   ```

<!-- hkirito vendor: remote capture and URL-pinned brands are disabled; upstream capture details removed. -->
3. This vendored copy makes no network calls, so `brands capture` and
   URL-pinned `brand` objects are disabled. With no catalogue match, omit
   `brand`.

4. Do not invent a URL or silently assign a visually similar company.

The final artifact never fetches a brand asset when opened. Preset vectors
remain embedded in SVG, PNG, WebP, JPEG, Share Card, and WebM exports.

Use `node bin/archify.mjs brands --json` to inspect all canonical IDs, aliases,
categories, domains, and provenance. Current categories cover AI, cloud,
engineering, data, collaboration, business systems, channels, languages, and
frameworks.
