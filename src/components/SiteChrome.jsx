import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useRevealOnMount } from './reveal.js'
import { getLenis } from '../lib/lenis.js'
import { SocialTextLinks } from './social.jsx'
import { Link, useLocation } from 'react-router-dom'

// Every route opens on a full-bleed hero, and each names it differently: the
// home header, the philosophy hero, the about parallax stage.
const HERO_SELECTOR = '.hero, .ph-hero, .hero-wrap'

// The nav sits transparent over the hero and turns to glass once the hero has
// scrolled out from under it. Measured off the live hero rather than a magic
// scroll offset so it stays right across the three heroes' different heights,
// and off `bottom <= nav height` so the material appears exactly as page
// content starts passing beneath the bar. Nav padding deliberately doesn't
// change with the state: a bar that resized would move its own threshold.
function useScrolledPastHero(navRef) {
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const hero = document.querySelector(HERO_SELECTOR)
      const navHeight = navRef.current?.offsetHeight ?? 0
      // The home hero is a printed sheet whose relief and band run right up
      // under the labels, which are only legible on it at rest. There the
      // paper strip comes in with the first scroll instead of once the hero
      // has gone.
      const printed = hero?.classList.contains('hero--print')

      setPastHero(
        printed
          ? window.scrollY > 16
          : hero
            ? hero.getBoundingClientRect().bottom <= navHeight
            : window.scrollY > navHeight
      )
    }

    // Lenis drives the real window scroll, so the native event is enough.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [navRef])

  return pastHero
}

// Sends both the viewport and the focus ring to the page content.
function skipToContent(event) {
  const main = document.getElementById('main')
  if (!main) return

  event.preventDefault()
  // tabIndex is set here rather than in the markup so `main` never becomes a
  // stop in the normal tab order — it only has to be focusable on demand.
  main.setAttribute('tabindex', '-1')
  main.focus({ preventScroll: true })

  const lenis = getLenis()
  if (lenis) lenis.scrollTo(main)
  else main.scrollIntoView()
}

// The nav's Home item points at the home hero, which the router alone cannot
// always deliver: if the location is already `/#top`, clicking it changes
// neither pathname nor hash, so App's navigation effect never re-runs and the
// click does nothing. Handled here for the same-page case only — from another
// route the Link navigates normally and App lands the new page at the top.
//
// Deliberately a glide rather than the instant jump App uses for `#top`. That
// jump is right when you are arriving on a fresh route; scrolling the page you
// are already reading should move, so you can see where you were taken.
function scrollHomeToTop(pathname) {
  return (event) => {
    if (pathname !== '/') return

    const lenis = getLenis()
    if (!lenis) return // Reduced motion: let the browser do its normal thing.

    event.preventDefault()
    lenis.scrollTo(0)
  }
}

// Every link that means "the top of the home page" goes through this: the
// brand, the nav item and the footer's Sitemap entry. Keeping them one
// component is the point — the footer's copy is exactly the one that was left
// behind pointing at #work when the nav item was renamed, because there was
// nothing tying them together.
export function HomeLink({ className, markCurrent = false, children }) {
  const { pathname } = useLocation()
  const current = markCurrent && pathname === '/'

  return (
    <Link
      to="/#top"
      className={[className, current ? 'is-current' : null].filter(Boolean).join(' ') || undefined}
      aria-current={current ? 'page' : undefined}
      onClick={scrollHomeToTop(pathname)}
    >
      {children}
    </Link>
  )
}

// The nav's links, written once. They were previously typed out twice — once
// for the bar and again for the mobile panel — which is the arrangement that
// let the two drift apart in the first place. One list, one source of truth;
// the two presentations are a CSS concern, below.
//
// `home: true` marks the entry that has to go through HomeLink, which handles
// the same-page case the router cannot see. Only entries that are routes of
// their own can be the current page; /#contact is a section of the home page.
const NAV_LINKS = [
  { to: '/#top', label: 'Home', home: true, route: '/' },
  { to: '/philosophy', label: 'Philosophy', route: '/philosophy' },
  { to: '/about', label: 'About', route: '/about' }
]

const CONTACT_LINK = { to: '/#contact', label: 'Contact' }

// The bar carries ONE highlight that travels between links, rather than a pill
// per link that fades in wherever the pointer lands. That is the difference
// between a hover state and the way an Apple bar moves: going from Philosophy
// to About is a single object sliding across, so the eye follows it instead of
// watching one thing vanish and another appear somewhere else.
//
// This only measures. The link that should be lit is published to CSS as
// --pill-x/y/w/h on .inner, and the stylesheet decides how much larger than the
// label the glass sits and does all of the animating — geometry here, design
// there.
//
// Written straight to the DOM rather than held in React state on purpose: it
// runs on every pointerover across the bar, and re-rendering the whole nav to
// move a decoration would be work for nothing.
const PILL_LINKS = '.nav-links a, .nav-actions a'

function useNavPill(innerRef, enabled) {
  useEffect(() => {
    const inner = innerRef.current
    if (!inner || !enabled) return undefined

    // Pointer and keyboard are tracked apart so the two cannot erase each
    // other: tabbing away while the pointer still rests on a link should hand
    // the highlight back to the pointer, not switch it off.
    let hovered = null
    let focused = null
    let lit = null

    const linkFor = (node) => (node instanceof Element ? node.closest(PILL_LINKS) : null)

    // `animate: false` snaps — the geometry is written, the browser is forced
    // to take it, and only then are transitions allowed back. Without that the
    // highlight streaks in across the bar from the last link it sat on instead
    // of simply appearing at the one under the pointer.
    const place = (link, animate) => {
      if (!animate) inner.setAttribute('data-pill', 'placing')

      const host = inner.getBoundingClientRect()
      const box = link.getBoundingClientRect()
      inner.style.setProperty('--pill-x', `${box.left - host.left}px`)
      inner.style.setProperty('--pill-y', `${box.top - host.top}px`)
      inner.style.setProperty('--pill-w', `${box.width}px`)
      inner.style.setProperty('--pill-h', `${box.height}px`)

      // Reading a layout property is what commits the placement above before
      // the next line lets the transitions run again.
      if (!animate) void inner.offsetWidth
      inner.setAttribute('data-pill', 'on')
    }

    const render = () => {
      const next = focused ?? hovered
      if (next === lit) return

      if (!next) {
        lit = null
        inner.removeAttribute('data-pill')
        return
      }

      place(next, lit !== null)
      lit = next
    }

    // pointerover rather than pointerenter, because it bubbles: one listener
    // covers every link and also fires for the wordmark and the gaps between
    // them, which is what puts the highlight out when the pointer is over
    // neither. A touch pointer is ignored outright — a tap is not a hover, and
    // a highlight left stranded on the link you just tapped is the usual way
    // this effect goes wrong on phones.
    const onPointerOver = (event) => {
      if (event.pointerType === 'touch') return
      hovered = linkFor(event.target)
      render()
    }

    const onPointerLeave = () => {
      hovered = null
      render()
    }

    // :focus-visible, not :focus — a click focuses the link too, and without
    // this the highlight would stay pinned to it after the pointer had gone.
    const onFocusIn = (event) => {
      const link = linkFor(event.target)
      focused = link?.matches(':focus-visible') ? link : null
      render()
    }

    const onFocusOut = () => {
      focused = null
      render()
    }

    const onResize = () => {
      if (lit) place(lit, false)
    }

    inner.addEventListener('pointerover', onPointerOver)
    inner.addEventListener('pointerleave', onPointerLeave)
    inner.addEventListener('focusin', onFocusIn)
    inner.addEventListener('focusout', onFocusOut)
    window.addEventListener('resize', onResize)

    return () => {
      inner.removeEventListener('pointerover', onPointerOver)
      inner.removeEventListener('pointerleave', onPointerLeave)
      inner.removeEventListener('focusin', onFocusIn)
      inner.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('resize', onResize)
      inner.removeAttribute('data-pill')
    }
  }, [innerRef, enabled])
}

// Whether the bar is in its compact arrangement. This is the ONE place the
// 810px breakpoint is read in JS, and it is kept in step with the media query
// in index.css by name: below it the links live in a sheet that has to be
// opened, which changes what the menu button, the focus trap and `inert` are
// allowed to do. Everything else about the two layouts is CSS.
const COMPACT_QUERY = '(max-width: 810px)'

function useIsCompact() {
  // Initialised from the media query rather than from `false` so the first
  // paint is already correct on a phone — starting wide and correcting on
  // mount would flash the desktop bar.
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(COMPACT_QUERY).matches
  )

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY)
    const onChange = (event) => setCompact(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return compact
}

// Everything the open sheet has to do beyond looking open: hold focus, take
// Escape, and stop the page moving underneath it.
function useMenuBehaviour({ open, close, compact, sheetRef, toggleRef }) {
  // Escape, and a focus trap. Both are listeners rather than state so opening
  // the menu does not re-render the nav on every Tab.
  useEffect(() => {
    if (!open || !compact) return undefined

    const sheet = sheetRef.current
    if (!sheet) return undefined

    const focusables = () =>
      Array.from(sheet.querySelectorAll('a[href], button:not([disabled])')).filter(
        (el) => el.offsetParent !== null
      )

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        // Focus goes back to the control that opened the sheet, not to the top
        // of the document — otherwise Escape costs a keyboard user their place.
        toggleRef.current?.focus()
        return
      }

      if (event.key !== 'Tab') return

      const items = focusables()
      if (!items.length) return

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      // The sheet covers the page, so Tab must not walk out of it into content
      // the reader cannot see.
      if (event.shiftKey && (active === first || !sheet.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, compact, close, sheetRef, toggleRef])

  // Scroll lock. Lenis animates the scroll position itself, so `overflow:
  // hidden` on the body is not enough on its own — it has to be told to stop,
  // or a flick over the sheet still drags the page behind it.
  useEffect(() => {
    if (!open || !compact) return undefined

    const lenis = getLenis()
    lenis?.stop()

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      lenis?.start()
      document.body.style.overflow = previous
    }
  }, [open, compact])
}

// Nav and footer are shared by every route, so the section links are written as
// absolute `/#id` targets rather than bare anchors: App scrolls to the section
// after the route lands, which keeps them working from a sub-page too.
export function SiteNav() {
  const { pathname } = useLocation()
  const navRef = useRef(null)
  const innerRef = useRef(null)
  const sheetRef = useRef(null)
  const toggleRef = useRef(null)
  const [menuRequested, setMenuRequested] = useState(false)
  const compact = useIsCompact()
  const pastHero = useScrolledPastHero(navRef)

  // Derived, not stored: the sheet only exists in the compact layout, so
  // widening the window past the breakpoint closes it by construction rather
  // than by an effect racing the resize.
  const menuOpen = menuRequested && compact

  useRevealOnMount(navRef, { y: -16, duration: 0.6, delay: 0.1 })
  // The travelling highlight is a pointer affordance, so it is not built at all
  // in the compact layout — there is no hover there, and the sheet's rows have
  // their own pressed state.
  useNavPill(innerRef, !compact)

  const closeMenu = useCallback(() => setMenuRequested(false), [])

  useMenuBehaviour({ open: menuOpen, close: closeMenu, compact, sheetRef, toggleRef })

  // A route change means the sheet has done its job. Adjusted during render
  // rather than in an effect -- React re-runs this component immediately with
  // the corrected state and never commits the stale open sheet, where an effect
  // would paint it open for a frame first.
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setMenuRequested(false)
  }

  const renderLink = ({ to, label, home, route }) => {
    const current = route && pathname === route
    const shared = {
      className: current ? 'is-current' : undefined,
      'aria-current': current ? 'page' : undefined,
      onClick: closeMenu
    }

    return (
      <li key={label}>
        {home ? (
          <HomeLink className="nav-link" markCurrent>{label}</HomeLink>
        ) : (
          <Link to={to} {...shared}>{label}</Link>
        )}
      </li>
    )
  }

  return (
    <>
      {/* First thing in the tab order on every route. Without it a keyboard or
          screen-reader visitor has to walk the whole nav before reaching the
          page itself, on every navigation. Invisible until it takes focus.

          The jump is handled here rather than left to the browser: Lenis owns
          the scroll position, and a native fragment jump sets scrollTop behind
          its back, which it then animates away from. Moving focus explicitly
          also covers the browsers that scroll to a fragment without focusing
          it — the failure mode where the page moves but the next Tab press
          lands back at the top of the nav. */}
      <a className="skip-link" href="#main" onClick={skipToContent}>Skip to content</a>
      <nav
        className={[pastHero ? 'top is-glass' : 'top', menuOpen ? 'is-open' : null]
          .filter(Boolean)
          .join(' ')}
        id="nav"
        ref={navRef}
      >
        <div className="inner" ref={innerRef}>
          {/* The travelling glass highlight. Decorative and measured, never
              read: it says nothing a link does not already say. */}
          <span className="nav-pill" aria-hidden="true" />

          <HomeLink className="brand">greenhueblues</HomeLink>

          {/* One wrapper, two presentations. On the desktop bar it is
              `display: contents`, so the list and the actions fall straight
              into .inner's grid columns exactly as if it were not here; in the
              compact layout it becomes the sheet. That is what lets the links
              be written once instead of once per breakpoint. */}
          <div
            className="nav-sheet"
            id="primary-nav"
            ref={sheetRef}
            inert={compact && !menuOpen}
          >
            <ul className="nav-links">{NAV_LINKS.map(renderLink)}</ul>
            <div className="nav-actions">
              <Link to={CONTACT_LINK.to} onClick={closeMenu}>{CONTACT_LINK.label}</Link>
            </div>
          </div>

          {/* Rendered on every width and hidden with `display: none` above the
              breakpoint, which takes it out of the accessibility tree there
              too — a menu button that does nothing should not be announced. */}
          <button
            type="button"
            className="nav-toggle"
            ref={toggleRef}
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuRequested((open) => !open)}
          >
            <span className="nav-toggle-bars" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </nav>

      {/* Catches the tap that means "not this" — outside the sheet but not on a
          link. Only rendered while open, so it can never sit over the page and
          swallow clicks. */}
      {compact && menuOpen ? (
        <button
          type="button"
          className="nav-scrim"
          tabIndex={-1}
          aria-hidden="true"
          onClick={closeMenu}
        />
      ) : null}
    </>
  )
}

export function SiteFooter() {
  const wordRef = useRef(null)

  useEffect(() => {
    if (!wordRef.current) return

    gsap.fromTo(
      wordRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.25 }
    )
  }, [])

  return (
    <footer>
      <div className="ftr-inner">
        <div className="cols">
          <div className="col">
            <div className="h">Sitemap</div>
            <HomeLink>Home</HomeLink>
          </div>
          <div className="col">
            <div className="h">Practice</div>
            <Link to="/philosophy">Philosophy</Link>
            <Link to="/about">About</Link>
            <Link to="/#contact">Contact</Link>
          </div>
          <div className="col">
            <div className="h">Social</div>
            <SocialTextLinks />
          </div>
        </div>
        <div className="word" ref={wordRef}>greenhueblues</div>
        <div className="baseline">
          <div />
          <div>Copyright 2026. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}
