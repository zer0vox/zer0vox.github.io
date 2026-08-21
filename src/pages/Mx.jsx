import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CityRain from '../components/CityRain'
import { useAudio } from '../audio/audioContext'
import { formatTime } from '../audio/format'
import './Mx.css'

// Shown one at a time, slowly. The list is long enough that it rarely repeats
// within a sitting.
const PHRASES = [
  'still shipping.',
  'works on my machine.',
  'waiting for CI.',
  'production is green.',
  'one more deploy.',
  'another tab. another ticket.',
  'the build is passing.',
  'merge conflict.',
  'it passed QA.',
  'meeting could have been an email.',
  'standup in 4 minutes.',
  'just fixing one thing.',
  'somewhere between staging and production.',
  'no incidents.',
  'coffee → code → deploy.',
  'commit. deploy. repeat.',
  'another sprint. another release.',
  'friday deploy. brave.'
]

const PHRASE_MS = 9000

// The window has its own line in each weather.
const MODE_QUOTES = {
  badal: 'badal risayo bhane paani parcha',
  clear: 'aakash khushi cha aja'
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

const pad = (n) => String(n).padStart(2, '0')

export default function Mx() {
  const {
    track,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    ambience,
    mode,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    setAmbience,
    toggleMode
  } = useAudio()

  const now = useClock()
  const sceneRef = useRef(null)
  const [phrase, setPhrase] = useState(0)

  // The window itself is a fixed, non-scrolling frame — release the document
  // scroll while MX is mounted and give it back on the way out.
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('mx-locked')
    return () => html.classList.remove('mx-locked')
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setPhrase((p) => (p + 1) % PHRASES.length)
    }, PHRASE_MS)
    return () => clearInterval(id)
  }, [])

  // Barely-there parallax: the view shifts a few pixels as the pointer moves,
  // the way your head moving at a desk shifts what the window frames.
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onMove = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2
      const y = (event.clientY / window.innerHeight - 0.5) * 2
      scene.style.setProperty('--mx-px', x.toFixed(3))
      scene.style.setProperty('--mx-py', y.toFixed(3))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // Keyboard transport, ignored while a control or link has focus so it never
  // fights the native behaviour of a slider or button.
  const onKeyDown = useCallback(
    (event) => {
      const tag = event.target?.tagName
      if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'A') return
      if (event.code === 'Space') {
        event.preventDefault()
        toggle()
      } else if (event.code === 'ArrowRight') {
        seek(currentTime + 10)
      } else if (event.code === 'ArrowLeft') {
        seek(currentTime - 10)
      } else if (event.key === 'm' || event.key === 'M') {
        toggleMute()
      }
    },
    [toggle, seek, currentTime, toggleMute]
  )

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  const seconds = pad(now.getSeconds())

  // Telemetry is set dressing, not a dashboard — it only has to be plausible.
  // "Last deploy" is pinned to eleven minutes before you sat down.
  const [arrivedAt] = useState(() => new Date())
  const deployedAt = new Date(arrivedAt.getTime() - 11 * 60 * 1000)
  const deploy = `${pad(deployedAt.getHours())}:${pad(deployedAt.getMinutes())}`
  const latency = 38 + (now.getSeconds() % 9)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <main className="mx" data-mode={mode} data-playing={isPlaying ? 'true' : 'false'}>
      <div className="mx-scene" ref={sceneRef}>
        <div className="mx-photo mx-photo--badal" aria-hidden="true" />
        <div className="mx-photo mx-photo--clear" aria-hidden="true" />
        <div className="mx-grade" aria-hidden="true" />
        <CityRain mode={mode} alive={isPlaying} />
        <div className="mx-glass" aria-hidden="true" />
        <div className="mx-monitor" aria-hidden="true" />
      </div>

      <div className="mx-ui">
        <header className="mx-top">
          <a className="mx-back" href="#top">
            <span aria-hidden="true">←</span> greenhueblues
          </a>
          <span className="mx-mark">MX</span>
          <button
            type="button"
            className="mx-mode"
            onClick={toggleMode}
            aria-pressed={mode === 'badal'}
            aria-label={`Weather: ${mode === 'badal' ? 'badal' : 'clear'}. Switch to ${
              mode === 'badal' ? 'clear' : 'badal'
            }.`}
          >
            <span className={mode === 'clear' ? 'on' : ''}>clear</span>
            <span className="sep" aria-hidden="true">/</span>
            <span className={mode === 'badal' ? 'on' : ''}>badal</span>
          </button>
        </header>

        <section className="mx-center">
          <p className="mx-clock">
            <time dateTime={now.toISOString()}>{clock}</time>
            <span className="sec">{seconds}</span>
          </p>
          <div className="mx-phrase-slot" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p
                key={phrase}
                className="mx-phrase"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 1.6, ease: [0.22, 0.7, 0.18, 1] }}
              >
                {PHRASES[phrase]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="mx-quote-slot">
            <AnimatePresence mode="wait">
              <motion.p
                key={mode}
                className="mx-quote"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              >
                {MODE_QUOTES[mode]}
              </motion.p>
            </AnimatePresence>
          </div>
        </section>

        <section className="mx-console" aria-label="Player">
          <dl className="mx-telemetry">
            <div>
              <dt>branch</dt>
              <dd>main</dd>
            </div>
            <div>
              <dt>env</dt>
              <dd>production</dd>
            </div>
            <div>
              <dt>build</dt>
              <dd className="ok">passing</dd>
            </div>
            <div>
              <dt>latency</dt>
              <dd>{latency}ms</dd>
            </div>
            <div>
              <dt>deploy</dt>
              <dd>{deploy}</dd>
            </div>
            <div>
              <dt>commit</dt>
              <dd>8f3c2a1</dd>
            </div>
          </dl>

          <div className="mx-player">
            <div className="mx-now">
              <span className="mx-now-title">{track?.title}</span>
              <span className="mx-now-artist">{track?.artist}</span>
            </div>

            <div className="mx-seek">
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(currentTime, duration || 0)}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Seek"
                style={{ '--mx-progress': `${progress}%` }}
              />
              <div className="mx-times">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="mx-transport">
              <button type="button" onClick={previous} aria-label="Previous track">
                ◀◀
              </button>
              <button
                type="button"
                className="mx-play"
                onClick={toggle}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '❚❚' : '▶'}
              </button>
              <button type="button" onClick={next} aria-label="Next track">
                ▶▶
              </button>
            </div>

            <div className="mx-levels">
              <div className="mx-level">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                  className="mx-level-key"
                >
                  {muted ? 'muted' : 'vol'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  aria-label="Volume"
                  style={{ '--mx-progress': `${volume * 100}%` }}
                />
              </div>
              <div className="mx-level">
                <span className="mx-level-key">street</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={ambience}
                  onChange={(e) => setAmbience(Number(e.target.value))}
                  aria-label="Street ambience level"
                  style={{ '--mx-progress': `${ambience * 100}%` }}
                />
              </div>
            </div>
          </div>

        </section>
      </div>
    </main>
  )
}
