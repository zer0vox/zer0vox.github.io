import { motion } from 'framer-motion'

export default function About() {
  const values = [
    {
      number: '01',
      title: 'Research',
      description: 'We dive deep into understanding your vision, market, and users to inform every design decision.'
    },
    {
      number: '02',
      title: 'Strategy',
      description: 'Strategic thinking guides our approach, ensuring designs serve your business goals and user needs.'
    },
    {
      number: '03',
      title: 'Execution',
      description: 'Meticulous attention to detail brings concepts to life with precision, creativity, and purposeful design.'
    }
  ]

  return (
    <section className="relative bg-black px-6 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              About Our Studio
            </h2>
            <p className="text-lg text-white/70 max-w-3xl leading-relaxed mb-6">
              We are an independent design studio based in Kathmandu, working globally with brands and cultural institutions. Our approach combines strategic thinking with meticulous execution to create design systems that resonate with purpose and meaning.
            </p>
            <p className="text-base text-white/60 max-w-3xl leading-relaxed">
              Every project is an opportunity to build systems that serve users thoughtfully and advance our clients' missions in meaningful ways.
            </p>
          </motion.div>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="mb-6">
                <span className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {value.number}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                {value.title}
              </h3>
              <p className="text-white/60 leading-relaxed">
                {value.description}
              </p>
              <div className="mt-6 h-0.5 w-0 bg-gradient-to-r from-cyan-400 to-blue-400 group-hover:w-12 transition-all duration-300" />
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20 pt-12 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          <div>
            <p className="text-3xl md:text-4xl font-bold text-cyan-300 mb-2">150+</p>
            <p className="text-white/60">Projects Completed</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold text-cyan-300 mb-2">12+</p>
            <p className="text-white/60">Years Experience</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold text-cyan-300 mb-2">50+</p>
            <p className="text-white/60">Team Members</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold text-cyan-300 mb-2">25</p>
            <p className="text-white/60">Countries Served</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
