import { AnimatePresence, motion } from 'framer-motion'
import { useAudio } from '../audio/audioContext'
import './MiniPlayer.css'

// Follows you off /mx. Only appears once something has actually been played, so
// a first-time visitor to the portfolio never sees it.
export default function MiniPlayer({ hidden = false }) {
  const { track, isPlaying, toggle, engaged, currentTime, duration } = useAudio()

  const show = engaged && !hidden && track
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="mini"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.5, ease: [0.22, 0.7, 0.18, 1] }}
        >
          <span className="mini-bar" style={{ width: `${progress}%` }} aria-hidden="true" />
          <button
            type="button"
            className="mini-toggle"
            onClick={toggle}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <a className="mini-meta" href="#mx">
            <span className="mini-title">{track.title}</span>
            <span className="mini-dot" aria-hidden="true">
              ·
            </span>
            <span className="mini-artist">{track.artist}</span>
          </a>
          <a className="mini-mark" href="#mx" aria-label="Open MX">
            MX
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
