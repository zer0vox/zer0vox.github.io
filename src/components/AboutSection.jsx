import { useState, useEffect, useRef } from 'react'

export default function AboutSection() {
  const [words, setWords] = useState([])
  const [litWords, setLitWords] = useState(0)
  const sectionRef = useRef(null)

  const fullText = 'greenhueblues is an independent design studio based in Kathmandu, working globally with brands and cultural institutions.'

  useEffect(() => {
    // Split text into words
    const textWords = fullText.trim().split(/\s+/)
    setWords(textWords)
  }, [])

  useEffect(() => {
    function handleScroll() {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const vh = window.innerHeight
      
      // Start lighting when top of paragraph reaches 75% down the viewport
      const startY = vh * 0.75
      // Finish when bottom reaches 25% down
      const endY = vh * 0.25
      
      const top = rect.top
      const height = rect.height
      
      // Calculate progress 0..1 across paragraph height
      const total = (startY - endY) + height
      const traveled = Math.max(0, startY - top)
      const progress = Math.max(0, Math.min(1, traveled / total))
      const cutoff = Math.floor(progress * words.length)
      
      setLitWords(cutoff)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    handleScroll() // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [words.length])

  return (
    <section 
      className="bg-black px-6 py-[clamp(140px,20vw,260px)] sm:px-8 relative z-10"
      id="about"
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto">
        <p className="text-[clamp(36px,6vw,88px)] font-normal leading-[1.02] text-balance" style={{ letterSpacing: '-0.03em' }}>
          {words.map((word, i) => (
            <span
              key={i}
              className={`transition-colors duration-300 ease-out ${
                i < litWords ? 'text-white' : 'text-white/18'
              }`}
              style={{ 
                display: 'inline',
                marginRight: i < words.length - 1 ? '0.2em' : '0'
              }}
            >
              {word}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
