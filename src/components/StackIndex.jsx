import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './StackIndex.css'

gsap.registerPlugin(ScrollTrigger)

// The stack, set as a type specimen's index on a sheet of ink: four sections,
// every tool by name at one display size. It used to be a marquee of logos hotlinked from two icon CDNs; on
// a printed page the names are the thing, in the house face, and nothing has
// to load.
//
// The type is printed, never set in motion: only the 1px rules draw in.
// Reduced motion gets every rule at full length.

const SECTIONS = [
  { title: 'Languages', tools: ['Python', 'C', 'C++', 'MATLAB'] },
  { title: 'Web and app', tools: ['React', 'Astro', 'Node', 'Express', 'MongoDB', 'Flutter'] },
  { title: 'On chain', tools: ['Ethereum', 'Remix IDE', 'MetaMask'] },
  { title: 'Applications', tools: ['Proteus', 'Salesforce', 'Photoshop', 'Illustrator'] },
]

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function StackIndex() {
  const rootRef = useRef(null)

  // Layout effect, so the rules are drawn from nothing rather than flashing
  // in at full length for a frame first.
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion()) return undefined

    let cancelled = false

    const ctx = gsap.context(() => {
      // Each section's rule, and the rule that closes the last one. The
      // trigger runs to the end of the page, so a page that opens already
      // scrolled past the sheet still draws them.
      gsap.utils.toArray('.si-sec-rule').forEach((rule, i) => {
        gsap.fromTo(rule, { scaleX: 0 }, {
          scaleX: 1,
          duration: 1.1,
          ease: 'power4.inOut',
          delay: (i % 2) * 0.08,
          scrollTrigger: { trigger: rule.parentElement, start: 'top 85%', end: 'max', once: true },
        })
      })
    }, root)

    document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh())

    return () => {
      cancelled = true
      ctx.revert()
    }
  }, [])

  return (
    <section className="si" id="stack" ref={rootRef} aria-labelledby="si-title">
      <div className="si-sheet">
        <h2 className="si-title" id="si-title">
          Stack<span className="si-dot" aria-hidden="true">.</span>
        </h2>

        {SECTIONS.map((sec) => (
          <div className="si-sec" key={sec.title}>
            <span className="si-sec-rule" aria-hidden="true" />
            <div className="si-sec-head">
              <h3 className="si-sec-title">{sec.title}</h3>
            </div>

            <ul className="si-list">
              {sec.tools.map((name) => (
                <li className="si-item" key={name}>
                  <span className="si-name">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* The rule that closes the last section. */}
        <div className="si-foot">
          <span className="si-sec-rule si-sec-rule--close" aria-hidden="true" />
        </div>
      </div>

      <span className="si-band" aria-hidden="true" />
    </section>
  )
}
