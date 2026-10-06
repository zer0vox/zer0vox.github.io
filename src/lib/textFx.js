// Text effects shared by the home page components. Kept dependency-free (no
// GSAP) so it can run from an effect, a ScrollTrigger callback or a pointer
// handler alike.
//
// scramble() is the "decode" effect: an element's text is shown as cycling
// ASCII glyphs that resolve, character by character, into the real text.
//
//  * Only for elements whose content is plain text -- it rewrites textContent,
//    so child elements inside the target are lost. Put the effect on the inner
//    text node's own <span> if the element has decoration around it.
//  * Assistive technology never sees the noise: while it runs, the glyphs sit
//    in an aria-hidden span next to a visually hidden copy of the real text,
//    and the element is restored to plain text when it finishes (or is
//    cancelled).
//  * Spaces and punctuation in `preserve` are never scrambled, so word shapes
//    and line breaks hold still while the letters churn.
//  * prefers-reduced-motion: the final text is set at once.

export const GLYPHS = {
  ascii: '#%&*+=-:;/\\|<>[]{}()?!$@0123456789',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=',
  blocks: '░▒▓█▞▚▖▗▘▝',
  binary: '01',
  dots: '·:.˙•',
}

const DEFAULT_PRESERVE = /[\s.,’'"→↗↘←↑↓()[\]/—–\-:;!?&@]/

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Visually hidden but read by screen readers (same recipe as .sr-only).
const SR_STYLE =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;' +
  'clip:rect(0 0 0 0);white-space:nowrap;border:0'

// One live animation per element: starting a new one cancels the old.
const running = new WeakMap()

/**
 * Decode `el`'s text out of glyph noise.
 *
 * @param {HTMLElement} el
 * @param {object} [opts]
 * @param {string} [opts.text]        final text (default: el's current text)
 * @param {number} [opts.duration]    seconds until the last character lands (0.8)
 * @param {number} [opts.delay]       seconds before anything resolves (0)
 * @param {string} [opts.chars]       glyph pool (GLYPHS.ascii)
 * @param {'ltr'|'rtl'|'center'|'random'} [opts.order]  resolve order ('ltr')
 * @param {number} [opts.spread]      0-1, how much per-character randomness is
 *                                    mixed into the order (0.35)
 * @param {number} [opts.fps]         glyph change rate (24)
 * @param {RegExp} [opts.preserve]    characters never scrambled
 * @param {boolean} [opts.lockWidth]  hold the element's width while it runs, so
 *                                    proportional glyphs do not jiggle layout
 * @param {() => void} [opts.onDone]
 * @returns {() => void} cancel -- jumps straight to the final text
 */
export function scramble(el, opts = {}) {
  if (!el) return () => {}
  running.get(el)?.()

  const {
    text = el.textContent ?? '',
    duration = 0.8,
    delay = 0,
    chars = GLYPHS.ascii,
    order = 'ltr',
    spread = 0.35,
    fps = 24,
    preserve = DEFAULT_PRESERVE,
    lockWidth = false,
    onDone,
  } = opts

  if (reducedMotion() || duration <= 0) {
    el.textContent = text
    onDone?.()
    return () => {}
  }

  let prevMinWidth = ''
  let prevDisplay = ''
  const finish = () => {
    el.textContent = text
    if (lockWidth) {
      el.style.minWidth = prevMinWidth
      el.style.display = prevDisplay
    }
    running.delete(el)
  }

  if (lockWidth) {
    prevMinWidth = el.style.minWidth
    prevDisplay = el.style.display
    const width = el.getBoundingClientRect().width
    if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block'
    el.style.minWidth = `${Math.ceil(width)}px`
  }

  // Per-character landing times, in seconds from start.
  const n = text.length
  const lands = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let t
    if (order === 'rtl') t = (n - 1 - i) / Math.max(1, n - 1)
    else if (order === 'center') t = Math.abs(i - (n - 1) / 2) / Math.max(1, (n - 1) / 2)
    else if (order === 'random') t = Math.random()
    else t = i / Math.max(1, n - 1)
    lands[i] = delay + duration * ((1 - spread) * t + spread * Math.random())
  }

  const visible = document.createElement('span')
  visible.setAttribute('aria-hidden', 'true')
  const hidden = document.createElement('span')
  hidden.setAttribute('style', SR_STYLE)
  hidden.textContent = text
  el.textContent = ''
  el.append(visible, hidden)

  const pick = () => chars[(Math.random() * chars.length) | 0]
  const noise = Array.from(text, (c) => (preserve.test(c) ? c : pick()))

  let raf = 0
  let lastSwap = -1
  const start = performance.now()
  const frameMs = 1000 / fps

  const tick = (now) => {
    const t = (now - start) / 1000
    const swap = Math.floor((now - start) / frameMs)
    let out = ''
    let done = true
    for (let i = 0; i < n; i++) {
      const c = text[i]
      if (t >= lands[i] || preserve.test(c)) {
        out += c
      } else {
        done = false
        if (swap !== lastSwap) noise[i] = pick()
        out += noise[i]
      }
    }
    lastSwap = swap
    visible.textContent = out
    if (done) {
      finish()
      onDone?.()
      return
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  const cancel = () => {
    cancelAnimationFrame(raf)
    finish()
  }
  running.set(el, cancel)
  return cancel
}

/**
 * Re-decode an element's own text whenever it is hovered or focused.
 * Returns an unbind function. The text is read once, at bind time.
 */
export function bindHoverScramble(el, opts = {}) {
  if (!el) return () => {}
  const text = opts.text ?? el.textContent ?? ''
  let cancel = null
  const run = () => {
    cancel?.()
    cancel = scramble(el, { duration: 0.42, spread: 0.5, lockWidth: true, ...opts, text })
  }
  el.addEventListener('pointerenter', run)
  el.addEventListener('focus', run)
  return () => {
    el.removeEventListener('pointerenter', run)
    el.removeEventListener('focus', run)
    cancel?.()
  }
}
