import { useEffect } from 'react'
import { SiteNav } from '../components/SiteChrome'
import HomeFx from '../components/HomeFx.jsx'
import AboutHero from '../components/AboutHero.jsx'
import MeetSpread from '../components/MeetSpread.jsx'
import NameProof from '../components/NameProof.jsx'
import StackIndex from '../components/StackIndex.jsx'
import ExperienceTimeline from '../components/ExperienceTimeline.jsx'
import HomeFooter from '../components/HomeFooter.jsx'

// The about page, printed the way the home page is: a run of sheets in four
// stocks, each with one thing to say, and the red band running down through
// all of them on the same x.
//
//   paper   the portrait, screened in marine over a butter sun (AboutHero)
//   marine  the bio: the lead printing in out of register (MeetSpread)
//   paper   the name, as a proof of its two inks (NameProof)
//   ink     the stack, set as an index (StackIndex)
//   marine  the years, each one's object printed in dots (ExperienceTimeline)
//   ink     the colophon: the home page's own last sheet, so every page
//           closes the same way
//
// HomeFx lays the paper grain and the reading rule over all of it; the hero's
// data-printed attribute is what gives the page the masthead in the first
// place (index.css).

export default function About() {
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
      <HomeFx />

      <main id="main">
        <AboutHero />
        <MeetSpread />
        <NameProof />
        <StackIndex />
        <ExperienceTimeline />
      </main>

      <HomeFooter />
    </>
  )
}
