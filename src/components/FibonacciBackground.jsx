import { motion } from 'framer-motion'

export default function FibonacciBackground() {
  const ripples = Array.from({ length: 5 }, (_, i) => i)

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"></div>
      
      {/* Ripple animations */}
      {ripples.map((i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 rounded-full border border-cyan-500/20"
          style={{
            width: 100 + i * 150,
            height: 100 + i * 150,
            marginLeft: -(50 + i * 75),
            marginTop: -(50 + i * 75),
          }}
          initial={{ opacity: 0.6, scale: 0.8 }}
          animate={{
            opacity: [0.6, 0.2, 0],
            scale: [0.8, 2.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 4 + i * 0.5,
            ease: 'easeOut',
            delay: i * 0.4,
          }}
        />
      ))}

      {/* Floating shapes */}
      <motion.div
        className="absolute top-20 right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl"
        animate={{
          y: [0, 30, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-32 left-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"
        animate={{
          y: [0, -40, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 7,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}