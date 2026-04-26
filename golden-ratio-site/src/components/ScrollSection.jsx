import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function ScrollSection() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      {
        threshold: 0.3,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return (
    <section
      ref={ref}
      className='relative min-h-screen flex flex-col items-center justify-center px-6 py-32 overflow-hidden'
    >
      <div className='absolute inset-0 -z-10'>
        <motion.div
          className='absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl'
          animate={{
            y: [0, -50, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className='max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center'>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className='glass-effect rounded-2xl p-4 overflow-hidden'
        >
          <img
            src='/jux.png'
            alt='sophisticated juxtaposition'
            className='w-full h-auto rounded-lg object-cover shadow-2xl'
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className='space-y-6'
        >
          <h2 className='text-4xl md:text-5xl font-light tracking-wider text-cyan-400'>
            Something's Brewing
          </h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className='text-lg md:text-xl text-gray-300 font-light leading-relaxed'
          >
            Take your seat, sumip is working on it
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ delay: 0.6 }}
            className='pt-6'
          >
            <div className='glass-effect rounded-xl p-4 border border-cyan-500/20'>
              <p className='text-sm text-gray-400 text-center'>
                Crafting extraordinary experiences with precision and vision
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
