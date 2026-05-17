import { motion } from 'framer-motion'

const projects = [
  { title: 'Studio Atlas', category: 'Art & Design Direction', year: '2025' },
  { title: 'Linear Identity', category: 'Branding, Web Design', year: '2025' },
  { title: 'Future Archive', category: 'Creative Direction', year: '2025' },
  { title: 'Parallel Forms', category: 'Art & Design Direction', year: '2025' },
  { title: 'Silent Motif', category: 'Creative Direction', year: '2025' },
  { title: 'Project Echo', category: 'Arden & Co.', year: '2025' },
  { title: 'Pattern Language', category: 'Lurex Agency', year: '2025' },
  { title: 'Spectrum Project', category: 'Mirell Works', year: '2025' },
]

export default function ProjectsSection() {
  return (
    <section id="work" className="relative overflow-hidden border-t border-white/10 bg-[#06060c] px-6 py-24 sm:px-8 lg:px-12">
      <div id="index" className="absolute -top-16" />
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_30%)] opacity-80" />
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="mb-14 max-w-2xl"
        >
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Work</h2>
          <p className="mt-4 text-lg text-white/80">
            Our work explores branding and digital design, balancing clarity, creativity, and cultural resonance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group cursor-pointer"
            >
              <div className="aspect-square bg-white/5 rounded-lg mb-4 overflow-hidden">
                {/* Placeholder for project image */}
                <div className="w-full h-full bg-gradient-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center">
                  <span className="text-white/50 text-sm">Project Image</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white group-hover:text-sky-300 transition">
                {project.title}
              </h3>
              <p className="text-white/60 mt-1">{project.category}</p>
              <p className="text-white/40 text-sm mt-1">{project.year}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <a href="#index" className="inline-flex items-center gap-2 text-sky-300 hover:text-white transition">
            View All Projects
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}