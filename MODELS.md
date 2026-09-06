# 3D models

The four chapter models behind the Experience section on the About page live in
`public/models/`. They are referenced by path from `src/data/experience.js` and
loaded at runtime by `src/lib/models.js` — not imported, so Vite copies them
verbatim and they are fetched only when the section arms.

## What is in there

| File | Chapter | Source | Licence |
| --- | --- | --- | --- |
| `electronics.glb` | BE Electronics & Communication | Sketchfab (`Asus_Z170-P_Mobo`) | **unknown — see below** |
| `radio.glb` | CNAD internship | Sketchfab, "Military Radio" by ForaMon | CC BY 4.0 — **attribution required** |
| `mandaapx.glb` | MandaapX | MandaapX GLB writer (own asset) | own |

The DAAI Fellowship chapter has no model on purpose. It falls back to the
abstract helix node, which is a first-class look rather than a gap.

### Licences — read before publishing

`radio.glb` is **CC BY 4.0** and may not be shown without crediting the work,
its author and the licence. That credit is data, not decoration: it lives on
the `credit` field of the CNAD entry in `src/data/experience.js` and renders
under the stage whenever that chapter is current. Do not remove it while the
model is in use.

`electronics.glb` was exported by Sketchfab (its generator string says so) but
arrived **without the `license.txt` that a Sketchfab download normally ships
with**. Most Sketchfab downloadables are CC BY, which would oblige the same
kind of credit. Find the model's Sketchfab page, and either add a `credit` to
that entry the way the radio has one, or swap the model. Until that is
settled, treat this file as not cleared for publication.

## The compression pipeline

The sources are far too heavy to ship — 130 MB between them, `electronics.glb`
alone 92 MB with 76 MB of PNG textures. They were re-encoded with
[`gltf-transform`](https://gltf-transform.dev):

```sh
npx @gltf-transform/cli@4.5.0 optimize <src> public/models/<name>.glb \
  --compress meshopt --texture-compress webp --texture-size 2048 \
  --simplify false --no-instance
```

Result: 92 MB → 3.1 MB, 41 MB → 1.0 MB, 847 KB → 99 KB.

Two choices worth keeping:

- **meshopt, not Draco.** The meshopt decoder is an ES module inside the
  `three` package (`three/addons/libs/meshopt_decoder.module.js`), so Vite
  bundles it. Draco's decoder is a wasm pair that would have to be copied into
  `public/` and kept in step with the `three` version by hand.
- **`--simplify false`.** An earlier pass simplified the board from 312k
  triangles to 16k, which cut it to 592 KB but visibly cheapened the one model
  that is meant to carry the opening chapter. Geometry is not where this page
  is expensive. If a smaller build is ever needed, `--simplify-error 0.0004`
  gives ~87k triangles at 1.1 MB and is the first thing to reach for; drop
  `--texture-size` to 1024 before simplifying further.

## Adding or replacing one

1. Re-encode with the command above.
2. **Measure it before positioning it**:
   `npx @gltf-transform/cli inspect public/models/<name>.glb` prints the scene
   bounding box. The axis with the smallest extent is the one currently
   pointing up — a model authored lying flat has a small Y, and needs
   `rotation: [90, 0, 0]` to stand up. A flat thing left lying down is
   invisible from this near-level camera, which is exactly how the board
   presented before it was corrected.
3. Point a `model` field at it in `src/data/experience.js` and tune `rotation`,
   `scale` and `sway` there. The components take no per-model knowledge.

Nothing needs a size or a position: `prepare()` in `src/lib/models.js`
recentres every model on its bounding box and normalizes its longest side to
one world unit, and the scene decides what a world unit is worth at the current
window size.

## Materials

Chapter models are lit by three tinted directional lights **and a
`RoomEnvironment` probe**. The probe is not optional polish: the board's
material is `metalness: 1`, and a metal surface reflects its surroundings
rather than responding to direct light, so without an environment it renders
black — which on this background is indistinguishable from not loading at all.
