# Design handover bundle → Claude Design

Everything Claude Design needs to design on-brand for greenhueblues, as
self-contained preview pages plus one written spec.

```
design-handover/
  DESIGN_SPEC.md              the written spec (start here)
  tokens.css                  copy-pasteable :root token block
  foundations/
    colors.html               palette, accent tint ramp, section grounds
    type.html                 families + the full scale, with live specimens
    spacing.html              container, spacing scale, rhythm, breakpoints
    motion.html               easing, durations, hover patterns, reduced motion
  patterns/
    nav.html                  fixed 3-col nav + its two breakpoints
    hero.html                 the layered 100vh hero, layer by layer
    project-panels.html       sticky photo panels, numbered + named
    sections.html             section shell, statement/about, CTA
    footer.html               link columns, wordmark, baseline
    meta-and-chips.html       the mono meta texture, chips, pills
    controls.html             buttons/inputs/cards/rows — SPEC ONLY, not shipped
```

Each `.html` opens standalone in a browser (fonts load from Google Fonts) and carries a
first-line `<!-- @dsCard group="..." -->` marker, which is what groups it in the Design
System pane. Groups used: **Foundations**, **Patterns**, **Extended**.

## Pushing it

The push needs a one-time authorization that can only be granted from an interactive
session:

1. In an interactive Claude Code session on this machine, run **`/design-login`** once.
   Headless and SDK runs then reuse it.
2. Ask Claude to push this folder to a Claude Design **design-system** project. It will:
   - `list_projects` → pick the target, or `create_project` if there isn't one.
     The project must be of type `PROJECT_TYPE_DESIGN_SYSTEM`; that type is fixed at
     creation, so pushing into a regular project will not turn it into a design system.
   - `finalize_plan` with `writes: ["foundations/**/*.html", "patterns/**/*.html",
     "tokens.css", "DESIGN_SPEC.md"]` and
     `localDir: d:\trialme\golden-ratio-site\design-handover`.
   - `write_files` with a `localPath` per file, so contents upload straight from disk.

   Cards come from the `@dsCard` markers, so `register_assets` isn't needed.

Sync one component at a time from then on — never a wholesale replace.

## Keeping it honest

`src/index.css` is the source of truth for tokens. When it changes, update
`tokens.css` and the affected card, then re-push just that file.

The root `DESIGN_SYSTEM.md` predates this bundle and documents removed surfaces
(Tailwind, `.pg-btn`, `.index-row`, the blog/leaders/playground sections). Prefer
`DESIGN_SPEC.md` here; see its section 4 for what was dropped.
