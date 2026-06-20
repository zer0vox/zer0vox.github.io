import { useRef, useEffect, useState, useCallback } from 'react'

// Maps log entry type → CSS color variable
const TYPE_COLOR = {
  system:     'var(--dev-text)',
  input:      'var(--dev-dim)',
  error:      'var(--dev-error)',
  success:    'var(--dev-success)',
  dim:        'var(--dev-dim)',
  typewriter: 'var(--dev-accent)',
}

// Typewriter effect: reveals the help block one character at a time
function TypewriterBlock({ lines }) {
  const [done, setDone]   = useState([])
  const [lineIdx, setLine] = useState(0)
  const [charIdx, setChar] = useState(0)

  useEffect(() => {
    if (lineIdx >= lines.length) return

    const line = lines[lineIdx]

    if (charIdx < line.length) {
      const t = setTimeout(() => setChar(c => c + 1), 9)
      return () => clearTimeout(t)
    }

    // Line complete — advance to next after a short pause
    const t = setTimeout(() => {
      setDone(d => [...d, line])
      setLine(l => l + 1)
      setChar(0)
    }, 16)
    return () => clearTimeout(t)
  }, [lineIdx, charIdx, lines])

  const current = lineIdx < lines.length ? lines[lineIdx].slice(0, charIdx) : null

  return (
    <div style={{ color: 'var(--dev-accent)' }}>
      {done.map((ln, i) => (
        <div key={i} className="dev-log-line dev-log-box">{ln}</div>
      ))}
      {current !== null && (
        <div className="dev-log-line dev-log-box">
          {current}<span className="dev-tw-blink">▌</span>
        </div>
      )}
    </div>
  )
}

function LogEntry({ entry }) {
  if (entry.type === 'typewriter') {
    return <TypewriterBlock lines={entry.lines} />
  }
  return (
    <div
      className="dev-log-line"
      style={{ color: TYPE_COLOR[entry.type] ?? 'var(--dev-text)' }}
    >
      {entry.text}
    </div>
  )
}

export default function TerminalPanel({ log, onCommand }) {
  const [input,   setInput]   = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Auto-scroll to newest log entry
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  const submit = useCallback((e) => {
    e.preventDefault()
    const val = input.trim()
    if (val) setHistory(h => [val, ...h].slice(0, 64))
    setHistIdx(-1)
    onCommand(input)
    setInput('')
  }, [input, onCommand])

  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHistIdx(prev => {
        const next = Math.min(prev + 1, history.length - 1)
        if (next >= 0) setInput(history[next])
        return next
      })
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHistIdx(prev => {
        const next = prev - 1
        if (next < 0) { setInput(''); return -1 }
        setInput(history[next])
        return next
      })
    }
  }, [history])

  return (
    <div
      className="dev-terminal"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Window chrome bar */}
      <div className="dev-win-bar">
        <span className="dev-dot r" />
        <span className="dev-dot y" />
        <span className="dev-dot g" />
        <span className="dev-win-title">GHB TERMINAL v1.0 ── SECURE SESSION</span>
      </div>

      {/* Scrollable log */}
      <div className="dev-log-body">
        {log.map((entry, i) => <LogEntry key={i} entry={entry} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <form className="dev-input-bar" onSubmit={submit}>
        <span className="dev-prompt">_dev&gt;</span>
        <input
          ref={inputRef}
          className="dev-input"
          value={input}
          onChange={e => { setInput(e.target.value); setHistIdx(-1) }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Terminal command input"
        />
      </form>

      {/* CRT scanlines overlay */}
      <div className="dev-scanlines" />
    </div>
  )
}
