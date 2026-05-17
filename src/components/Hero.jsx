import { useEffect, useState } from 'react'

export default function Hero() {
  const [heroLinesIn, setHeroLinesIn] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setHeroLinesIn(true))
  }, [])

  const lines = [
    'Building mindful systems for a',
    'conscious world. Shaping enlightened',
    'design with purposeful vision.'
  ]

  return (
    <section className="relative w-full h-screen min-h-[640px] overflow-hidden bg-black" id="top">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1c44] via-[#14163b] to-[#0d0d0d]" />
      
      {/* Radial gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(110% 70% at 50% 50%, rgba(40,30,90,0) 0%, rgba(13,13,13,.85) 100%)`
        }}
      />

      {/* Conic gradient pattern */}
      <div 
        className="absolute inset-0 opacity-85 mix-blend-screen"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, 
            rgba(255,255,255,.05) 0deg,
            rgba(255,255,255,.00) 30deg,
            rgba(255,255,255,.06) 60deg,
            rgba(255,255,255,.00) 90deg,
            rgba(255,255,255,.05) 120deg,
            rgba(255,255,255,.00) 150deg,
            rgba(255,255,255,.06) 180deg,
            rgba(255,255,255,.00) 210deg,
            rgba(255,255,255,.05) 240deg,
            rgba(255,255,255,.00) 270deg,
            rgba(255,255,255,.06) 300deg,
            rgba(255,255,255,.00) 330deg,
            rgba(255,255,255,.05) 360deg)`
        }}
      />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(255,255,255,.04) 0px, rgba(255,255,255,.04) 1px, transparent 1px, transparent 3px),
            repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0px, rgba(255,255,255,.04) 1px, transparent 1px, transparent 3px)
          `,
          maskImage: 'radial-gradient(ellipse 60% 80% at 50% 50%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 50% 50%, black 30%, transparent 80%)'
        }}
      />

      {/* Placeholder tag */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="font-mono text-xs tracking-widest uppercase text-white/55 bg-black/55 px-3 py-1.5 border border-dashed border-white/22 rounded whitespace-nowrap">
          hero — symmetrical wing / architectural texture
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end px-6 pb-9 sm:px-8 z-20">
        <div className="max-w-7xl w-full mx-auto">
          <div className="flex justify-between items-end gap-6">
            {/* Hero title */}
            <h1 className="text-[clamp(44px,6.4vw,80px)] font-normal leading-[1.05] text-[#A8C7FF] max-w-[22ch]">
              {lines.map((line, i) => (
                <div key={i} className="overflow-hidden">
                  <div 
                    className={`inline-block transition-all duration-1000 ${
                      heroLinesIn ? 'translate-y-0 opacity-100' : 'translate-y-[110%] opacity-0'
                    }`}
                    style={{ 
                      transitionDelay: `${[50, 200, 340][i]}ms`,
                      transitionTimingFunction: 'cubic-bezier(.22,.7,.18,1)'
                    }}
                  >
                    {line}
                  </div>
                </div>
              ))}
            </h1>

            {/* Scroll indicator */}
            <div className="text-white font-normal text-lg">
              <span className="text-white/50">(</span>Scroll<span className="text-white/50">)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
