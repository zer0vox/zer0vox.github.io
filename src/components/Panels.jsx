export default function Panels() {
  const panels = [
    {
      id: 1,
      label: '1',
      name: 'DNA',
      gradient: 'from-[#6dd9a8] via-[#2c8b6a] to-[#0a2c22]',
      scriptText: 'greenhueblues',
      tagText: 'flowing mint gradient · script wordmark'
    },
    {
      id: 2,
      label: '2',
      name: 'Linear\nIdentity',
      gradient: 'from-[#1a2a52] to-[#06092a]',
      tagText: 'oscilloscope — yellow sine on dotted grid',
      hasGrid: true
    },
    {
      id: 3,
      label: '3',
      name: 'Future\nArchive',
      gradient: 'from-[#2a1430] via-[#6a2645] via-[#c45d3e] to-[#20131a]',
      tagText: 'photo — sunset clouds, dramatic horizon'
    },
    {
      id: 4,
      label: '4',
      name: 'Project\nEcho',
      gradient: 'from-[#2a3aa8] to-[#06082a]',
      tagText: 'deep-blue abstract gradient'
    },
    {
      id: 5,
      label: '5',
      name: 'Studio\nAtlas',
      gradient: 'from-[#4a1419] to-[#0a0306]',
      tagText: 'photo — red leather chairs, low light'
    }
  ]

  return (
    <section className="relative" id="featured">
      {panels.map((panel, idx) => (
        <article
          key={panel.id}
          className="sticky top-0 h-screen min-h-[640px] overflow-hidden bg-black flex items-end"
        >
          {/* Background */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
              '--tw-gradient-stops': `var(--tw-gradient-from), var(--tw-gradient-to)`
            }}
            className={`absolute inset-0 bg-gradient-to-br ${panel.gradient}`}
          />

          {/* Special effects for panel 1 */}
          {panel.id === 1 && (
            <div className="absolute inset-0">
              <div 
                className="absolute inset-0 mix-blend-overlay"
                style={{
                  background: `
                    radial-gradient(60% 40% at 70% 75%, rgba(255,255,255,.18), transparent 60%),
                    radial-gradient(40% 30% at 20% 80%, rgba(0,0,0,.30), transparent 60%)
                  `
                }}
              />
            </div>
          )}

          {/* Special effects for panel 3 - sunset */}
          {panel.id === 3 && (
            <div className="absolute inset-0">
              <div 
                className="absolute inset-0 mix-blend-overlay"
                style={{
                  background: `
                    radial-gradient(ellipse 80% 30% at 50% 38%, rgba(255,200,140,.55), transparent 60%),
                    radial-gradient(ellipse 60% 18% at 30% 50%, rgba(0,0,0,.35), transparent 70%),
                    radial-gradient(ellipse 60% 22% at 80% 60%, rgba(0,0,0,.35), transparent 70%)
                  `
                }}
              />
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'repeating-linear-gradient(178deg, rgba(255,255,255,.08) 0px, transparent 2px, transparent 4px)'
                }}
              />
            </div>
          )}

          {/* Special effects for panel 4 - deep blue */}
          {panel.id === 4 && (
            <div className="absolute inset-0">
              <div 
                className="absolute inset-0 opacity-85 mix-blend-screen"
                style={{
                  background: `conic-gradient(from 220deg at 70% 60%,
                    rgba(100,180,255,.4) 0deg,
                    rgba(50,100,200,.2) 60deg,
                    rgba(30,50,150,.15) 120deg,
                    rgba(20,80,200,.2) 180deg,
                    rgba(40,120,255,.3) 240deg,
                    rgba(20,30,90,0) 360deg)`
                }}
              />
            </div>
          )}

          {/* Grid for panel 2 */}
          {panel.id === 2 && (
            <div className="absolute inset-0">
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(rgba(255,255,255,.10) 1px, transparent 1.5px)',
                  backgroundSize: '22px 22px',
                  maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 90%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 90%)'
                }}
              />
            </div>
          )}

          {/* Script text for panel 1 */}
          {panel.id === 1 && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div 
                className="font-script text-[clamp(80px,13vw,220px)] font-bold leading-[0.9] text-[#0e3326] text-shadow"
                style={{
                  fontFamily: 'Caveat, cursive',
                  textShadow: '0 1px 0 rgba(255,255,255,.18)',
                  transform: 'rotate(-3deg)',
                  letterSpacing: '-0.02em'
                }}
              >
                {panel.scriptText}
              </div>
            </div>
          )}

          {/* Placeholder tag */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="font-mono text-xs tracking-widest uppercase text-white/60 bg-black/45 px-3 py-1.5 border border-dashed border-white/25 rounded whitespace-nowrap">
              {panel.tagText}
            </div>
          </div>

          {/* Label (left center) */}
          <div className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 z-20">
            <span className="font-semibold text-[clamp(72px,12vw,200px)] leading-[0.85] text-white">
              {panel.label}
            </span>
          </div>

          {/* Name (right center) */}
          <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 z-20 text-right">
            <span className="font-semibold text-[clamp(40px,6vw,96px)] leading-[0.95] text-white whitespace-pre-line">
              {panel.name}
            </span>
          </div>
        </article>
      ))}
    </section>
  )
}
