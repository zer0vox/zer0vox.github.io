import { motion } from 'framer-motion'
import AnimatedText from './AnimatedText'

export default function StudioSection() {
  return (
    <section className="relative bg-[#040407] px-6 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="max-w-4xl"
        >
          <AnimatedText text="greenhueblues is an independent design studio based in Kathmandu, working globally with brands and cultural institutions." />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.85, ease: 'easeOut' }}
            className="mt-10"
          >
            <a href="#about" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm text-white transition hover:border-sky-300/50 hover:text-sky-300">
              More About Us
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}