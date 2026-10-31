# 02: Pixel minimal visual

Spec: [docs/specs/pixel-blast.md](../../specs/pixel-blast.md)

**What to build:** The terminal report gets the pixel-minimal look: the command in bold with a one-line summary, a `■` size bar per item scaled to the largest, at most 8 rows then `…N more`, and plain hotkey buttons. The report is monochrome: no level label, no accent colours. Narrow panes degrade cleanly; non-terminal surfaces draw the same report as plain text.

**Blocked by:** 01

**Status:** done

- [x] Size bars render on the terminal surface
- [x] Monochrome: no level label, default foreground, bold header, dim bars and notes
- [x] Under 32 body columns the size bars drop
- [x] More than 8 items shows `…N more`
- [x] Desktop surface draws plain text rows and two buttons, no glyph art
- [x] Only single-width glyphs, no emoji
- [x] Tests cover wide, narrow and desktop renders
