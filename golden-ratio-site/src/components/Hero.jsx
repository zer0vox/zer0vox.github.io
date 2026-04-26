import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="mb-8"
      >
        <img
          src="/greenhueblues.png"
          alt="greenhueblues logo"
          className="h-16 md:h-20 object-contain"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        className="glass-effect rounded-3xl p-8 md:p-12"
      >
        <img
          src="/here in.jpg"
          alt="hero image"
          className="w-full max-w-2xl h-auto rounded-2xl object-cover shadow-2xl"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="mt-6 text-sm text-gray-400 font-light"
      >
        Coming Soon.
      </motion.p>
    </section>
  )
}