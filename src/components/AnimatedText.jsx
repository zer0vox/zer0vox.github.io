import { motion } from 'framer-motion'

export default function AnimatedText({ text, className = '' }) {
  const words = text.split(' ')

  return (
    <motion.h1
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={`text-[3rem] leading-[0.92] text-sky-300 sm:text-[4rem] md:text-[5rem] xl:text-[5.7rem] font-semibold ${className}`}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block mr-4">
          {word.split('').map((letter, letterIndex) => (
            <motion.span
              key={letterIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: (wordIndex * 0.1) + (letterIndex * 0.05),
                duration: 0.5,
                ease: 'easeOut'
              }}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.h1>
  )
}