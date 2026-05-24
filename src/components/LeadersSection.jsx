import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const LEADERBOARD_KEY = 'tetrisLeaderboard'
const MAX_ENTRIES = 10

export default function LeadersSection() {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    loadLeaderboard()
    const handleLeaderboardUpdate = () => loadLeaderboard()
    window.addEventListener('leaderboardUpdate', handleLeaderboardUpdate)
    window.addEventListener('storage', handleLeaderboardUpdate)
    return () => {
      window.removeEventListener('leaderboardUpdate', handleLeaderboardUpdate)
      window.removeEventListener('storage', handleLeaderboardUpdate)
    }
  }, [])

  const loadLeaderboard = () => {
    try {
      const stored = window.localStorage.getItem(LEADERBOARD_KEY)
      const data = stored ? JSON.parse(stored) : []
      setEntries(data.sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES))
    } catch {
      setEntries([])
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <section className="leaders-section wrap" id="leaders">
      <h2>Tetris Leaderboard</h2>
      <div className="leaders-container">
        {entries.length === 0 ? (
          <motion.div
            className="no-scores"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p>No scores yet. Play the game to appear on the leaderboard!</p>
          </motion.div>
        ) : (
          <motion.div
            className="leaders-table"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="leaders-header">
              <div className="rank">Rank</div>
              <div className="score">Score</div>
              <div className="level">Level</div>
              <div className="lines">Lines</div>
              <div className="date">Date</div>
            </div>
            {entries.map((entry, index) => (
              <motion.div
                key={`${entry.timestamp}-${index}`}
                className="leader-row"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="rank">#{index + 1}</div>
                <div className="score">{entry.score.toLocaleString()}</div>
                <div className="level">{entry.level}</div>
                <div className="lines">{entry.lines}</div>
                <div className="date">{formatDate(entry.timestamp)}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
