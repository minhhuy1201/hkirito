# Brand marks

> **Trust boundary.** The authored brand URL is the initial untrusted input.
> After the first response, redirect locations (`Location` headers), the
> `finalUrl` of the page fetch, and any favicon `href` values found in the
> fetched page's HTML head also become request targets and are themselves
> untrusted. The HTTP client treats every URL in this chain as untrusted and
> enforces:
> - **Byte caps**: `MAX_IMAGE_BYTES = 1024 * 1024` (1 MB) for icons;
>   `MAX_HTML_BYTES = 256 * 1024` (256 KB) for favicon head reads.
> - **Timeout** (default 8 s; `ARCHIFY_BRAND_CAPTURE_TIMEOUT_MS` overrides in
>   the range `[100, 30000]`).
> - **Content-encoding forced to `identity`** (no compressed body to decode).
> - **DNS-pinned lookup** — the socket opens against the *exact* resolved
>   address that passed validation, closing the TOCTOU window between
>   hostname check and socket open.
> - **Content-type allowlist** for icon responses
>   (`image/png`, `image/jpeg`, `image/webp`, `image/x-icon`,
>   `image/vnd.microsoft.icon`). The favicon signature is then matched
>   against the declared type before any bytes are hashed or stored, so a
>   hostile page cannot swap a script payload into a permitted MIME slot.
> - **Length- and encoding-bounded parsing** before any artifact is hashed
>   or stored.
>
> A fetched page can choose the next favicon URL through its HTML head. The
> same URL validation, response-type checks, and byte limits apply to that
> request before its bytes are hashed and embedded.

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
