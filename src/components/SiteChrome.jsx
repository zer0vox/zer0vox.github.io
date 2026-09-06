import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useRevealOnMount } from './reveal.js'
import { getLenis } from '../lib/lenis.js'
import { Link, useLocation } from 'react-router-dom'

// Every route opens on a full-bleed hero, and each names it differently: the
// home header, the philosophy hero, the about parallax stage.
const HERO_SELECTOR = '.hero, .ph-hero, .hero-wrap'

// Listed once and rendered in both the nav and the footer, which is where the
// two copies previously drifted: all six were left as href="#", so every one of
// them silently scrolled the reader back to the top instead of going anywhere.
//
// `label` is what the design shows; `name` is what a screen reader announces,
// because a link whose entire accessible name is "X" says nothing on its own.
const SOCIAL_LINKS = [
  { label: 'X', name: 'greenhueblues on X', href: 'https://x.com/sumip780' },
  { label: 'Instagram', name: 'greenhueblues on Instagram', href: 'https://www.instagram.com/mipxyz____/' },
  { label: 'LinkedIn', name: 'Sumip Chaudhary on LinkedIn', href: 'https://www.linkedin.com/in/sumip-chaudhary/' }
]

// rel="me" states that the profile at the other end belongs to the same person
// as this site — the convention identity consumers read to confirm the link is
// reciprocal. noopener/noreferrer are the usual hardening for target="_blank":
// without noopener the opened page gets a handle on this window.
function SocialLinks() {
  return SOCIAL_LINKS.map(({ label, name, href }) => (
    <a
      key={label}
      href={href}
      aria-label={name}
      target="_blank"
      rel="me noopener noreferrer"
    >
      {label}
    </a>
  ))
}

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

      setPastHero(
        hero
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
function HomeLink({ className, markCurrent = false, children }) {
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

// Nav and footer are shared by every route, so the section links are written as
// absolute `/#id` targets rather than bare anchors: App scrolls to the section
// after the route lands, which keeps them working from a sub-page too.
export function SiteNav() {
  const { pathname } = useLocation()
  const navRef = useRef(null)
  const pastHero = useScrolledPastHero(navRef)
  useRevealOnMount(navRef, { y: -16, duration: 0.6, delay: 0.1 })
  // Only the items that are pages of their own can be the current one; the rest
  // are sections of the home page.
  const onPhilosophy = pathname === '/philosophy'
  const onAbout = pathname === '/about'

  return (
    <>
      {/* First thing in the tab order on every route. Without it a keyboard or
          screen-reader visitor has to walk all eight nav links before reaching
          the page itself, on every navigation. Invisible until it takes
          focus.

          The jump is handled here rather than left to the browser: Lenis owns
          the scroll position, and a native fragment jump sets scrollTop behind
          its back, which it then animates away from. Moving focus explicitly
          also covers the browsers that scroll to a fragment without focusing
          it — the failure mode where the page moves but the next Tab press
          lands back at the top of the nav. */}
      <a className="skip-link" href="#main" onClick={skipToContent}>Skip to content</a>
      <nav
        className={pastHero ? 'top is-glass' : 'top'}
        id="nav"
        ref={navRef}
      >
        <div className="inner">
          <HomeLink className="brand">greenhueblues</HomeLink>
          <ul>
            <li><HomeLink markCurrent>Home</HomeLink></li>
            <li>
              <Link
                to="/philosophy"
                className={onPhilosophy ? 'is-current' : undefined}
                aria-current={onPhilosophy ? 'page' : undefined}
              >
                Philosophy
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className={onAbout ? 'is-current' : undefined}
                aria-current={onAbout ? 'page' : undefined}
              >
                About
              </Link>
            </li>
          </ul>
          <div className="right">
            <SocialLinks />
            <Link to="/#contact">Contact</Link>
          </div>
        </div>
      </nav>
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
            <SocialLinks />
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
