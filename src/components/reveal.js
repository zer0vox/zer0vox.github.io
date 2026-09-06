import { useEffect } from 'react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

// The site used framer-motion for exactly four things: two in-view reveals on
// the home page, the nav's entrance, and the ogl canvas fading up. That is
// 39 kB gzip of library on every route to do what GSAP — already imported by
// six modules here — does natively. These two hooks are that replacement.
//
// The eases are the original cubic-beziers, not lookalikes: CustomEase takes a
// bezier as an SVG path, so `cubic-bezier(x1,y1,x2,y2)` is 'M0,0 Cx1,y1 x2,y2 1,1'
// and the motion is identical rather than merely similar.
gsap.registerPlugin(CustomEase)

// framer-motion's `ease: 'easeOut'` is cubic-bezier(0, 0, 0.58, 1).
export const EASE_OUT = CustomEase.create('ghbEaseOut', 'M0,0 C0,0 0.58,1 1,1')
// The panel/number reveal's hand-tuned [0.22, 0.7, 0.18, 1].
export const EASE_PANEL = CustomEase.create('ghbPanel', 'M0,0 C0.22,0.7 0.18,1 1,1')

// Reveals honour the OS "reduce motion" setting by landing on the finished
// state immediately. framer-motion did not do this on its own, so this is a
// small behavioural gain that comes with the swap rather than a cost of it.
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Only name the axes that actually move. Handing GSAP `x: 0, y: 0` would write
// a `transform: translate(0px, 0px)` onto an element that had no transform at
// all, and a transform makes the element a containing block and a stacking
// context — enough to move a fixed-position child or reorder a z-index. The
// fade-only callers here (the ogl canvas) must stay untransformed.
const axes = (x, y, at) => {
  const out = { opacity: at }
  if (x) out.x = at ? 0 : x
  if (y) out.y = at ? 0 : y
  return out
}

// Replaces `initial` + `animate`: plays once as soon as the element mounts.
export function useRevealOnMount(ref, { x = 0, y = 0, duration = 0.6, delay = 0, ease = EASE_OUT } = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    if (prefersReducedMotion()) {
      gsap.set(el, axes(x, y, 1))
      return undefined
    }

    const tween = gsap.fromTo(el, axes(x, y, 0), {
      ...axes(x, y, 1),
      duration,
      delay,
      ease,
    })
    return () => tween.kill()
  }, [ref, x, y, duration, delay, ease])
}

// Replaces `initial` + `whileInView` + `viewport={{ once: true, amount }}`.
// `amount` is the fraction of the element that must be visible, which maps
// directly onto an IntersectionObserver threshold.
export function useRevealInView(
  ref,
  { x = 0, y = 0, duration = 0.7, delay = 0, ease = EASE_OUT, amount = 0.5 } = {}
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    if (prefersReducedMotion()) {
      gsap.set(el, axes(x, y, 1))
      return undefined
    }

    // Set the "before" state synchronously in the same commit that the element
    // is inserted, so it never paints at full opacity for one frame first.
    gsap.set(el, axes(x, y, 0))

    let tween
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        // `once: true` — stop observing before animating, so a scroll that
        // re-crosses the threshold cannot restart it.
        observer.disconnect()
        tween = gsap.to(el, { ...axes(x, y, 1), duration, delay, ease })
      },
      // An element taller than the viewport can never reach a 0.5 ratio, which
      // would leave it invisible forever. Falling back to a sliver threshold
      // for those keeps the reveal reachable.
      { threshold: el.offsetHeight > window.innerHeight ? 0.01 : amount }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      tween?.kill()
    }
  }, [ref, x, y, duration, delay, ease, amount])
}
