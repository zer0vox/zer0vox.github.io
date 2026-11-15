import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import bloom from '../assets/about/hue/white-bloom.webp'
import leak from '../assets/about/hue/leak.webp'
import scribble from '../assets/about/hue/scribble.svg'
import Scribble from './Scribble.jsx'
import './HueSpread.css'

gsap.registerPlugin(ScrollTrigger)

// The brand deck's third slide, set as the bio: three words in white at the
// head, the paragraph at the foot, and on the right the white blooms with the
// film's light leak burnt in along one edge, the signature thrown across the
// corner of the print.
//
// The frame is the deck's slide at the page's width and everything in it is
// placed in the slide's own fractions (container units), so it reads as the
// slide at every desktop size. Below 760px it becomes a column.
//
// When the frame comes up the words rise, the print is wiped up, the leak
// develops on it and the signature is written across. Reduced motion gets the
// slide as printed.

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function HueSpread() {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion()) return undefined

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: { trigger: root, start: 'top 70%', once: true },
        })
        .fromTo('.hue-big-ink', { yPercent: 105 }, { yPercent: 0, duration: 1, stagger: 0.09 }, 0)
        .fromTo(
          '.hue-bloom',
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut' },
          0.1
        )
        .fromTo('.hue-bloom-photo', { scale: 1.18 }, { scale: 1, duration: 1.6 }, 0.1)
        .fromTo('.hue-leak', { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power1.inOut' }, 0.9)
        .fromTo(
          '.hue-scribble',
          { clipPath: 'inset(0% 100% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power2.inOut' },
          1.1
        )
        .fromTo('.hue-bio', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9 }, 0.5)
        .fromTo(
          '.hue-big-loop path',
          { strokeDashoffset: 1.01 },
          { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' },
          0.75
        )
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section className="hue-spread" ref={rootRef} aria-labelledby="hue-spread-title">
      <div className="hue-frame">
        <h2 className="hue-big" id="hue-spread-title">
          <span className="hue-big-line"><span className="hue-big-ink">Curious.</span></span>{' '}
          <span className="hue-big-line"><span className="hue-big-ink">Creative.</span></span>{' '}
          <span className="hue-big-line"><span className="hue-big-ink">Conscious.</span></span>
          {/* Outside the line masks, which would clip it. */}
          <Scribble kind="loop" className="hue-big-loop" />
        </h2>

        <div className="hue-art">
          <figure className="hue-bloom">
            <img
              className="hue-bloom-photo"
              src={bloom}
              alt="White blooms in a hedge"
              width="1000"
              height="1000"
              loading="lazy"
              decoding="async"
            />
            <img className="hue-leak" src={leak} alt="" width="720" height="720" loading="lazy" decoding="async" />
          </figure>
          <img
            className="hue-scribble"
            src={scribble}
            alt=""
            width="301"
            height="262"
            loading="lazy"
            decoding="async"
          />
        </div>

        <p className="hue-bio">
          <strong>Sumip Chaudhary</strong>, a tech enthusiast who loves to build, whether that means
          writing code, designing systems, or turning an idea into something real. Outside of tech
          I&apos;m drawn to art, music and the stories people carry. I believe in trying things,
          making mistakes, learning, and moving on.
        </p>
      </div>
    </section>
  )
}
