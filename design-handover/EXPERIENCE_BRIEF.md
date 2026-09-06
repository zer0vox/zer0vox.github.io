# Experience section — design brief

Paste the block below into Claude Design. Everything under the rule is the
prompt; everything above it is a note to whoever is handing it over.

What exists in code today is a deliberately bare baseline: the four models on
the left, the year rail, the chapter copy on the right, and nothing else. The
decorative layer that used to sit on top of it — glowing rings, a ribbon
threaded through the chapters, drifting dust, orbiting dots, idle spin — has
been removed. Design the replacement from the bare state, not from a memory of
that layer.

Two constraints in the prompt are non-negotiable and easy to design past by
accident: the left third belongs to a live WebGL canvas whose contents you do
not control beyond framing, and the CC BY credit must stay visible on the CNAD
chapter.

---

Design the "Experience" section for greenhueblues.me — a personal portfolio
site for Sumip Chaudhary, a software engineer in Nepal. This section is the
career timeline on the About page. It sits between a stack marquee above and a
contact line below.

## The mechanic already built

A tall track holds a sticky, full-viewport stage. As the reader scrolls, the
stage stays put and the content inside it advances through four chapters, one
per viewport of scroll. The current chapter is a fractional value, so the
change between chapters is continuous, not stepped.

The left of the stage is a **live 3D canvas**: a real photographic-quality 3D
model for that chapter, lit and rendered in the browser. The right is the
chapter's copy. A thin rail of years runs down the far left; clicking a year
jumps to that chapter.

I want you to design what sits on and around that — the layout, the type, the
rail, how a chapter announces itself, how one chapter gives way to the next.

## The four chapters

1. **2021 — 2025** · BE, Electronics and Communication Engineering · Certified
   NEC Engineer, 2025 · Nepal
   Model: a motherboard, standing upright.
2. **2025** · Engineering Intern · CNAD — Civil Aviation Authority of Nepal ·
   Communication & Navigation Aid Department
   Model: a military field radio, lying flat.
   **Must show a credit line: `"Military Radio" by ForaMon, CC BY 4.0`, with
   the work, the author and the licence each linked.** This is a licence
   obligation, not a caption — design a place for it that is legible and
   clickable, not hidden in a corner at 8px.
3. **2025 — 2026** · DAAI Fellow · Data, Automation & AI Fellowship · Top
   Performer
   **No model exists for this chapter.** Its left half is currently empty.
   Solving this is part of the brief: either design something typographic or
   graphic that belongs there, or design the layout so a chapter without an
   object doesn't read as broken.
4. **2026 — present** · Software Engineer · MandaapX · Currently brewing
   Model: the MandaapX wordmark in 3D, facing front.

Each chapter also carries one lead sentence, two short bullet points, and a row
of small tool chips (e.g. `VHF`, `RF Communication`, `CNS` — or `FastAPI`,
`React`, `MongoDB`, `Docker`, `AWS`).

## The house style to stay inside

- Background `#0d0d0d`. Text white, with `rgba(255,255,255,.7)` and `.5` for
  secondary and dim.
- Hairlines `rgba(255,255,255,.15)`.
- Two accents, used sparingly and meaningfully: `#a8c7ff` (blue) and `#a8ffc7`
  (green). On this site green reads as the beginning and blue as now.
- Body and UI: Geist. Display: Schibsted Grotesk 800, tracked tight
  (`-0.042em` at large sizes) — used for the chapter role, around 40–70px.
  Small labels and years: Fragment Mono, ~11–13px, letter-spaced.
- Container max width 1600px. Section rhythm `clamp(80px, 10vw, 160px)`.
- Easing `cubic-bezier(.2,.7,.2,1)`.

## What I do not want

The previous version failed on exactly this, so be blunt about avoiding it:

- No glowing circles, halos, rings or aurae behind the object.
- No connector line, ribbon, thread or path drawn between chapters.
- No floating particles, dust, sparkles, or dots orbiting anything.
- No ambient idle motion — nothing that drifts, breathes, pulses or slowly
  rotates on its own. If something moves, the reader's scroll moved it.
- No gradient-mesh blobs or generic "tech" ornament.

The object is photographic and detailed. It should carry the section on its
own, against a mostly empty dark field, the way a product shot does. Restraint
is the brief.

## What to hand back

Artboards at 1600×900:

1. Each of the four chapters, settled.
2. One mid-transition frame, showing how chapter 1 gives way to chapter 2.
3. The DAAI chapter — your answer to the no-object problem.
4. A narrow desktop at 1100×800. The object must stay fully on screen and
   clear of the copy; it clipped off the left edge at this width before.
5. Mobile at 390×844, where the object goes above the copy rather than beside
   it.

Also mark up:

- Where the year rail sits, and its current/inactive/hover states.
- The type scale and the exact spacing between role, org, lead, bullets, chips.
- Where the licence credit lives, and its link styling.
- Anything you intend to move as the reader scrolls, and by how much — I have
  to build it, so say it in numbers rather than adjectives.

One more thing worth knowing: readers on reduced-motion settings, and anyone
without WebGL, get a plain vertical list of the same four chapters instead of
this stage. If your design implies a particular reading order or hierarchy,
that fallback should be able to honour it.
