import { motion } from 'framer-motion'

const sections = [
  { number: '1', title: 'DNA' },
  { number: '2', title: 'Vision' },
  { number: '3', title: 'Logic' },
  { number: '4', title: 'Limitless' },
]

export default function NumberedSections() {
  return (
    <section className="relative bg-[#040407] px-6 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {sections.map((section, index) => (
            <motion.div
              key={section.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-sky-300 md:text-5xl">
                {section.number}
              </div>
              <div className="mt-2 text-lg text-white/80 md:text-xl">
                {section.title}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}