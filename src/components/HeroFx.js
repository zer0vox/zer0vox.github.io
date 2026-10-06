import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GLYPHS, scramble } from '../lib/textFx.js'
import './HeroFx.css'

// Load and scroll effects for the home hero, attached to the <header> the ref
// points at.
//
// The sheet arrives printed and leaves un-printing. On load the name is thrown
// up from its masks (index.css) and the slogan decodes out of glyph noise under
// a rule laid in from the left. On the way out the name drifts up ahead of the
// page while its butter and red plates come apart -- the inverse of the lock
// the statement in the marine spread below prints in with, so the two sheets
// hand over in one vocabulary -- and each line's ink lifts off just before it
// would slide under the bare masthead. The slogan goes first, its rule pulled
// away to the right; the two prints separate in depth. The red band does not
// move: it runs on down the page at the same x.
//
// Scrubbed, so it all reverses. Reduced motion gets the printed sheet.

// Seconds after mount. The name's last line is thrown up from 0.5s on a curve
// that is nearly home by 1.2s, and the stop stamps at 1.5s: the rule is laid
// just before the line lands, and the slogan resolves under it.
const RULE_AT = 1.15
const DECODE_AT = 1.3

// How far each line drifts up past the page over the hero's scroll, as a
// percentage of its mask. The mask is exactly 1em tall (0.86 leading plus the
// 0.14em descender padding), so these are fractions of the type size. Lower
// lines go faster, by less than the ~0.15em of air between one line's
// baseline and the next one's ascenders, so they close up without touching
// while they are on screen. Smaller on phones, where the art sits just above.
const DRIFT = [40, 60, 80]
const DRIFT_SMALL = [28, 38, 48]

// Where a line's ink lifts off: from its top being this many line heights
// below the masthead's bottom edge, to this many inside it. The masthead is
// bare over the hero, so a line that kept its ink would run through the nav
// labels on its way out.
const LIFT_FROM = 0.9
const LIFT_TO = -0.3

const SMALL = '(max-width: 810px)'

// A layout offset from el's top to root's, summed through the offsetParent
// chain. Layout, not getBoundingClientRect, so the drift the timeline has
// already applied to the lines never skews the measurement.
function topWithin(el, root) {
  let y = 0
  for (let node = el; node && node !== root; node = node.offsetParent) y += node.offsetTop
  return y
}

export function useHeroFx(heroRef) {
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const title = hero.querySelector('#heroTitle')
    const sub = hero.querySelector('.hero-sub')
    const subText = hero.querySelector('.hfx-sub-text')
    const rule = hero.querySelector('.hfx-rule')
    const ruleInk = hero.querySelector('.hfx-rule-ink')
    if (!title || !sub || !subText || !rule || !ruleInk) return undefined
    const lines = gsap.utils.toArray('.line', title)
    const butter = hero.querySelector('.hero-butter')
    const print = hero.querySelector('.hero-print')

    gsap.registerPlugin(ScrollTrigger)
    hero.classList.add('hfx-live')
    subText.classList.add('hfx-pending')

    const small = () => window.matchMedia(SMALL).matches
    const drift = () => (small() ? DRIFT_SMALL : DRIFT)
    const em = () => parseFloat(getComputedStyle(title).fontSize)

    // The decode. While noise of a different width churns through the slogan
    // its box is held at the printed size: the rule spans that box, and the
    // copy is anchored at the bottom, so a wider line -- or a wrapped one --
    // would stretch the rule or lift the whole name. The height matters as
    // much as the width: scramble() empties the text for the frame before its
    // first glyphs, and an empty box would drop the name by a line for a frame.
    let cancelDecode = null
    const release = () => {
      cancelDecode = null
      sub.style.width = ''
      sub.style.height = ''
      subText.style.whiteSpace = ''
    }
    const decode = () => {
      if (subText.getClientRects().length === 1) subText.style.whiteSpace = 'nowrap'
      const box = sub.getBoundingClientRect()
      sub.style.width = `${box.width}px`
      sub.style.height = `${box.height}px`
      subText.classList.remove('hfx-pending')
      cancelDecode = scramble(subText, {
        duration: 0.85,
        delay: 0.1,
        order: 'ltr',
        spread: 0.3,
        chars: GLYPHS.ascii,
        onDone: release,
      })
    }

    // The scroll position at which line i's top -- its drift included --
    // reaches k line heights below the masthead. Solved from layout on every
    // refresh, so it holds at any viewport and type size.
    const liftAt = (i, k) => {
      const line = lines[i]
      const nav = document.querySelector('nav.top')
      const span = hero.offsetHeight
      const travel = (drift()[i] / 100) * line.offsetHeight
      const lineHeight = parseFloat(getComputedStyle(title).lineHeight)
      const p = (topWithin(line, hero) - (nav?.offsetHeight ?? 64) - k * lineHeight) / (span + travel)
      return { top: hero.getBoundingClientRect().top + window.scrollY, p, span }
    }
    const liftRange = (i) => {
      const from = liftAt(i, LIFT_FROM)
      const to = liftAt(i, LIFT_TO)
      // A line already that close to the masthead at rest (a short landscape
      // window) still starts printed: the lift begins at the first scroll.
      const a = Math.max(0, from.p)
      const b = Math.max(a + 0.08, to.p)
      return { start: from.top + a * from.span, end: from.top + b * from.span }
    }

    const ctx = gsap.context(() => {
      // Load: the rule is laid, then the slogan resolves along it.
      gsap.fromTo(ruleInk, { scaleX: 0 }, { scaleX: 1, duration: 0.95, ease: 'expo.out', delay: RULE_AT })
      gsap.delayedCall(DECODE_AT, decode)

      // Scroll away, over the hero's own height. Timeline time is progress
      // through it: 0 printed, 1 the hero's bottom edge at the top.
      const tl = gsap.timeline({
        defaults: { ease: 'none', duration: 1 },
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })

      lines.forEach((line, i) => {
        tl.fromTo(line, { yPercent: 0 }, { yPercent: () => -drift()[i] }, 0)
      })

      // The plates part from the bottom line up, the way the drift runs, so
      // the looseness gathers toward the marine sheet coming up underneath.
      tl.fromTo(
        lines,
        { '--hfx-mis': 0 },
        { '--hfx-mis': 1, duration: 0.6, stagger: { each: 0.06, from: 'end' } },
        0
      )

      // The quiet voice leaves first, a little quicker than the name, and its
      // rule is drawn back toward the right ahead of it. Eased in, so the rule
      // gathers speed and is gone, rather than lingering as a short dash over
      // the end of the line.
      tl.fromTo(sub, { y: 0, opacity: 1 }, { y: () => -em() * 0.5, opacity: 0, duration: 0.42, ease: 'power1.in' }, 0.04)
      tl.fromTo(rule, { scaleX: 1 }, { scaleX: 0, duration: 0.34, ease: 'power2.in' }, 0.02)

      // Depth: the butter shape lags the page, the relief runs ahead of it and
      // comes up a little toward the reader. The band, on the sheet itself,
      // stays where it is.
      if (butter) {
        tl.fromTo(butter, { y: 0 }, { y: () => hero.offsetHeight * (small() ? 0.04 : 0.16) }, 0)
      }
      if (print) {
        tl.fromTo(
          print,
          { y: 0, scale: 1 },
          {
            y: () => -hero.offsetHeight * (small() ? 0.05 : 0.1),
            scale: () => (small() ? 1.03 : 1.06),
          },
          0
        )
      }

      // Ink lifting off under the masthead, scrubbed per line on the same
      // smoothing as the drift it has to agree with. HeroFx.css turns the one
      // value into the sequence: the key drains, the plates hold a moment on
      // their own, then they go too.
      lines.forEach((line, i) => {
        gsap.fromTo(line, { '--hfx-lift': 0 }, {
          '--hfx-lift': 1,
          ease: 'none',
          scrollTrigger: {
            start: () => liftRange(i).start,
            end: () => liftRange(i).end,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
      })
    }, hero)

    // Open the masks once the last line has landed. The timer is the fallback
    // for an entrance that never ran its course.
    const lastInner = lines[lines.length - 1]?.querySelector('.inner')
    const settle = () => hero.classList.add('hfx-settled')
    const onLanded = (event) => {
      if (event.target === lastInner) settle()
    }
    lastInner?.addEventListener('animationend', onLanded)
    ctx.add(() => gsap.delayedCall(2.6, settle))

    // The lift points are measured off the set type; re-measure once it is in.
    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh()
    })

    return () => {
      cancelled = true
      cancelDecode?.()
      release()
      ctx.revert()
      lastInner?.removeEventListener('animationend', onLanded)
      hero.classList.remove('hfx-live', 'hfx-settled')
      subText.classList.remove('hfx-pending')
    }
  }, [heroRef])
}
