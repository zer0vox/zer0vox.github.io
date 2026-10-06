// A spiral column of work that breaks up into print grain as it travels away
// from the viewer.
//
// No card is a flat rectangle. The vertex stage maps each one onto the surface
// of the cylinder it orbits, so the outer edges retreat in depth while the
// middle stays square to the camera, and the extremities trail behind the
// centre while the column is turning.
//
// It is built as a pipeline rather than an overlay:
//
//   cards -> colour + channel data -> four axial blurs -> resolve -> screen
//
// One progression value drives every stage of it, taken as the larger of two
// measurements: how close a pixel sits to the top or bottom border, and how far
// back into the spiral it lies. The smear dominates the first half of that
// progression and retreats as the grain claims the second, so the pair reads as
// one continuous process instead of two treatments layered together.
//
// The grain itself is an ordered threshold matrix evaluated against a
// three-point tone scale whose outer stops are both the page colour, sampled at
// the centre of each cell so the cell fills evenly. With both ends of the scale
// equal, the extremes of the range coincide and only a middle band departs
// from the page - which is why the result prints as texture rather than as
// flat posterisation.
import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { GLYPHS, scramble } from "../lib/textFx.js"
import { getLenis } from "../lib/lenis.js"
import "./DitherHelixCarousel.css"

// Ported from the crafterui "dither-helix-carousel" registry item (TSX +
// Tailwind) to plain JSX + CSS. Two changes of substance:
//
//  * `scrollRef` (optional): an element taller than the viewport that this
//    carousel is pinned inside. When given, the page's own scroll position
//    through that element turns the helix, instead of the wheel being captured.
//    The helix loops forever, so capturing the wheel on a full-width canvas
//    would trap the page; this way the reader scrolls past it like any other
//    section. Drag, click-to-turn and wheel are off in that mode; hover focus
//    and the arrow keys (which scroll the page one card) still work.
//  * The entrance waits until the carousel is actually on screen.
//  * `shift` (fraction of the width, default 0): moves the column off centre,
//    so the canvas can run full-bleed beside other content. A `--dhc-shift`
//    custom property on the canvas overrides it, so it can change per
//    breakpoint in CSS.
//  * `ink` (optional CSS colour): prints the whole frame as that one ink on
//    the page colour, so photographs read as a duotone in the house ink.
//  * The render loop only runs while the canvas is near the viewport, and
//    while it runs it skips the passes on any frame that would repeat the
//    last one. A four-pass pipeline redrawn sixty times a second for a section
//    nobody can see, or for a column standing still, was the most expensive
//    thing on the page.
//
// And the type around it, so the caption is as considered as the picture:
//
//  * When the facing card changes, the title decodes out of glyph noise while
//    the red full stop glides to its new end, and the "(01) / 04" counter
//    rolls its digits like an odometer.
//  * `rail` (scroll-driven mode only, default on): a tategaki index of the
//    titles, set in vertical columns in the stage's lower margin, each with a
//    side rule that fills as the helix turns toward that card -- the vertical
//    equivalent of an underline.

/* Spiral geometry, in world units. Vertical spacing is set below the card
   height so consecutive cards overlap and the column resolves as one continuous
   band instead of a stack of separate tiles. */
const CARD_H = 1.6
const RADIUS = 3.8
const RADIUS_STEP = 0.055 // radius step per slot, or overlapping cards z-fight
const CAMERA_Z = 10
const FOV = 48
const NEAR = 0.1
const FAR = 60

/* Navigation. Wheel and pointer both advance a destination value that the
   column chases; once input has stayed quiet long enough to count as finished,
   the destination is rounded to the nearest card. */
const WHEEL = 0.0022
const DRAG = 0.007
const EASE = 0.075
const SNAP_IDLE = 300 // ms; must exceed the spacing of events within one gesture
const SNAP_EASE = 0.055
const CLICK_SLOP = 6

/* Cards deform while the column rotates. The falloff runs vertically, so upper
   and lower edges sweep around the axis while the waist stays put and the
   surface curves away from the direction of travel. */
const BEND = 2.7
const BEND_EASE = 0.12
const BEND_MAX = 0.07

/* Selective focus. Whichever card the cursor rests on clears, while the others
   darken, soften and take on grain. The selection is only reassigned once
   pointer velocity drops to deliberate speed; without that gate, dragging
   quickly across the column would strobe the focus card by card. */
const HOVER_IN = 0.095
const HOVER_OUT = 0.07
const HOVER_SETTLE = 8 // px/frame under which a movement counts as aiming
const FOCUS_FALLOFF = 0.7 // slots over which the dimming ramps to full

/* Introduction. Un-arrived cards are omitted rather than towardPage. A card that is
   not yet present emits nothing, so the blur stages have no light from it to
   drag across the frame. */
const ENTRY_MS = 1050
const ENTRY_STAGGER_MS = 60
const ENTRY_SPIN = 9.4 // slots the helix glides in over
const ENTRY_SPIN_MS = 2400

const CLICK_MS = 1300

const THEME_EVERY = 20

/* Caption. The decode is kept short: it marks the change and gets out of the
   way, landing before the counter's roll has finished settling. */
const DECODE_S = 0.45
const STOP_GLIDE_MS = 560
const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)"

/* The loop starts a little before the canvas scrolls into view, so its first
   visible frame is already a fresh one rather than whatever it last drew. */
const RUN_MARGIN = "25% 0px"

/* The entrance waits for this much of the canvas to be on screen. At the
   first visible sliver the reader would see only the empty top margin of the
   stage, and the spin would be half over before the cards came into view. */
const ENTRY_VISIBLE = 0.35

/* Below this much change since the last frame drawn (in slots, about 0.02px
   of travel; or in 0-1 for the hover, dimming and entrance values, far under
   one step of 8-bit colour) a new frame would be the old one again. */
const STILL = 1e-4

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const pad = (n) => String(n).padStart(2, "0")
const DIGITS = "0123456789".split("")

/** Mechanical counter: each digit is a strip of 0-9 behind a one-figure
    window, moved by a transform so a change rolls through the figures between
    instead of swapping them. Visual only -- the caller supplies the text. */
function Odometer({ value }) {
  return Array.from(value, (digit, place) => (
    <span className="dhc-reel" key={place}>
      <span className="dhc-reel-strip" style={{ "--dhc-digit": digit }}>
        {DIGITS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </span>
    </span>
  ))
}

const inOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/* Ordered threshold matrix built by recursion, yielding an 8x8 pattern in
   [0,1) with no lookup table. Shared by the card stage and the resolve stage so
   a card materialises on precisely the grid it will later break up on. */
const BAYER = /* glsl */ `
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
#define bayer4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
#define bayer8(a) (bayer4(0.5 * (a)) * 0.25 + bayer2(a))
`

const CARD_VERT = /* glsl */ `#version 300 es
in vec2 aPos;                  // 0..1 across the card

uniform float uIndex;
uniform float uProgress;
uniform float uCount;
uniform float uAngleStep;
uniform float uPitch;
uniform float uVelocity;
uniform vec2  uCard;           // width, height in world units
uniform float uFocal;          // 1 / tan(fov / 2)
uniform float uAspect;
uniform float uShift;          // horizontal offset of the column, in NDC

out vec2 vUv;
out float vDepth;

const float RADIUS = ${RADIUS.toFixed(3)};
const float RADIUS_STEP = ${RADIUS_STEP.toFixed(4)};
const float CAMERA_Z = ${CAMERA_Z.toFixed(1)};
const float NEAR = ${NEAR.toFixed(2)};
const float FAR = ${FAR.toFixed(1)};
const float BEND = ${BEND.toFixed(2)};

void main() {
  vUv = vec2(aPos.x, 1.0 - aPos.y);
  vec2 local = (aPos - 0.5) * uCard;

  // Position within the cycle. The seam is never noticed because it falls in
  // the fully dissolved region beyond the top and bottom borders.
  // Referenced to the facing slot rather than to half the total. Half of an odd
  // total lands between two positions, leaving nothing squared up to the camera.
  float slot = mod(uIndex - uProgress, uCount) - floor(uCount * 0.5);
  float baseAngle = slot * uAngleStep;
  float baseY = slot * uPitch;

  // Trailing deformation, with the falloff taken over the card's HEIGHT: upper
  // and lower edges swing laterally about the axis while the waist holds, which
  // curves the surface on its side. Because the angular offset varies down the
  // height, each horizontal row is displaced as a unit and its width is
  // untouched - a falloff taken over the width instead would elongate the card.
  float ty = (aPos.y - 0.5) * 2.0;
  baseAngle += uVelocity * BEND * ty * ty * uAngleStep * 0.5;

  float r = RADIUS + slot * RADIUS_STEP;
  float theta = baseAngle + local.x / r;   // distance across the card as rotation
  vec3 p = vec3(sin(theta) * r, local.y + baseY, cos(theta) * r);

  float vz = p.z - CAMERA_Z;
  vDepth = -vz;
  gl_Position = vec4(
    p.x * uFocal / uAspect + uShift * -vz,
    p.y * uFocal,
    ((FAR + NEAR) * vz + 2.0 * FAR * NEAR) / (NEAR - FAR),
    -vz
  );
}`

const CARD_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
in float vDepth;

uniform sampler2D uMap;
uniform vec2 uImageRatio;      // cover-fit, so nothing is stretched
uniform vec3 uBackground;
uniform float uHover;
uniform float uDim;
uniform float uEntry;          // 1 = absent, 0 = arrived
uniform float uEntryScale;
uniform float uEntryAspect;

layout(location = 0) out vec4 outScene;   // rgb, a = nearness
layout(location = 1) out vec4 outMeta;    // g = dim, b = hover, a = arrived

const float FOG_NEAR = 8.0;
const float FOG_FAR = 20.6;
const float DIM_FADE = 0.67;
const float ENTRY_SOFTNESS = 0.45;

${BAYER}

/* Materialisation: a circle expanding from the card's midpoint, its perimeter
   fragmented cell by cell against the threshold matrix. This gates presence
   rather than opacity - a given cell carries the image at full intensity or
   carries nothing at all, which is what stops it looking like a simple fade.

   Cell size is derived from gl_FragCoord in device pixels instead of from uv,
   keeping the pattern physically identical on every card regardless of how far
   back it sits. */
bool notArrived(vec2 uv) {
  if (uEntry <= 0.0) return false;
  vec2 offset = (uv - 0.5) * vec2(uEntryAspect, 1.0);
  float d = length(offset) / length(vec2(uEntryAspect, 1.0) * 0.5);
  // Extended beyond unity by the feather width so the boundary has somewhere to
  // finish; once progress completes, the most distant cell still sits a whole
  // feather within the card.
  float front = (1.0 - uEntry) * (1.0 + ENTRY_SOFTNESS);
  return (front - d) / ENTRY_SOFTNESS <= bayer8(gl_FragCoord.xy / uEntryScale);
}

void main() {
  // Rejected outright instead of mixed toward the page colour. A card that has
  // not appeared is absent, not dim; mixing would deposit its luminance into the
  // colour target for the blur stages to drag across the whole frame.
  if (notArrived(vUv)) discard;

  vec2 uv = (vUv - 0.5) * uImageRatio + 0.5;
  vec3 color = texture(uMap, uv).rgb;

  // Depth cueing. Contrast is reduced with distance so the far side of the
  // spiral recedes into haze, rather than presenting as equally vivid cards that
  // are simply drawn smaller. Selection exempts a card from it entirely.
  float fog = smoothstep(FOG_NEAR, FOG_FAR, vDepth) * (1.0 - uHover);
  color = mix(color, uBackground, fog);

  // Attenuation for unselected cards, gamma-corrected so the parameter behaves
  // perceptually - a linear half-mix registers as roughly a quarter as dark.
  color = mix(color, uBackground, 1.0 - pow(1.0 - uDim * DIM_FADE, 2.2));

  // The alpha channel transports proximity rather than transparency; the
  // resolve stage reads it to choose a blur level per pixel. It is stored
  // inverted so that cleared background, having no depth, registers as close and
  // is left sharp.
  outScene = vec4(color, 1.0 - fog);
  outMeta = vec4(0.0, uDim, uHover, 1.0 - uEntry);
}`

const QUAD_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0);
}`

/* Single-axis blur, taken only along the vertical. A radially symmetric kernel
   would suggest a lens out of focus; a stretched one suggests displacement. Each
   stage also halves the target dimensions, so successive stages compound the
   reach at no additional sampling cost. */
const BLUR_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uTexel;
uniform float uSpread;
out vec4 fragColor;
void main() {
  vec2 stride = vec2(0.0, uTexel.y) * uSpread;
  vec4 sum = vec4(0.0);
  float total = 0.0;
  for (int i = -8; i <= 8; i++) {
    float fi = float(i);
    float w = exp(-fi * fi / 18.0);
    sum += texture(uMap, vUv + stride * fi) * w;
    total += w;
  }
  fragColor = sum / total;
}`

const COMPOSITE_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;

uniform sampler2D uScene;
uniform sampler2D uMeta;
uniform sampler2D uBlur1;
uniform sampler2D uBlur2;
uniform sampler2D uBlur3;
uniform sampler2D uBlur4;

uniform vec2  uResolution;
uniform vec3  uBackground;
uniform vec3  uAccent;
uniform vec3  uInk;
uniform float uDuotone;
uniform float uFocusSize;
uniform float uDitherScale;
uniform float uEntryScale;

out vec4 fragColor;

const float EDGE_POWER = 1.65;
const float BLUR_STRENGTH = 0.47;
const float FADE_STRENGTH = 0.4;
const float DITHER_AMOUNT = 0.77;
const float DITHER_START = 0.64;
const float DITHER_POWER = 1.25;
const float LEVELS = 8.0;
const float GAMMA = 1.8;
const float MONO = 0.22;

/* Sequencing between the two treatments. The smear governs the early portion of
   the progression and yields ground as the grain assumes the later portion. The
   two deliberately overlap around the smear's maximum, which is what makes the
   transition continuous rather than one effect ending as another begins. */
const float STAGING = 0.55;
const float SMEAR_END = 0.55;
const float GRAIN_BEGIN = 0.45;
const float YIELD = 0.75;

const float HOVER_BLUR = 0.13;
const float HOVER_DITHER = 0.3;
const float HOVER_CURVE = 1.9;
const float HOVER_LEVELS = 8.0;
const float HOVER_CUTOFF = 0.22;
const float HOVER_GAMMA = 1.8;
const float ENTRY_DITHER = 0.45;
const float ENTRY_LEVELS = 4.0;
const float ENTRY_GAMMA = 1.5;

${BAYER}

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

/* Collapses the blur stages into a single colour at a fractional level.
   Factored out so each grain pass can re-sample it on its own cell lattice
   without recomputing the inter-stage weights. */
vec3 blurStack(vec2 uv, float lvl) {
  vec3 c = texture(uScene, uv).rgb;
  c = mix(c, texture(uBlur1, uv).rgb, clamp(lvl - 0.0, 0.0, 1.0));
  c = mix(c, texture(uBlur2, uv).rgb, clamp(lvl - 1.0, 0.0, 1.0));
  c = mix(c, texture(uBlur3, uv).rgb, clamp(lvl - 2.0, 0.0, 1.0));
  c = mix(c, texture(uBlur4, uv).rgb, clamp(lvl - 3.0, 0.0, 1.0));
  return c;
}

/* Mixing toward the page before quantisation lets the pattern dissipate into
   the background instead of terminating against it in visible steps. */
vec3 towardPage(vec3 c, float fade) { return mix(c, uBackground, fade); }

/* Quantises the sample position to the pattern lattice. Reading from the
   centre of each cell holds both colour and threshold constant across it, so the
   cell fills uniformly. Omit this and every cell retains full-resolution detail
   underneath a dot pattern, which registers as noise deposited on the image
   rather than the image being reproduced through a screen. */
vec2 latticeUv(float cell) {
  return (floor(gl_FragCoord.xy / cell) + 0.5) * cell / uResolution;
}

/* A three-point tone scale. The accent occupies a discrete position at the
   centre of the range instead of being mixed across it, which is what makes a
   single hue register as a deliberate choice rather than a wash over the whole
   frame. Both outer stops hold the page colour, so the extremes of the range
   coincide and only the middle band departs from it. */
vec3 toneScale(float t) {
  return t < 0.5
    ? mix(uBackground, uAccent, t * 2.0)
    : mix(uAccent, uBackground, (t - 0.5) * 2.0);
}

/* Reduces luminance to a small number of levels, breaks up the transitions
   against the threshold, and looks the result up on the tone scale. The blend
   factor retains a proportion of the source's own colour by quantising each
   channel independently on the same levels. */
vec3 quantise(vec3 c, float threshold, float levels, float gamma) {
  float steps = max(levels - 1.0, 1.0);
  vec3 toned = toneScale(floor(pow(clamp(luma(c), 0.0, 1.0), gamma) * steps + threshold) / steps);
  vec3 quantized = floor(c * steps + threshold) / steps;
  return mix(quantized, toned, MONO);
}

void main() {
  // Zero across the middle band, rising to one at the upper and lower borders.
  float d = abs(vUv.y - 0.5) * 2.0;
  float edge = pow(smoothstep(uFocusSize, 1.0, d), EDGE_POWER);

  vec4 scene = texture(uScene, vUv);
  vec4 meta = texture(uMeta, vUv);
  float dim = meta.g;
  float entry = 1.0 - meta.a;

  // Exempts the selected card from the border treatment. That treatment keys
  // solely off where a pixel sits, and absent the exemption a card the viewer
  // had just cleared would still smear for no reason but its position.
  float keep = 1.0 - meta.b;

  // A pixel can recede for either of two reasons - depth into the spiral, or
  // proximity to the upper and lower borders. The greater of the two becomes the
  // controlling progression that every later stage is sequenced against.
  float distance = 1.0 - scene.a;
  float dissolve = max(edge, distance);

  float grainFree = pow(smoothstep(DITHER_START, 1.0, max(d, distance)), DITHER_POWER);
  float grainStaged = pow(smoothstep(GRAIN_BEGIN, 1.0, dissolve), DITHER_POWER);
  float smearStaged = smoothstep(0.0, SMEAR_END, dissolve) * (1.0 - grainStaged * YIELD);

  float blurDrive = mix(dissolve, smearStaged, STAGING);
  float ditherDrive = mix(grainFree, grainStaged, STAGING);

  float softness = max(blurDrive, dim * HOVER_BLUR) * keep;
  float lvl = softness * BLUR_STRENGTH * 4.0;
  float fade = edge * FADE_STRENGTH * keep;

  vec3 c = towardPage(blurStack(vUv, lvl), fade);

  // Border grain, driven by depth in addition to where a pixel sits. That is
  // what lets an attenuated card take grain too, since retreating and going
  // unselected amount to the same input at this stage.
  float threshold = bayer8(gl_FragCoord.xy / uDitherScale);
  vec3 source = uDitherScale > 1.0
    ? towardPage(blurStack(latticeUv(uDitherScale), lvl), fade)
    : c;
  vec3 result = mix(c, quantise(source, threshold, LEVELS, GAMMA), DITHER_AMOUNT * ditherDrive * keep);

  // Selection grain is mixed in at fixed settings rather than ramped, so the
  // pattern holds a constant coarseness throughout and merely becomes visible,
  // instead of getting rougher as it appears.
  //
  // Its tail is clipped to zero. Attenuation decays exponentially, so cells fall
  // below their individual thresholds at a halving rate and a handful of
  // stragglers would otherwise persist as long again as the bulk took to go.
  float hoverRamp = smoothstep(HOVER_CUTOFF, 1.0, pow(dim, HOVER_CURVE)) * HOVER_DITHER;
  float hoverThreshold = bayer8(gl_FragCoord.xy / (uDitherScale * 1.35));
  vec3 hoverSource = towardPage(blurStack(latticeUv(uDitherScale * 1.35), lvl), fade);
  // Derived from the unprocessed colour rather than the border-grained result.
  // Quantising an already-quantised pixel re-evaluates the accent's luminance
  // against the scale, which folds that entire band back into the page colour.
  result = mix(result, quantise(hoverSource, hoverThreshold, HOVER_LEVELS, HOVER_GAMMA), hoverRamp);

  // Materialisation grain is applied last, over everything else. While a card
  // is still arriving it is the only thing worth reading; letting the standing
  // grain show through would present as two treatments in competition rather
  // than a single one completing.
  float entryThreshold = bayer8(gl_FragCoord.xy / uEntryScale);
  vec3 entrySource = towardPage(blurStack(latticeUv(uEntryScale), lvl), fade);
  result = mix(
    result,
    quantise(entrySource, entryThreshold, ENTRY_LEVELS, ENTRY_GAMMA),
    entry * ENTRY_DITHER
  );

  // Optional single-ink print: the whole frame is re-read as one ink on the
  // page colour, scaled so the page itself maps back to exactly the page.
  // Works both ways round: dark ink on a light page, or a light ink (paper)
  // on a dark page (marine), where shadows sink into the page instead.
  if (uDuotone > 0.5) {
    float lb = luma(uBackground);
    float l = luma(result);
    if (luma(uInk) < lb) {
      float t = clamp(l / max(lb, 0.001), 0.0, 1.0);
      result = mix(uInk, uBackground, pow(t, 0.85));
    } else {
      float t = clamp((l - lb) / max(1.0 - lb, 0.001), 0.0, 1.0);
      result = mix(uBackground, uInk, pow(t, 0.85));
    }
  }

  fragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}`

function build(gl, vert, frag) {
  const program = gl.createProgram()
  if (!program) return null
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vert],
    [gl.FRAGMENT_SHADER, frag],
  ]) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader))
      return null
    }
    gl.attachShader(program, shader)
    gl.deleteShader(shader)
  }
  gl.bindAttribLocation(program, 0, "aPos")
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    return null
  }
  return program
}

function uniforms(gl, program) {
  const cache = new Map()
  return (name) => {
    let loc = cache.get(name)
    if (loc === undefined) {
      loc = gl.getUniformLocation(program, name)
      cache.set(name, loc)
    }
    return loc
  }
}

/** Resolves any CSS colour to 0-1 RGB by asking the browser instead of parsing
    it. Theme tokens here are written in oklch, and naive comma-splitting of the
    computed string yields a confidently incorrect near-black. */
function colorReader() {
  const probe = document.createElement("canvas")
  probe.width = probe.height = 1
  const ctx = probe.getContext("2d", { willReadFrequently: true })
  return (css) => {
    if (!ctx) return [0, 0, 0]
    ctx.fillStyle = "#000"
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return [r / 255, g / 255, b / 255]
  }
}

function texture(gl, w, h) {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return tex
}

export function DitherHelixCarousel({
  items,
  brand,
  accent,
  cell = 7.5,
  focusBand = 0.25,
  twist = 0.8,
  rise = 0.79,
  cardRatio = 2,
  entry: playEntry = true,
  shift = 0,
  ink,
  scrollRef,
  rail = true,
  className,
  ...props
}) {
  const canvasRef = React.useRef(null)
  const railRef = React.useRef(null)
  const titleRef = React.useRef(null)
  const stopRef = React.useRef(null)
  const [active, setActive] = React.useState(0)
  const [reduced, setReduced] = React.useState(false)
  const [supported, setSupported] = React.useState(true)

  const scrollDriven = scrollRef !== undefined
  // The rail charts progress through a finite sequence, so it only means
  // something when the page scroll drives the helix; free-spinning, the loop
  // has no first or last card.
  const showRail = rail && scrollDriven
  const settings = React.useRef({ accent, ink, shift, cell, focusBand, twist, rise, cardRatio })
  React.useEffect(() => {
    settings.current = { accent, ink, shift, cell, focusBand, twist, rise, cardRatio }
  })
  /** Populated by the render loop so keyboard input drives the same rotation the
      wheel does. */
  const step = React.useRef(() => {})

  const count = items.length
  const sources = items.map((item) => item.image).join(" ")

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const read = () => setReduced(query.matches)
    read()
    query.addEventListener("change", read)
    return () => query.removeEventListener("change", read)
  }, [])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !count) return
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false })
    if (!gl) {
      setSupported(false)
      return
    }

    const readColor = colorReader()
    const cardProgram = build(gl, CARD_VERT, CARD_FRAG)
    const blurProgram = build(gl, QUAD_VERT, BLUR_FRAG)
    const compositeProgram = build(gl, QUAD_VERT, COMPOSITE_FRAG)
    if (!cardProgram || !blurProgram || !compositeProgram) return
    const cardU = uniforms(gl, cardProgram)
    const blurU = uniforms(gl, blurProgram)
    const compositeU = uniforms(gl, compositeProgram)

    // --- geometry ---------------------------------------------------------
    // Each card is a tessellated plane requiring subdivision on both axes. The
    // trailing deformation that sweeps its upper and lower edges around the axis
    // varies continuously down the height, and too few rows would render that
    // curve as a fold.
    const COLS = 40
    const ROWS = 8
    const verts = []
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const x0 = x / COLS
        const x1 = (x + 1) / COLS
        const y0 = y / ROWS
        const y1 = (y + 1) / ROWS
        verts.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1)
      }
    }
    const cardMesh = gl.createVertexArray()
    gl.bindVertexArray(cardMesh)
    const cardBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, cardBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const cardVertexCount = verts.length / 2

    const quad = gl.createVertexArray()
    gl.bindVertexArray(quad)
    const quadBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW
    )
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    // --- targets ----------------------------------------------------------
    const sceneFbo = gl.createFramebuffer()
    let sceneTex = texture(gl, 1, 1)
    let metaTex = texture(gl, 1, 1)
    const depth = gl.createRenderbuffer()
    const blurFbos = [0, 1, 2, 3].map(() => gl.createFramebuffer())
    let blurTex = [0, 1, 2, 3].map(() => texture(gl, 1, 1))

    const attach = (w, h) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo)
      gl.deleteTexture(sceneTex)
      gl.deleteTexture(metaTex)
      sceneTex = texture(gl, w, h)
      metaTex = texture(gl, w, h)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, metaTex, 0)
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth)
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h)
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth)
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1])

      // Every stage halves the target dimensions in addition to blurring, so
      // reach compounds and the deepest stages are nearly free.
      blurTex.forEach((tex) => gl.deleteTexture(tex))
      blurTex = blurFbos.map((fbo, i) => {
        const tex = texture(gl, Math.max(1, w >> (i + 1)), Math.max(1, h >> (i + 1)))
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
        return tex
      })
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    // --- textures ---------------------------------------------------------
    const cards = items.map(() => ({ texture: null, aspect: 1.5 }))
    const images = items.map((item, i) => {
      const image = new Image()
      image.crossOrigin = "anonymous"
      image.decoding = "async"
      image.onload = () => {
        const tex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.generateMipmap(gl.TEXTURE_2D)
        cards[i].texture = tex
        cards[i].aspect = image.naturalWidth / Math.max(image.naturalHeight, 1)
        stale = true
      }
      image.src = item.image
      return image
    })

    // --- state ------------------------------------------------------------
    let width = 0
    let height = 0
    let progress = 0
    let goal = 0
    let smoothed = 0 // velocity feeding the bend
    let lastInput = 0
    let snapped = true
    let hovered = -1
    let pointerX = -1
    let pointerY = -1
    let pointerSpeed = 0
    let ticks = 0
    let frame = 0
    let running = false
    let pausedAt = 0
    let entryStart = 0
    // Set whenever something the shaders cannot see changing has changed: the
    // size of the targets, a texture arriving, the theme. Until the next frame
    // is drawn, skipping it is not allowed.
    let stale = true
    let lastNear = -1
    // Two observers with two jobs: the entrance waits until the canvas is
    // genuinely on screen, while the loop itself is woken a little before
    // (see RUN_MARGIN, below the frame function).
    let inView = false
    const viewObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= ENTRY_VISIBLE
      },
      { threshold: [0, ENTRY_VISIBLE] }
    )
    viewObserver.observe(canvas)

    // The reader's place in the tall wrapper, as ScrollTrigger measures it. It
    // caches the wrapper's bounds and re-measures them on refresh, so the loop
    // never has to read layout every frame to know where the page is.
    let track = null
    if (scrollDriven && scrollRef.current) {
      gsap.registerPlugin(ScrollTrigger)
      track = ScrollTrigger.create({
        trigger: scrollRef.current,
        start: "top top",
        end: "bottom bottom",
      })
    }

    /** Card index (fractional) the page's scroll position through the tall
        wrapper corresponds to. Offset by FRONT so the first item is the one
        facing the viewer at the top. */
    const scrollGoal = () => (track ? track.progress : 0) * (count - 1) - FRONT

    // The rail's side rules, filled from the frame loop. Written only when a
    // value actually changes, and only ever as a transform.
    const railFills = railRef.current
      ? Array.from(railRef.current.querySelectorAll(".dhc-rail-fill"))
      : []
    const railShown = new Float32Array(railFills.length).fill(-1)
    let background = [0, 0, 0]
    let accentRgb = [1, 1, 1]
    let inkRgb = null
    let cssShift = NaN

    // Bringing a card to the front runs on a fixed duration rather than a decay
    // rate, so the traversal takes equally long over one slot or six.
    let tween = null

    const dim = new Float32Array(count)
    const hover = new Float32Array(count)
    const entryOf = new Float32Array(count).fill(playEntry && !reduced ? 1 : 0)
    // What the canvas currently shows, so a frame that would repeat it can be
    // recognised and skipped.
    const shown = { progress: NaN, smoothed: NaN, settings: null }
    const shownDim = new Float32Array(count)
    const shownHover = new Float32Array(count)
    const shownEntry = new Float32Array(count)
    // Re-randomised on every run so the effect is of individual cards
    // appearing, not of a fixed order being replayed.
    const order = items.map((_, i) => i).sort(() => Math.random() - 0.5)

    const focal = 1 / Math.tan((FOV * Math.PI) / 360)
    /** The slot that faces the camera. Everything is measured from here. */
    const FRONT = Math.floor(count / 2)

    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = w
      height = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      attach(canvas.width, canvas.height)
      // Resizing a canvas clears it, so the next frame must be drawn even if
      // the column has not moved.
      stale = true
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    /** Screen placement for a given index in CSS pixels, together with its
        distance from the camera. The layout is columnar, so this is sufficient
        for hit-testing without a ray cast. */
    const shiftNow = () => (Number.isNaN(cssShift) ? settings.current.shift : cssShift)

    const project = (index) => {
      const slot = ((((index - progress) % count) + count) % count) - FRONT
      const angle = slot * settings.current.twist
      const y = slot * settings.current.rise * CARD_H
      const z = Math.cos(angle) * (RADIUS + slot * RADIUS_STEP)
      const away = CAMERA_Z - z
      if (away <= NEAR) return null
      const aspect = width / Math.max(height, 1)
      const sx = ((Math.sin(angle) * (RADIUS + slot * RADIUS_STEP) * focal) / aspect / away) * 0.5 + 0.5 + shiftNow()
      const sy = 0.5 - ((y * focal) / away) * 0.5
      return {
        x: sx * width,
        y: sy * height,
        halfW: ((CARD_H * settings.current.cardRatio * focal) / aspect / away) * 0.5 * width * 0.5,
        halfH: ((CARD_H * focal) / away) * 0.5 * height * 0.5,
        away,
      }
    }

    /** Closest card whose projected bounds contain the pointer. */
    const pick = (px, py) => {
      let best = -1
      let bestAway = Infinity
      for (let i = 0; i < count; i++) {
        const at = project(i)
        if (!at) continue
        if (Math.abs(px - at.x) > at.halfW || Math.abs(py - at.y) > at.halfH) continue
        if (at.away < bestAway) {
          bestAway = at.away
          best = i
        }
      }
      return best
    }

    // --- input ------------------------------------------------------------
    const onWheel = (event) => {
      event.preventDefault()
      tween = null
      goal += event.deltaY * WHEEL
      lastInput = performance.now()
      snapped = false
    }
    if (!scrollDriven) canvas.addEventListener("wheel", onWheel, { passive: false })

    /** Returns false when there is no card that way, so the key can fall
        through to the page instead of being swallowed at either end. */
    step.current = (by) => {
      if (scrollDriven) {
        const host = scrollRef.current
        if (!host) return false
        const lenis = getLenis()
        const per = Math.max(1, host.offsetHeight - window.innerHeight) / Math.max(1, count - 1)
        const top = host.getBoundingClientRect().top + window.scrollY
        // Measured from where a running glide is headed, so a second press
        // during the first moves on another card rather than repeating it.
        const from = lenis ? lenis.targetScroll : window.scrollY
        const card = Math.round((from - top) / per) + by
        if (card < 0 || card > count - 1) return false
        // Through Lenis when it is running, so the jump does not fight its
        // smoothing; instant for a reader who asked for less motion.
        if (lenis) lenis.scrollTo(top + card * per, { duration: 0.9 })
        else window.scrollTo({ top: top + card * per, behavior: reduced ? "auto" : "smooth" })
        return true
      }
      tween = { from: goal, to: Math.round(goal) + by, at: performance.now() }
      lastInput = performance.now()
      snapped = true
      return true
    }

    let dragFrom = null
    let dragTravel = 0
    const onDown = (event) => {
      dragFrom = event.clientY
      dragTravel = 0
      tween = null
      canvas.setPointerCapture(event.pointerId)
    }
    const onMove = (event) => {
      const box = canvas.getBoundingClientRect()
      const nx = event.clientX - box.left
      const ny = event.clientY - box.top
      pointerSpeed = Math.hypot(nx - pointerX, ny - pointerY)
      pointerX = nx
      pointerY = ny
      if (dragFrom !== null && !scrollDriven) {
        const travel = dragFrom - event.clientY
        dragTravel += Math.abs(travel)
        dragFrom = event.clientY
        goal += travel * DRAG
        lastInput = performance.now()
        snapped = false
      }
    }
    const onUp = () => {
      const wasClick = !scrollDriven && dragFrom !== null && dragTravel < CLICK_SLOP
      dragFrom = null
      if (!wasClick) return
      const hit = pick(pointerX, pointerY)
      // Advance to the facing slot along whichever direction is shorter.
      if (hit >= 0) {
        const want = (((hit - FRONT) % count) + count) % count
        const to = want + Math.round((goal - want) / count) * count
        tween = { from: goal, to, at: performance.now() }
        snapped = true
      }
    }
    const onLeave = () => {
      pointerX = -1
      pointerY = -1
      hovered = -1
    }

    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerup", onUp)
    canvas.addEventListener("pointercancel", onUp)
    canvas.addEventListener("pointerleave", onLeave)

    // --- frame ------------------------------------------------------------
    const drawQuad = () => {
      gl.bindVertexArray(quad)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const draw = (now) => {
      if (!running) return
      frame = requestAnimationFrame(draw)
      if (!width || !height) return
      const { cell: cellPx, focusBand: band, twist: turn, rise: pitch, cardRatio: ratio } = settings.current
      const cardW = CARD_H * ratio

      if (ticks++ % THEME_EVERY === 0) {
        const style = getComputedStyle(canvas)
        const was = `${background} ${accentRgb} ${inkRgb} ${cssShift}`
        background = readColor(style.backgroundColor)
        accentRgb = readColor(settings.current.accent ?? style.color)
        inkRgb = settings.current.ink ? readColor(settings.current.ink) : null
        cssShift = parseFloat(style.getPropertyValue("--dhc-shift"))
        if (`${background} ${accentRgb} ${inkRgb} ${cssShift}` !== was) stale = true
      }

      // Held back until there is artwork to reveal - an untextured card samples
      // as black, so beginning earlier would spend the sequence on empty
      // rectangles.
      const ready = cards.every((card) => card.texture)
      if (ready && inView && !entryStart) entryStart = now
      const elapsed = entryStart ? now - entryStart : 0
      if (ready && playEntry && !reduced) {
        for (let rank = 0; rank < count; rank++) {
          const t = (elapsed - rank * ENTRY_STAGGER_MS) / ENTRY_MS
          entryOf[order[rank]] = 1 - clamp(t, 0, 1)
        }
        // Rotation is timed independently of the per-card schedule: it is one
        // gesture applied to the whole column, and it should still be slowing
        // as the final card appears.
        const spin = clamp(elapsed / ENTRY_SPIN_MS, 0, 1)
        progress = goal - ENTRY_SPIN * (1 - inOutCubic(spin))
      } else if (ready) {
        entryOf.fill(0)
      }
      const arriving = playEntry && !reduced && ready && (elapsed < ENTRY_SPIN_MS || !entryStart)

      // --- turn -----------------------------------------------------------
      if (scrollDriven) {
        goal = scrollGoal()
      } else if (tween) {
        const t = clamp((now - tween.at) / CLICK_MS, 0, 1)
        goal = tween.from + (tween.to - tween.from) * inOutCubic(t)
        if (t >= 1) tween = null
      } else if (!snapped && now - lastInput > SNAP_IDLE) {
        goal = Math.round(goal)
        snapped = true
      }

      const before = progress
      if (!arriving) {
        progress += (goal - progress) * (reduced ? 1 : snapped ? SNAP_EASE : EASE)
      }
      const velocity = progress - before
      // The trailing bend is motion for its own sake; a reader who asked for
      // less of it gets cards that stay flat to the cylinder.
      smoothed = reduced
        ? 0
        : smoothed + (clamp(velocity, -BEND_MAX, BEND_MAX) - smoothed) * BEND_EASE

      // React hears about the facing card only when it changes, not once a
      // frame.
      const near = ((Math.round(goal) + FRONT) % count + count) % count
      if (near !== lastNear) {
        lastNear = near
        setActive(near)
      }

      // --- rail -----------------------------------------------------------
      // Read from the same scroll goal the column follows (which Lenis has
      // already smoothed), so rule and helix move as one; a second easing here
      // would only make the rule trail the picture. It takes no part in the
      // entrance spin, so it always reads where the reader actually is.
      if (railFills.length) {
        const railAt = clamp(goal + FRONT, 0, count - 1)
        for (let i = 0; i < railFills.length; i++) {
          // Card i's rule fills over the turn that brings it to the front. The
          // first card faces from the start, so its rule is always full.
          const fill = i === 0 ? 1 : clamp(railAt - (i - 1), 0, 1)
          if (Math.abs(fill - railShown[i]) < 0.001) continue
          railShown[i] = fill
          railFills[i].style.transform = `scaleY(${fill.toFixed(4)})`
        }
      }

      // --- hover ----------------------------------------------------------
      // Reassigned only once pointer velocity drops to deliberate speed;
      // otherwise a fast sweep would strobe the focus from card to card.
      if (pointerX >= 0 && pointerSpeed < HOVER_SETTLE) hovered = pick(pointerX, pointerY)
      pointerSpeed *= 0.8
      for (let i = 0; i < count; i++) {
        const isHovered = i === hovered
        const wantHover = isHovered ? 1 : 0
        hover[i] += (wantHover - hover[i]) * (wantHover > hover[i] ? HOVER_IN : HOVER_OUT)
        let wantDim = 0
        if (hovered >= 0) {
          // Distance in slots, taken the short way round the loop.
          let gapTo = Math.abs(i - hovered)
          gapTo = Math.min(gapTo, count - gapTo)
          wantDim = clamp(gapTo / FOCUS_FALLOFF, 0, 1)
        }
        dim[i] += (wantDim - dim[i]) * (wantDim > dim[i] ? HOVER_IN : HOVER_OUT)
      }

      // --- skip -----------------------------------------------------------
      // No clock reaches the shaders: the picture is a pure function of the
      // values below. Once the column has settled and nothing is easing, the
      // next frame would repeat the last one exactly, so the passes are
      // skipped and the canvas goes on showing what it has. The loop itself
      // keeps polling, which costs next to nothing.
      let change =
        Math.abs(progress - shown.progress) + Math.abs(smoothed - shown.smoothed)
      for (let i = 0; i < count; i++) {
        change +=
          Math.abs(dim[i] - shownDim[i]) +
          Math.abs(hover[i] - shownHover[i]) +
          Math.abs(entryOf[i] - shownEntry[i])
      }
      if (!stale && shown.settings === settings.current && !(change > STILL)) return
      stale = false
      shown.progress = progress
      shown.smoothed = smoothed
      shown.settings = settings.current
      shownDim.set(dim)
      shownHover.set(hover)
      shownEntry.set(entryOf)

      // --- pass one: the cards -------------------------------------------
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.enable(gl.DEPTH_TEST)
      gl.clearBufferfv(gl.COLOR, 0, [background[0], background[1], background[2], 1])
      gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 1])
      gl.clear(gl.DEPTH_BUFFER_BIT)
      gl.useProgram(cardProgram)
      gl.bindVertexArray(cardMesh)
      gl.uniform1f(cardU("uCount"), count)
      gl.uniform1f(cardU("uProgress"), progress)
      gl.uniform1f(cardU("uAngleStep"), turn)
      gl.uniform1f(cardU("uPitch"), pitch * CARD_H)
      gl.uniform1f(cardU("uVelocity"), smoothed)
      gl.uniform2f(cardU("uCard"), cardW, CARD_H)
      gl.uniform1f(cardU("uFocal"), focal)
      gl.uniform1f(cardU("uAspect"), width / height)
      gl.uniform1f(cardU("uShift"), shiftNow() * 2)
      gl.uniform3fv(cardU("uBackground"), background)
      gl.uniform1i(cardU("uMap"), 0)
      gl.uniform1f(cardU("uEntryScale"), 9.5)
      gl.uniform1f(cardU("uEntryAspect"), ratio)
      gl.activeTexture(gl.TEXTURE0)

      for (let i = 0; i < count; i++) {
        const card = cards[i]
        if (!card.texture) continue
        gl.bindTexture(gl.TEXTURE_2D, card.texture)
        gl.uniform1f(cardU("uIndex"), i)
        gl.uniform1f(cardU("uHover"), hover[i])
        gl.uniform1f(cardU("uDim"), dim[i])
        gl.uniform1f(cardU("uEntry"), entryOf[i])
        gl.uniform2f(
          cardU("uImageRatio"),
          card.aspect < ratio ? 1 : ratio / card.aspect,
          card.aspect < ratio ? card.aspect / ratio : 1
        )
        gl.drawArrays(gl.TRIANGLES, 0, cardVertexCount)
      }
      gl.disable(gl.DEPTH_TEST)

      // --- pass two: the blur chain ---------------------------------------
      gl.useProgram(blurProgram)
      gl.uniform1i(blurU("uMap"), 0)
      gl.uniform1f(blurU("uSpread"), 4.5)
      let source = sceneTex
      for (let i = 0; i < 4; i++) {
        const w = Math.max(1, canvas.width >> (i + 1))
        const h = Math.max(1, canvas.height >> (i + 1))
        gl.bindFramebuffer(gl.FRAMEBUFFER, blurFbos[i])
        gl.viewport(0, 0, w, h)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, source)
        gl.uniform2f(blurU("uTexel"), 1 / w, 1 / h)
        drawQuad()
        source = blurTex[i]
      }

      // --- pass three: the composite --------------------------------------
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(compositeProgram)
      const bound = [sceneTex, metaTex, ...blurTex]
      const names = ["uScene", "uMeta", "uBlur1", "uBlur2", "uBlur3", "uBlur4"]
      bound.forEach((tex, unit) => {
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.uniform1i(compositeU(names[unit]), unit)
      })
      gl.uniform2f(compositeU("uResolution"), canvas.width, canvas.height)
      gl.uniform3fv(compositeU("uBackground"), background)
      gl.uniform3fv(compositeU("uAccent"), accentRgb)
      gl.uniform3fv(compositeU("uInk"), inkRgb ?? accentRgb)
      gl.uniform1f(compositeU("uDuotone"), inkRgb ? 1 : 0)
      gl.uniform1f(compositeU("uFocusSize"), band)
      gl.uniform1f(compositeU("uDitherScale"), cellPx)
      gl.uniform1f(compositeU("uEntryScale"), 9.5)
      drawQuad()
      gl.activeTexture(gl.TEXTURE0)
    }

    // The loop is scheduled only while the canvas is near the viewport. Off
    // screen it stops asking for frames altogether; the canvas keeps showing
    // the last one it drew.
    const resume = () => {
      if (running) return
      running = true
      // Timed sequences carry on from where they were left, instead of jumping
      // to their end because the clock kept running while nobody watched.
      if (pausedAt) {
        const away = performance.now() - pausedAt
        if (entryStart) entryStart += away
        if (tween) tween.at += away
        pausedAt = 0
      }
      // The browser may have dropped what the canvas showed while it was out
      // of sight; the first frame back is always drawn.
      stale = true
      frame = requestAnimationFrame(draw)
    }
    const pause = () => {
      if (!running) return
      running = false
      pausedAt = performance.now()
      cancelAnimationFrame(frame)
    }
    const runObserver = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? resume() : pause()),
      { rootMargin: RUN_MARGIN }
    )
    runObserver.observe(canvas)

    return () => {
      pause()
      runObserver.disconnect()
      track?.kill()
      observer.disconnect()
      viewObserver.disconnect()
      canvas.removeEventListener("wheel", onWheel)
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      canvas.removeEventListener("pointerleave", onLeave)
      for (const image of images) image.onload = null
      for (const card of cards) if (card.texture) gl.deleteTexture(card.texture)
      gl.deleteTexture(sceneTex)
      gl.deleteTexture(metaTex)
      blurTex.forEach((tex) => gl.deleteTexture(tex))
      blurFbos.forEach((fbo) => gl.deleteFramebuffer(fbo))
      gl.deleteFramebuffer(sceneFbo)
      gl.deleteRenderbuffer(depth)
      gl.deleteBuffer(cardBuffer)
      gl.deleteBuffer(quadBuffer)
      gl.deleteVertexArray(cardMesh)
      gl.deleteVertexArray(quad)
      gl.deleteProgram(cardProgram)
      gl.deleteProgram(blurProgram)
      gl.deleteProgram(compositeProgram)
    }
    // `sources` stands in for `items`: the loop owns the textures, so it must
    // rebuild when the pictures change and must not when a label does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources, count, reduced, playEntry, scrollDriven, showRail])

  // --- caption --------------------------------------------------------------
  // The title is printed imperatively: scramble() rewrites the node's text, so
  // React renders only the first title and never touches that node again.
  const title = items[active]?.title ?? ""
  const [firstTitle] = React.useState(title)
  const printed = React.useRef(title)
  const glide = React.useRef(null)

  React.useEffect(() => {
    const el = titleRef.current
    const stop = stopRef.current
    if (!el || !stop || printed.current === title) return undefined
    printed.current = title
    if (reduced) {
      el.textContent = title
      return undefined
    }

    // The full stop belongs to the sentence, not to any one title, so it
    // travels from the old end to the new one instead of vanishing with the
    // letters. Its start is read before anything moves -- mid-glide if a fast
    // scroll changed the card again -- so a chain of changes stays one motion.
    const from = stop.getBoundingClientRect().left
    glide.current?.cancel()
    el.style.width = ""
    el.textContent = title
    // Held at the new title's width while the noise runs, and clipped to it:
    // proportional glyphs would otherwise jostle the full stop on every frame
    // of the decode, or run over it.
    el.style.width = `${el.getBoundingClientRect().width}px`
    el.classList.add("is-decoding")
    const to = stop.getBoundingClientRect().left
    if (Math.abs(from - to) > 0.5) {
      glide.current = stop.animate(
        [{ transform: `translateX(${from - to}px)` }, { transform: "none" }],
        { duration: STOP_GLIDE_MS, easing: EASE_OUT_EXPO }
      )
    }

    const release = () => {
      el.style.width = ""
      el.classList.remove("is-decoding")
    }
    const cancel = scramble(el, {
      text: title,
      duration: DECODE_S,
      chars: GLYPHS.ascii,
      spread: 0.3,
      fps: 30,
      onDone: release,
    })
    return () => {
      cancel()
      release()
    }
  }, [title, reduced])

  // Only on unmount: the glide is otherwise handed from one change to the next.
  React.useEffect(() => () => glide.current?.cancel(), [])

  // No WebGL2 - a blank rectangle is the one outcome worse than no effect. The
  // helix without its shader is still the work: a native snap scroller of the
  // same pictures, in the same order.
  if (!supported) {
    return (
      <section
        aria-roledescription="carousel"
        aria-label={brand ?? "Gallery"}
        className={["dhc", "dhc--static", className].filter(Boolean).join(" ")}
        {...props}
      >
        <ul className="dhc-list">
          {items.map((entry) => (
            <li key={entry.image}>
              <img src={entry.image} alt={entry.title} style={{ aspectRatio: cardRatio }} />
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label={brand ?? "Gallery"}
      className={["dhc", className].filter(Boolean).join(" ")}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="dhc-canvas"
        tabIndex={0}
        role="listbox"
        aria-label={brand ?? "Gallery"}
        // The options live in the sibling .dhc-sr list; aria-owns makes them
        // this listbox's, so the active descendant resolves.
        aria-owns={items.map((_, i) => `dither-helix-${i}`).join(" ")}
        aria-activedescendant={`dither-helix-${active}`}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") step.current(1)
          else if (event.key === "ArrowUp") step.current(-1)
          else return
          event.preventDefault()
        }}
      />

      {/* Everything visible is painted into the canvas, so assistive technology
          and keyboard users receive this equivalent instead: the same entries in
          the same sequence. */}
      <ul className="dhc-sr">
        {items.map((item, i) => (
          <li key={item.image} id={`dither-helix-${i}`} role="option" aria-selected={i === active}>
            {item.title}
          </li>
        ))}
      </ul>

      {brand ? <div className="dhc-brand">{brand}</div> : null}

      {/* The index: one vertical column per card, read right to left as
          vertical text is. Decorative -- the list above already says all of
          it -- so it is hidden from assistive technology. */}
      {showRail ? (
        <ol className="dhc-rail" ref={railRef} aria-hidden="true">
          {items.map((item, i) => (
            <li key={item.image} className={i === active ? "dhc-rail-item is-active" : "dhc-rail-item"}>
              <span className="dhc-rail-num">
                (<span className="dhc-rail-tcy">{pad(i + 1)}</span>)
              </span>
              <span className="dhc-rail-name">{item.title}</span>
              <span className="dhc-rail-rule">
                <span className="dhc-rail-fill" />
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="dhc-caption">
        {/* The rolling figures are strips of every digit, which would read
            aloud as noise; assistive technology gets the plain count. */}
        <div className="dhc-count">
          <span className="dhc-vh">
            ({pad(active + 1)}) / {pad(count)}
          </span>
          <span className="dhc-count-face" aria-hidden="true">
            <span>(</span>
            <Odometer value={pad(active + 1)} />
            <span>)</span>
            <span className="dhc-count-total"> / {pad(count)}</span>
          </span>
        </div>
        <div className="dhc-title">
          <span className="dhc-title-text" ref={titleRef}>
            {firstTitle}
          </span>
          <span className="dhc-title-stop" ref={stopRef} aria-hidden="true">
            .
          </span>
        </div>
      </div>
    </section>
  )
}

export default DitherHelixCarousel
