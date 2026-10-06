import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GLYPHS, scramble } from '../lib/textFx.js'
import filmPhone from '../assets/video/kathmandu-dusk-720.mp4'
import filmAv1 from '../assets/video/kathmandu-dusk-1080-av1.mp4'
import filmAv1Uhd from '../assets/video/kathmandu-dusk-2160-av1.mp4'
import filmH264 from '../assets/video/kathmandu-dusk-1080.mp4'
import posterSrc from '../assets/video/kathmandu-dusk-poster.jpg'
import './DuskPlate.css'

// The interlude between the marine work spread and the contact block: a film
// of the ridge over Kathmandu going dark at dusk, with a plane coming in to
// land across it, shown first as a print and then as itself.
//
// The section is a pinned sheet. As it comes up the page, the film is printed
// live in marine type on paper: every frame is sampled into a character grid,
// and each cell's darkness picks a glyph from a ramp. The print surfaces from
// the top down as the sheet rises, as a print comes up in the tray, so the
// part on screen is the part that has formed. As the sheet takes the screen a
// slit is cut in the print, hung on the page margin under the caption with
// crop marks at its corners, and opens into a frame of the real footage, in
// register with the type around it; the scroll then widens the frame until
// the photograph has the whole sheet. The line from the practice statement,
// "based in Kathmandu and working globally", is set in the sky above it all:
// the top of this film is light in every frame, so ink holds there over the
// print and over the picture alike.
//
// On a phone a 16:9 picture covering the portrait sheet would keep barely a
// quarter of its width, and the plane flies outside that slice. There the
// print and the picture share a plate instead: the width of the screen, no
// taller than 4:5, set in the paper between the caption and the transport.
// The frame opens inside it and widens to fill it.
//
// The print is drawn as a diff and only when asked for: a frame is requested
// when the film presents a new picture (at most 24 times a second), when the
// scroll moves the develop or the frame, and for as long as cells are
// churning. Each glyph is copied from a pre-set atlas rather than set as text,
// rows off the screen wait until they are on it, and once the photograph
// covers the plate the canvas is hidden and idle.

gsap.registerPlugin(ScrollTrigger)

// Lightest to densest, as the hero relief's interlude printed them.
const RAMP = ' .:-=+*#%@'
const TOP = RAMP.length - 1
// The same pool the page's text scrambles churn through.
const NOISE = GLYPHS.ascii
const NOISE_COUNT = NOISE.length

// Atlas codes. 0 is an empty cell; 1..9 are the ramp in marine (the print);
// from 10 on, the noise glyphs in pale marine. No red here: the page keeps its
// one red for the full stop and the band.
const NOISE_BASE = TOP + 1
const SPRITES = NOISE_BASE + NOISE_COUNT - 1

const MARINE = '#003b5c'
const NOISE_INK = 'rgba(0, 59, 92, 0.42)'

// Tone. A cell's darkness is one minus the luma of the film under it, then
// levelled: the bright orange low in the sky drops to bare paper, the dark
// ridge and the city fill the top of the ramp, and the plane comes out as a
// knot of dense glyphs against the light. HOLD is hysteresis: a cell only
// changes when its tone has moved by more than this, so the grain and the
// small shake of a handheld camera do not set the whole sheet flickering.
const LEVEL_LO = 0.32
const LEVEL_HI = 0.86
const HOLD = 0.06

// Develop. A cell lands when the develop value passes its turn. ROW_BIAS of
// the turn is the cell's height on the plate, so the print forms from the top
// down as the sheet rises into view; TONE_BIAS is its darkness (shadows
// first); the rest is chance. NOISE_WINDOW is how far ahead of landing a cell
// starts to churn; every turn lies beyond it, so a print that has not begun
// to develop is clean paper. A cell that will land blank (the open sky) only
// shows a glyph one churn step in four, so the sky comes up as a light
// scatter rather than a field of static.
const ROW_BIAS = 0.5
const TONE_BIAS = 0.3
const NOISE_WINDOW = 0.16
const BLANK_TONE = 0.5 / TOP
const turnAt = (row, tone, chance) =>
  Math.min(
    0.999,
    NOISE_WINDOW + (1 - NOISE_WINDOW) * (ROW_BIAS * row + TONE_BIAS * (1 - tone) + (1 - ROW_BIAS - TONE_BIAS) * chance),
  )

// The print runs at film rate or below, never at the display's.
const PRINT_FPS = 24
const PRINT_MS = 1000 / PRINT_FPS

// The film: 30 frames a second, run from FILM_IN to FILM_OUT and round again:
// the wide skyline, the plane coming in over the ridge, the zoom onto it.
// Past 17.5s the camera tilts off the ridge onto bare orange sky before the
// clip's own hard cut, so that tail is never shown. The poster is the frame
// at 15.5s (the plane over the orange sky); it stands wherever the film does
// not run on its own.
const FILM_FPS = 30
const FILM_IN = 0
const FILM_OUT = 17.5
const POSTER_TIME = 15.5

const PHONE = 810
// The phone plate is at most this tall for its width (4:5), so the picture
// keeps nearly half its width, and its crop leans left of centre, where the
// plane flies for most of the run.
const PLATE_MAX = 1.25
const PHONE_FOCUS = 0.42

// 4x4 ordered (Bayer) thresholds, centred in each step.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Cheap integer hash for the churn: stable per (cell, step), different
// between neighbours.
const hash = (a, b) => {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}

// Cell height in CSS px for a given sheet width: about 11px on a laptop, never
// under 9px, below which a phone shows noise rather than characters.
const cellFor = (width) => clamp(width * 0.0076, 9, 12)
// Cells are narrower than tall, like set type: a mono advance is 0.6em.
const CELL_ASPECT = 0.64

const pad2 = (n) => String(n).padStart(2, '0')
// SMPTE-style hh:mm:ss:ff from a frame count.
const timecode = (frame) => {
  const ff = frame % FILM_FPS
  const s = Math.floor(frame / FILM_FPS)
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}:${pad2(ff)}`
}

const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const STAGE_VARS = ['--ap-t', '--ap-r', '--ap-b', '--ap-l', '--marks', '--pl-t', '--pl-l', '--pl-w', '--pl-h', '--pl-x']

export default function DuskPlate() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const captionRef = useRef(null)
  const tcRef = useRef(null)
  const reelRef = useRef(null)
  // Set once the reader pauses the film themselves (and from the start when
  // it may not run on its own), so coming back into view does not restart it.
  const userPausedRef = useRef(false)
  // Whether the film is going to run on its own: until it has, the print
  // takes its first frame from the film rather than from the poster.
  const autoRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  // --- the print, the frame and the caption -----------------------------------
  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    const video = videoRef.current
    const caption = captionRef.current
    const ctx = canvas?.getContext('2d')
    if (!root || !stage || !ctx || !video || !caption) return undefined
    // Reduced motion: the stylesheet's finished sheet (the photograph with
    // its caption, no pin) stands as it is.
    if (prefersReduced()) return undefined

    root.classList.add('is-live')
    const fontFamily = getComputedStyle(root).getPropertyValue('--mono').trim() || 'monospace'

    const state = { develop: 0, marks: 0, open: 0, widen: 0 }
    let disposed = false
    let raf = 0
    let inView = false
    let resizeTimer = 0
    let last = -Infinity
    let covered = false

    // Grid: rebuilt on resize. Frame: where the slit opens and the plate it
    // widens to, in stage px. Skip: the print hidden under the film and mat.
    let grid = null
    let frame = null
    let matPad = 0
    let ap = { x0: 0, y0: 0, x1: 0, y1: 0 }
    let skip = { x0: 0, y0: 0, x1: 0, y1: 0, any: false }

    const atlas = document.createElement('canvas')
    const atlasCtx = atlas.getContext('2d')
    // The film is shrunk in two steps: to twice the grid on a GPU canvas (an
    // area-averaged reduction, so a cell's tone is the mean under it and not
    // whichever pixel the filter landed on), then to the grid on a CPU canvas
    // that is read back. Reading back a full 1080p frame every time would
    // cost far more than the print itself.
    const mid = document.createElement('canvas')
    const midCtx = mid.getContext('2d')
    const tiny = document.createElement('canvas')
    const tinyCtx = tiny.getContext('2d', { willReadFrequently: true })
    let pixels = null
    let sampledAt = NaN

    const poster = new Image()
    poster.decoding = 'async'
    let posterReady = false

    // The print shows what the frame would show. Until the film has run, the
    // element shows its poster, so the film's own first frame stands in only
    // when the film is about to run on from it.
    const source = () => {
      if (video.readyState >= 2 && video.videoWidth && (video.played.length || autoRef.current)) {
        return { el: video, w: video.videoWidth, h: video.videoHeight, at: video.currentTime }
      }
      if (posterReady) return { el: poster, w: poster.naturalWidth, h: poster.naturalHeight, at: -1 }
      return null
    }

    const sample = () => {
      const src = source()
      if (!src || !src.w || (pixels && src.at === sampledAt)) return
      const { cols, rows, cw, ch, ox, oy, plate } = grid
      // The grid's box in source pixels, placed the way object-fit: cover and
      // the plate's object-position place the film, so type and picture stay
      // in register.
      const s = Math.max(plate.w / src.w, plate.h / src.h)
      const fx = (plate.w - src.w * s) * plate.focus
      const fy = (plate.h - src.h * s) / 2
      const sx = Math.max(0, (ox - plate.x - fx) / s)
      const sy = Math.max(0, (oy - plate.y - fy) / s)
      const sw = Math.min(src.w - sx, (cols * cw) / s)
      const sh = Math.min(src.h - sy, (rows * ch) / s)
      midCtx.drawImage(src.el, sx, sy, sw, sh, 0, 0, mid.width, mid.height)
      tinyCtx.drawImage(mid, 0, 0, cols, rows)
      pixels = tinyCtx.getImageData(0, 0, cols, rows).data
      sampledAt = src.at
    }

    const buildAtlas = (cw, ch) => {
      atlas.width = SPRITES * cw
      atlas.height = ch
      atlasCtx.clearRect(0, 0, atlas.width, atlas.height)
      const size = Math.round(Math.min(ch * 0.95, cw / 0.6))
      atlasCtx.font = `400 ${size}px ${fontFamily}`
      atlasCtx.textAlign = 'center'
      atlasCtx.textBaseline = 'alphabetic'
      // Baseline placed so a capital's height sits centred in the cell.
      const baseline = Math.round(ch / 2 + size * 0.35)
      const put = (code, glyph, ink) => {
        atlasCtx.fillStyle = ink
        atlasCtx.fillText(glyph, (code - 1) * cw + cw / 2, baseline)
      }
      for (let k = 1; k <= TOP; k++) put(k, RAMP[k], MARINE)
      for (let j = 0; j < NOISE_COUNT; j++) put(NOISE_BASE + j, NOISE[j], NOISE_INK)
    }

    // --- the frame -------------------------------------------------------------
    // One rectangle drives the cut: the film is clipped to it, the paper mat
    // and the crop marks sit around it (all in CSS, from four insets), and the
    // print skips the cells it covers. It starts as a 16:9 frame hung on the
    // page margin (margin to margin on a phone) in the paper under the
    // caption, opens out of a slit along its middle, then grows to the plate.
    const apply = () => {
      if (!frame) return
      const { W, H, plate } = frame
      const e = state.widen
      const x0 = frame.x0 + (plate.x - frame.x0) * e
      const x1 = frame.x1 + (plate.x + plate.w - frame.x1) * e
      const y0 = frame.y0 + (plate.y - frame.y0) * e
      const y1 = frame.y1 + (plate.y + plate.h - frame.y1) * e
      const middle = (y0 + y1) / 2
      const half = ((y1 - y0) / 2) * state.open
      // Whole pixels, so the marks' hairlines stay crisp while they travel.
      ap = {
        x0: Math.round(x0),
        x1: Math.round(x1),
        y0: Math.round(middle - half),
        y1: Math.round(middle + half),
      }
      const style = stage.style
      style.setProperty('--ap-t', `${ap.y0}px`)
      style.setProperty('--ap-r', `${W - ap.x1}px`)
      style.setProperty('--ap-b', `${H - ap.y1}px`)
      style.setProperty('--ap-l', `${ap.x0}px`)
      style.setProperty('--marks', state.marks.toFixed(3))

      // The film and the mat around it hide the print they cover. Once that
      // is the whole plate (the mat can get there before the cut itself
      // does), the canvas is hidden and nothing is sampled or drawn.
      const pad = matPad * state.marks
      skip = { x0: ap.x0 - pad, y0: ap.y0 - pad, x1: ap.x1 + pad, y1: ap.y1 + pad, any: ap.y1 > ap.y0 || pad > 0 }
      const nowCovered =
        ap.y1 > ap.y0 &&
        skip.x0 <= plate.x + 1 &&
        skip.y0 <= plate.y + 1 &&
        skip.x1 >= plate.x + plate.w - 1 &&
        skip.y1 >= plate.y + plate.h - 1
      if (nowCovered !== covered) {
        covered = nowCovered
        canvas.style.visibility = covered ? 'hidden' : ''
      }
    }

    const layout = () => {
      const W = stage.clientWidth
      const H = stage.clientHeight
      if (!W || !H) return
      const phone = W <= PHONE
      const vw = window.innerWidth
      const margin = clamp(vw * 0.04, 20, 56)

      // The mat's reach as the stylesheet sets it (crop gap + arm + air), a
      // little under, so the print never leaves a gap at its edge.
      matPad = (clamp(vw * 0.0062, 5, 9) + clamp(vw * 0.0125, 10, 18) + clamp(vw * 0.006, 6, 9)) * 0.8
      // The open paper between the caption and the transport, with the mat
      // and a little air clear of both.
      const air = matPad / 0.8 + 16
      const deck = stage.querySelector('.dp-transport')
      const top = caption.offsetTop + caption.offsetHeight + air
      const bottom = (deck ? deck.offsetTop : H) - air

      // Whole device pixels per cell, so every sprite lands on the pixel grid
      // and a cell can be cleared without leaving seams.
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cellH = cellFor(W)
      const chD = Math.max(4, Math.round(cellH * dpr))
      const cwD = Math.max(3, Math.round(cellH * CELL_ASPECT * dpr))
      const cw = cwD / dpr
      const ch = chD / dpr

      // The plate the print and the picture share. The whole sheet, with a
      // whole number of cells centred on it (the part cell at each edge is
      // cut by the sheet as the film is); on a phone, a band of whole rows
      // across the screen in the open paper, if there is room for one.
      const cols = Math.ceil(W / cw)
      const ox = (W - cols * cw) / 2
      let rows = Math.ceil(H / ch)
      let oy = (H - rows * ch) / 2
      let plate = { x: 0, y: 0, w: W, h: H, focus: 0.5 }
      if (phone) {
        const fit = Math.floor(Math.min(bottom - top, W * PLATE_MAX) / ch)
        if (fit * ch >= W * 0.5) {
          rows = fit
          oy = Math.round(((top + bottom - rows * ch) / 2) * dpr) / dpr
          plate = { x: 0, y: oy, w: W, h: rows * ch, focus: PHONE_FOCUS }
        }
      }
      const sheet = plate.h === H

      canvas.width = cols * cwD
      canvas.height = rows * chD
      canvas.style.left = `${ox}px`
      canvas.style.top = `${oy}px`
      canvas.style.width = `${cols * cw}px`
      canvas.style.height = `${rows * ch}px`
      buildAtlas(cwD, chD)
      mid.width = cols * 2
      mid.height = rows * 2
      midCtx.imageSmoothingQuality = 'high'
      tiny.width = cols
      tiny.height = rows

      const style = stage.style
      style.setProperty('--pl-t', `${plate.y}px`)
      style.setProperty('--pl-l', `${plate.x}px`)
      style.setProperty('--pl-w', `${plate.w}px`)
      style.setProperty('--pl-h', `${plate.h}px`)
      style.setProperty('--pl-x', `${plate.focus * 100}%`)

      const n = cols * rows
      const chance = new Float32Array(n)
      const rate = new Float32Array(n)
      const phase = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        chance[i] = Math.random()
        // Each cell churns at its own pace, so the noise never ticks in step.
        rate[i] = 4 + Math.random() * 8
        phase[i] = Math.random() * 16
      }
      grid = {
        cols, rows, cw, ch, cwD, chD, ox, oy, plate, chance, rate, phase,
        held: new Float32Array(n).fill(-1),
        shown: new Int16Array(n).fill(-1),
      }
      pixels = null
      sampledAt = NaN

      // The frame hangs from the page margin, on the axis the caption and the
      // transport share, and is centred in the paper between them (in the
      // plate, on a phone). On a short screen (a 768px laptop) it gives up
      // height rather than cut into the type.
      let fw = phone ? W - 2 * margin : clamp(W * 0.36, 320, 720)
      let fh = (fw * 9) / 16
      const lo = sheet ? top : plate.y
      const hi = sheet ? bottom : plate.y + plate.h
      if (hi - lo < fh) {
        fh = Math.max(120, hi - lo)
        if (!phone) fw = (fh * 16) / 9
      }
      const cy = hi > lo ? (lo + hi) / 2 : H / 2
      frame = { W, H, plate, x0: margin, x1: margin + fw, y0: cy - fh / 2, y1: cy + fh / 2 }
      apply()
    }

    // --- paint -----------------------------------------------------------------
    // Paints rows r0..r1 (the ones on screen). Returns how many cells are
    // still churning: while any are, the next frame is needed even if nothing
    // else moves.
    const paintCells = (d, t, r0, r1) => {
      const { cols, rows, cw, ch, cwD, chD, ox, oy, chance, rate, phase, held, shown } = grid
      // Cells wholly under the film or its mat cannot be seen; skip them.
      const kc0 = Math.ceil((skip.x0 - ox) / cw)
      const kc1 = Math.floor((skip.x1 - ox) / cw) - 1
      const kr0 = Math.ceil((skip.y0 - oy) / ch)
      const kr1 = Math.floor((skip.y1 - oy) / ch) - 1
      const span = LEVEL_HI - LEVEL_LO
      let churn = 0

      for (let r = r0; r <= r1; r++) {
        const inRows = skip.any && r >= kr0 && r <= kr1
        const row = r / rows
        for (let c = 0; c < cols; c++) {
          if (inRows && c >= kc0 && c <= kc1) continue
          const i = r * cols + c
          let tone = held[i]
          if (pixels) {
            const p = i * 4
            const lum = (0.2126 * pixels[p] + 0.7152 * pixels[p + 1] + 0.0722 * pixels[p + 2]) / 255
            const want = clamp((1 - lum - LEVEL_LO) / span, 0, 1)
            if (tone < 0 || Math.abs(want - tone) > HOLD) {
              tone = want
              held[i] = want
            }
          }
          if (tone < 0) continue

          let code = 0
          const turn = turnAt(row, tone, chance[i])
          if (d >= turn) {
            // Ordered dither between the two nearest ramp steps.
            const f = tone * TOP
            const base = f | 0
            code = Math.min(TOP, base + (f - base > BAYER[(r & 3) * 4 + (c & 3)] ? 1 : 0))
          } else if (d > turn - NOISE_WINDOW) {
            churn++
            const h = hash(i, Math.floor(t * rate[i] + phase[i]))
            if (tone >= BLANK_TONE || (h >>> 24) < 64) code = NOISE_BASE + (h % NOISE_COUNT)
          }

          if (code === shown[i]) continue
          shown[i] = code
          const x = c * cwD
          const y = r * chD
          ctx.clearRect(x, y, cwD, chD)
          if (code) ctx.drawImage(atlas, (code - 1) * cwD, 0, cwD, chD, x, y, cwD, chD)
        }
      }
      return churn
    }

    const filmRunning = () => !video.paused && !video.ended

    // Declared as a function so request() below can name it; it only ever
    // runs from a frame that request() asked for.
    function paint(now) {
      raf = 0
      if (!grid || covered || disposed) return
      if (now - last < PRINT_MS - 4) {
        request()
        return
      }
      last = now
      // The rows on screen. While the sheet comes up the page most of it is
      // still below the fold, and those rows wait until they are in view.
      const { rows, ch, oy } = grid
      const stageTop = stage.getBoundingClientRect().top
      const r0 = Math.max(0, Math.floor((-stageTop - oy) / ch))
      const r1 = Math.min(rows - 1, Math.floor((window.innerHeight - stageTop - oy) / ch))
      if (r1 < r0) return
      sample()
      const churn = paintCells(state.develop, now / 1000, r0, r1)
      if (churn || filmRunning()) request()
    }

    const request = () => {
      if (!raf && inView && grid && !covered && !disposed) raf = requestAnimationFrame(paint)
    }

    // --- scroll ------------------------------------------------------------------
    const gctx = gsap.context(() => {
      // The print develops while the sheet comes up the page, its front kept
      // just under the fold by the row term in turnAt, and is up just before
      // the sheet takes the screen. Scrolling back runs it backwards.
      gsap
        .timeline({
          onUpdate: request,
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: 0.6 },
        })
        .fromTo(state, { develop: 0 }, { develop: 1, duration: 0.8, ease: 'none' }, 0.05)
        .to({}, { duration: 0.15 }, 0.85)

      // Pinned (the stage is sticky). The print is the way in, not the
      // stay: the marks draw in and the slit opens as the pin begins, the
      // frame widens to the plate, the marks fold away as they leave it, and
      // the photograph holds the sheet for the last stretch of the pin.
      gsap
        .timeline({
          defaults: { ease: 'none' },
          onUpdate: () => {
            apply()
            request()
          },
          scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
        })
        .fromTo(state, { marks: 0 }, { marks: 1, duration: 0.1, ease: 'power2.out' }, 0)
        .fromTo(state, { open: 0 }, { open: 1, duration: 0.22, ease: 'power3.inOut' }, 0.03)
        .fromTo(state, { widen: 0 }, { widen: 1, duration: 0.46, ease: 'power3.inOut' }, 0.3)
        .to(state, { marks: 0, duration: 0.14, ease: 'power2.in' }, 0.62)
        .to({}, { duration: 0.24 }, 0.76)
    }, root)

    // --- caption -------------------------------------------------------------------
    // Decodes out of the print's own noise as the sheet takes the screen; the
    // red full stop lands after the last letter. Reset when the reader goes
    // back up past it, so it prints again on the way down.
    const texts = Array.from(caption.querySelectorAll('.dp-text'))
    const finals = texts.map((el) => el.textContent)
    let cancels = []
    let captionIn = false
    const reveal = () => {
      if (captionIn) return
      captionIn = true
      caption.classList.add('is-in')
      cancels = texts.map((el, k) =>
        scramble(el, {
          text: finals[k],
          duration: 0.9,
          delay: k * 0.22,
          lockWidth: true,
          onDone: k === texts.length - 1 ? () => caption.classList.add('is-set') : undefined,
        }),
      )
    }
    const conceal = () => {
      if (!captionIn) return
      captionIn = false
      cancels.forEach((cancel) => cancel())
      cancels = []
      caption.classList.remove('is-in', 'is-set')
    }
    gctx.add(() => {
      const st = ScrollTrigger.create({
        trigger: root,
        start: 'top 30%',
        end: 'max',
        onToggle: (self) => (self.isActive ? reveal() : conceal()),
      })
      if (st.isActive) reveal()
    })

    // --- lifecycle -----------------------------------------------------------------
    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) {
        request()
      } else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    viewObserver.observe(root)

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        layout()
        request()
      }, 160)
    })
    resizeObserver.observe(stage)

    // The film's first frame once it arrives, then its frames once it runs:
    // the print follows the film from here on.
    const onFilm = () => request()
    video.addEventListener('loadeddata', onFilm)
    video.addEventListener('playing', onFilm)
    video.addEventListener('seeked', onFilm)

    layout()
    // The atlas is set in the mono face: build it again once that has loaded.
    const fontReady = document.fonts?.load(`400 16px ${fontFamily}`).catch(() => null) ?? Promise.resolve()
    fontReady.then(() => {
      if (disposed) return
      layout()
      request()
    })
    poster.src = posterSrc
    poster
      .decode()
      .then(() => {
        if (disposed) return
        posterReady = true
        request()
      })
      .catch(() => {})

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      raf = 0
      clearTimeout(resizeTimer)
      viewObserver.disconnect()
      resizeObserver.disconnect()
      video.removeEventListener('loadeddata', onFilm)
      video.removeEventListener('playing', onFilm)
      video.removeEventListener('seeked', onFilm)
      cancels.forEach((cancel) => cancel())
      gctx.revert()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      canvas.style.visibility = ''
      for (const name of STAGE_VARS) stage.style.removeProperty(name)
      caption.classList.remove('is-in', 'is-set')
      root.classList.remove('is-live')
    }
  }, [])

  // --- playback and timecode -------------------------------------------------
  // Muted, and running on its own only from just before the sheet takes the
  // screen until it has gone, and only while it is in view. Not on its own at
  // all under reduced motion or a data saver: the poster stands, nothing of
  // the film is fetched, and the play button is there for anyone who wants it.
  useEffect(() => {
    const root = rootRef.current
    const video = videoRef.current
    const tc = tcRef.current
    const reel = reelRef.current
    if (!root || !video || !tc || !reel) return undefined

    const saveData = navigator.connection?.saveData === true
    const auto = !prefersReduced() && !saveData
    autoRef.current = auto
    userPausedRef.current = !auto
    video.muted = true
    video.defaultMuted = true

    let inView = false
    // Where the film never runs on its own, only the reader's play button
    // starts it, and being in view is the only other condition.
    let armed = !auto
    let vfc = 0
    let shownFrame = -1
    const show = (time) => {
      const f = Math.max(0, Math.floor(time * FILM_FPS + 1e-3))
      if (f === shownFrame) return
      shownFrame = f
      tc.textContent = timecode(f)
      reel.style.transform = `scaleX(${clamp((time - FILM_IN) / (FILM_OUT - FILM_IN), 0, 1).toFixed(4)})`
    }
    // The frame on show before anything runs: the film's first where the
    // film is about to run from it, the poster's where the poster stands.
    show(auto ? FILM_IN : POSTER_TIME)

    const play = () => {
      video.play()?.catch((error) => {
        // A browser that will not run even a muted film on its own (a phone
        // in low-power mode): the poster and the play button stand, as under
        // a data saver. Other rejections (a pause landing first) are routine.
        if (error?.name !== 'NotAllowedError' || video.played.length) return
        autoRef.current = false
        userPausedRef.current = true
        show(POSTER_TIME)
      })
    }

    const sync = () => {
      const want = armed && inView && !userPausedRef.current && !document.hidden
      if (want && video.paused) play()
      else if (!want && !video.paused) video.pause()
    }

    // The film keeps to its window: back to the skyline before the camera
    // tilts away. The element's own loop is only the backstop.
    const keepIn = (time) => {
      if (time >= FILM_OUT && !video.seeking) video.currentTime = FILM_IN
    }

    // The timecode follows the frames actually presented where the browser
    // reports them, and the coarser timeupdate where it does not.
    const frameCallbacks = typeof video.requestVideoFrameCallback === 'function'
    const onFrame = (_now, meta) => {
      show(meta.mediaTime)
      keepIn(meta.mediaTime)
      vfc = video.requestVideoFrameCallback(onFrame)
    }
    const onPlaying = () => {
      if (frameCallbacks && !vfc) vfc = video.requestVideoFrameCallback(onFrame)
    }
    const onPause = () => {
      if (vfc) video.cancelVideoFrameCallback(vfc)
      vfc = 0
      if (video.played.length) show(video.currentTime)
    }
    const onTime = () => {
      if (!video.played.length) return
      if (!frameCallbacks) show(video.currentTime)
      keepIn(video.currentTime)
    }
    video.addEventListener('playing', onPlaying)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTime)

    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      sync()
    })
    viewObserver.observe(root)
    document.addEventListener('visibilitychange', sync)

    // The cue: the film starts as the sheet is about to take the screen, a
    // moment before the slit opens on it, so the reader meets it at the
    // skyline rather than wherever it had got to while the print came up.
    const cue = auto
      ? ScrollTrigger.create({
          trigger: root,
          start: 'top 20%',
          end: 'bottom top',
          onToggle: (self) => {
            armed = self.isActive
            sync()
          },
        })
      : null
    if (cue?.isActive) armed = true

    // Fetched two screens ahead, so the print's first frame is already the
    // film's own when the sheet comes up; never fetched where the film does
    // not run on its own (the play button fetches it there).
    const near = auto
      ? new IntersectionObserver(
          ([entry], observer) => {
            if (!entry.isIntersecting) return
            video.preload = 'auto'
            observer.disconnect()
          },
          { rootMargin: '200% 0px' },
        )
      : null
    near?.observe(root)

    return () => {
      viewObserver.disconnect()
      near?.disconnect()
      cue?.kill()
      document.removeEventListener('visibilitychange', sync)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTime)
      if (vfc) video.cancelVideoFrameCallback(vfc)
      video.pause()
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      userPausedRef.current = false
      video.play()?.catch(() => {})
    } else {
      userPausedRef.current = true
      video.pause()
    }
  }

  const toggleSound = () => {
    const video = videoRef.current
    if (video) video.muted = !video.muted
  }

  return (
    <section className="dp" ref={rootRef}>
      {/* The film is the content here; the caption under it is the line it
          illustrates, so the figure is named by words already on the page. */}
      <figure className="dp-stage" ref={stageRef}>
        <canvas className="dp-ascii" ref={canvasRef} aria-hidden="true" />
        <span className="dp-mat" aria-hidden="true" />
        <div className="dp-film">
          <video
            className="dp-video"
            ref={videoRef}
            poster={posterSrc}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
          >
            <source src={filmPhone} type="video/mp4" media={`(max-width: ${PHONE}px)`} />
            {/* The full 4K plate for screens that draw the full-bleed film with more
                than 1080p's worth of pixels: high-density laptops and big
                monitors. 3MB in AV1, still lighter than the H.264 fallback. */}
            <source
              src={filmAv1Uhd}
              type='video/mp4; codecs="av01.0.12M.08, mp4a.40.2"'
              media="(min-width: 1200px) and (min-resolution: 2dppx), (min-width: 2200px)"
            />
            <source src={filmAv1} type='video/mp4; codecs="av01.0.08M.08, mp4a.40.2"' />
            <source src={filmH264} type="video/mp4" />
          </video>
        </div>
        <span className="dp-crop" aria-hidden="true">
          <i className="dp-corner dp-corner--tl" />
          <i className="dp-corner dp-corner--tr" />
          <i className="dp-corner dp-corner--bl" />
          <i className="dp-corner dp-corner--br" />
        </span>

        <figcaption className="dp-caption" ref={captionRef}>
          <span className="dp-rule" aria-hidden="true" />
          <span className="dp-line">
            <span className="dp-text">based in Kathmandu</span>
          </span>{' '}
          <span className="dp-line">
            <span className="dp-text">and working globally</span>
            <span className="dp-dot">.</span>
          </span>
        </figcaption>

        <div className="dp-transport">
          <span className="dp-tc" aria-hidden="true">
            <span ref={tcRef}>00:00:15:15</span>
            <i className="dp-reel" ref={reelRef} />
          </span>
          <button
            type="button"
            className="dp-btn"
            onClick={togglePlay}
            aria-label={playing ? 'Pause video' : 'Play video'}
          >
            {playing ? (
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M5 3v10M11 3v10" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M4.5 2.75v10.5L13 8z" fill="currentColor" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="dp-btn"
            onClick={toggleSound}
            aria-label={muted ? 'Unmute video' : 'Mute video'}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M1.5 5.75h2.75L8 2.75v10.5l-3.75-3H1.5z" fill="currentColor" />
              {muted ? (
                <path d="M10.5 5.75l4 4.5M14.5 5.75l-4 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              ) : (
                <path
                  d="M10.25 5.5a3.5 3.5 0 0 1 0 5M12.25 3.5a6.25 6.25 0 0 1 0 9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              )}
            </svg>
          </button>
        </div>
      </figure>

      {/* The hero's red overprint band, carried on down the sheet. On the
          section rather than the pinned stage, so it is unbroken however the
          stage sits. */}
      <span className="dp-band" aria-hidden="true" />
    </section>
  )
}
