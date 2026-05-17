import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const cards = [
  {
    title: 'Work',
    text: 'Our work explores branding and digital design, balancing clarity, creativity, and cultural resonance.',
  },
  {
    title: 'Index',
    text: 'A curated collection of projects showcasing our approach to design and creative direction.',
  },
  {
    title: 'Playground',
    text: 'We share perspectives on design, technology and culture, exploring ideas that inspire practice and spark conversation.',
  },
]

export default function ScrollSection() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.2 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => {
      if (ref.current) observer.unobserve(ref.current)
    }
  }, [])

  return (
    <section
      id="work"
      ref={ref}
      className="relative overflow-hidden border-t border-white/10 bg-[#06060c] px-6 py-24 sm:px-8 lg:px-12"
    >
      <div id="index" className="absolute -top-16" />
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_30%)] opacity-80" />
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="mb-14 max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Work / Index / About</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Quietly curated systems for people who value clarity over noise.
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card, index) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ delay: index * 0.12, duration: 0.7, ease: 'easeOut' }}
              className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
            >
              <div className="text-sm uppercase tracking-[0.35em] text-sky-300">{card.title}</div>
              <h3 className="mt-4 text-2xl font-semibold text-white">{card.title} direction</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{card.text}</p>
            </motion.article>
          ))}
        </div>

        <div id="contact" className="mt-16 rounded-[28px] border border-sky-300/10 bg-slate-950/70 p-10 backdrop-blur-xl">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Contact</p>
            <h3 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Let�s start something thoughtful.
            </h3>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300">
              Reach out to begin a project grounded in calm direction, intelligent systems, and elegant digital presence.
            </p>
            <a href="mailto:hello@greenhueblues.com" className="mt-8 inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-6 py-3 text-sm text-sky-100 transition hover:bg-sky-300/20 hover:text-white">
              hello@greenhueblues.com
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
