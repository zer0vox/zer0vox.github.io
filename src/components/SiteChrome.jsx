import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { Link, useLocation } from 'react-router-dom'

// Nav and footer are shared by every route, so the section links are written as
// absolute `/#id` targets rather than bare anchors: App scrolls to the section
// after the route lands, which keeps them working from a sub-page too.
export function SiteNav() {
  const { pathname } = useLocation()
  // Only the items that are pages of their own can be the current one; the rest
  // are sections of the home page.
  const onPhilosophy = pathname === '/philosophy'

  return (
    <motion.nav
      className="top"
      id="nav"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
    >
      <div className="inner">
        <Link to="/#top" className="brand">greenhueblues<span className="reg">®</span></Link>
        <ul>
          <li><Link to="/#work">Work</Link></li>
          <li>
            <Link
              to="/philosophy"
              className={onPhilosophy ? 'is-current' : undefined}
              aria-current={onPhilosophy ? 'page' : undefined}
            >
              Philosophy
            </Link>
          </li>
          <li><Link to="/#about">About</Link></li>
        </ul>
        <div className="right">
          <a href="#">X</a>
          <a href="#">Instagram</a>
          <a href="#">LinkedIn</a>
          <Link to="/#contact">Contact</Link>
        </div>
      </div>
    </motion.nav>
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
            <Link to="/#work">Work</Link>
          </div>
          <div className="col">
            <div className="h">Studio</div>
            <Link to="/philosophy">Philosophy</Link>
            <Link to="/#about">About</Link>
            <Link to="/#contact">Contact</Link>
          </div>
          <div className="col">
            <div className="h">Social</div>
            <a href="#">X</a>
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
          </div>
        </div>
        <div className="word" ref={wordRef}>greenhueblues<span className="reg">®</span></div>
        <div className="baseline">
          <div />
          <div>Copyright 2026. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}
