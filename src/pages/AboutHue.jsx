import { useEffect } from 'react'
import { SiteNav } from '../components/SiteChrome'
import HueHero from '../components/HueHero.jsx'
import HueSpread from '../components/HueSpread.jsx'
import HuePath from '../components/HuePath.jsx'
import HueClose from '../components/HueClose.jsx'
import './AboutHue.css'

// The blue about page, set from the greenhueblues brand deck
// (src/assets/about/green hue.svg): its inks, its photographs, its lockup and
// its two hand-drawn marks, and only what an about page has to say.
//
// Parked at /about/hue while the printed About (About.jsx) is the live one;
// nothing in the nav links here.
//
//   photo -> blue   the lockup, the slide changing under it (HueHero)
//   blue            who, as the deck's third slide (HueSpread)
//   blue            the path: every step with its wins and a sketch of it,
//                   then the toolkit (HuePath)
//   blue            how to reach me, and the colophon (HueClose)
//
// The hand-drawn layer -- the marker loops, underlines and arrows
// (Scribble) and the achievement drawings (Sketch) -- is the "ghb"
// monogram's nib in yellow and the signature's pen in white.

export default function AboutHue() {
  useEffect(() => {
    const previous = document.title
    document.title = 'About | greenhueblues'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <>
      <SiteNav />

      <main id="main" className="hue">
        <HueHero />
        <HueSpread />
        <HuePath />
      </main>

      <HueClose />
    </>
  )
}
