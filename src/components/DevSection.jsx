import { useState, useCallback } from 'react'
import TerminalPanel from './TerminalPanel'
import GameCanvas from './GameCanvas'
import './DevSection.css'

// ─── Theme palette definitions ────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:        '#07070f',
    canvasBg:  '#060810',
    text:      '#a8c7ff',
    accent:    '#c4a1ff',
    dim:       'rgba(168,199,255,0.42)',
    border:    'rgba(168,199,255,0.2)',
    error:     '#ff6b77',
    success:   '#7ee5a9',
    spriteA:   '#a8c7ff',
    spriteB:   '#6e9fe0',
    spriteC:   '#c4a1ff',
  },
  neon: {
    bg:        '#06000d',
    canvasBg:  '#08001a',
    text:      '#00eeff',
    accent:    '#ff00dd',
    dim:       'rgba(0,238,255,0.38)',
    border:    'rgba(0,238,255,0.26)',
    error:     '#ff3355',
    success:   '#00ff88',
    spriteA:   '#ff00dd',
    spriteB:   '#00eeff',
    spriteC:   '#ffee00',
  },
  moss: {
    bg:        '#030903',
    canvasBg:  '#040b04',
    text:      '#39ff14',
    accent:    '#86efac',
    dim:       'rgba(57,255,20,0.38)',
    border:    'rgba(57,255,20,0.2)',
    error:     '#ff6b77',
    success:   '#a8ff78',
    spriteA:   '#39ff14',
    spriteB:   '#1a7a0a',
    spriteC:   '#86efac',
  },
}

const INITIAL_LOG = [
  { type: 'system', text: 'greenhueblues terminal v1.0.0' },
  { type: 'system', text: '─────────────────────────────────────────' },
  { type: 'dim',    text: 'Secure session initialized.' },
  { type: 'dim',    text: 'Authorization protocol: ghb' },
  { type: 'dim',    text: '' },
  { type: 'dim',    text: 'Type "ghb help" to enumerate commands.' },
]

export default function DevSection() {
  const [theme,   setTheme]   = useState('dark')
  const [sprites, setSprites] = useState([])
  const [gravity, setGravity] = useState(0.35)
  const [log,     setLog]     = useState(INITIAL_LOG)

  // Append one or more log entries
  const push = useCallback((...entries) => {
    setLog(prev => [...prev, ...entries])
  }, [])

  const handleCommand = useCallback((raw) => {
    const input = raw.trim()
    const echo  = { type: 'input', text: `_dev> ${input}` }

    // Empty input — echo nothing, just swallow
    if (!input) return

    // ── Prefix enforcement ────────────────────────────────────────────────
    const hasPrefix = input === 'ghb' || input.startsWith('ghb ')
    if (!hasPrefix) {
      push(
        echo,
        { type: 'error', text: `❌ Command rejected. All authorization requests must begin with the 'ghb' protocol.` },
        { type: 'dim',   text: `   Type 'ghb help' for options.` }
      )
      return
    }

    const parts = input.slice(3).trim().split(/\s+/).filter(Boolean)
    const cmd   = parts[0]

    // ── Command router ────────────────────────────────────────────────────
    switch (cmd) {

      // Bare "ghb" with no subcommand
      case undefined:
        push(echo, { type: 'dim', text: '   Missing subcommand. Try: ghb help' })
        break

      // ── ghb help ─────────────────────────────────────────────────────────
      case 'help':
        push(echo, {
          type: 'typewriter',
          lines: [
            '┌──────────────────────────────────────────────┐',
            '│  GHB COMMAND REFERENCE  ·  v1.0.0            │',
            '├──────────────────────────────────────────────┤',
            '│                                              │',
            '│  ghb help                                    │',
            '│    → Print this reference                    │',
            '│                                              │',
            '│  ghb sprite [player|fish|leaf]               │',
            '│    → Spawn an 8-bit entity on the canvas     │',
            '│                                              │',
            '│  ghb theme [neon|moss|dark]                  │',
            '│    → Switch the terminal color palette       │',
            '│                                              │',
            '│  ghb physics --gravity [0 – 10]              │',
            '│    → Tune gravitational pull for sprites     │',
            '│                                              │',
            '│  ghb clear                                   │',
            '│    → Flush the terminal log buffer           │',
            '│                                              │',
            '└──────────────────────────────────────────────┘',
          ],
        })
        break

      // ── ghb sprite ───────────────────────────────────────────────────────
      case 'sprite': {
        const type  = parts[1]
        const valid = ['player', 'fish', 'leaf']
        if (!valid.includes(type)) {
          push(
            echo,
            { type: 'error', text: `❌ Unknown entity type: "${type ?? '(none)'}"` },
            { type: 'dim',   text: `   Valid targets: ${valid.join('  ')}` }
          )
          break
        }
        const sprite = {
          id:  `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type,
          // Random position near the top of the canvas
          x:   50 + Math.random() * 200,
          y:   8  + Math.random() * 32,
          vx:  (Math.random() - 0.5) * 4,
          vy:  0,
        }
        setSprites(prev => [...prev.slice(-11), sprite]) // max 12 on screen
        push(echo, { type: 'success', text: `✓ Entity "${type}" deployed to canvas viewport.` })
        break
      }

      // ── ghb theme ────────────────────────────────────────────────────────
      case 'theme': {
        const t = parts[1]
        if (!THEMES[t]) {
          push(
            echo,
            { type: 'error', text: `❌ Unknown palette: "${t ?? '(none)'}"` },
            { type: 'dim',   text: `   Available palettes: neon  moss  dark` }
          )
          break
        }
        setTheme(t)
        push(echo, { type: 'success', text: `✓ Palette "${t}" applied. Recalibrating phosphor layers...` })
        break
      }

      // ── ghb physics ──────────────────────────────────────────────────────
      case 'physics': {
        const flag = parts[1]
        if (flag !== '--gravity') {
          push(
            echo,
            { type: 'error', text: `❌ Unknown modifier: "${flag ?? '(none)'}"` },
            { type: 'dim',   text: `   Usage: ghb physics --gravity [0 – 10]` }
          )
          break
        }
        const val = parseFloat(parts[2])
        if (isNaN(val) || val < 0 || val > 10) {
          push(
            echo,
            { type: 'error', text: `❌ Gravity must be a number in [0 – 10]. Got: "${parts[2] ?? '(none)'}"` },
            { type: 'dim',   text: `   Current value: ${gravity.toFixed(2)}` }
          )
          break
        }
        setGravity(val)
        const tag =
          val === 0   ? '[ zero-g mode ]'   :
          val < 0.15  ? '[ moon walking ]'  :
          val < 0.5   ? '[ nominal ]'       :
          val < 1.5   ? '[ heavy world ]'   :
                        '[ MAX CRUSH ]'
        push(echo, { type: 'success', text: `✓ Gravity set to ${val} ${tag}` })
        break
      }

      // ── ghb clear ────────────────────────────────────────────────────────
      case 'clear':
        setLog([{ type: 'dim', text: '// Log buffer flushed.' }])
        break

      // ── unknown ──────────────────────────────────────────────────────────
      default:
        push(
          echo,
          { type: 'error', text: `❌ Unrecognized command: "ghb ${cmd}"` },
          { type: 'dim',   text: `   Run 'ghb help' for a list of valid protocols.` }
        )
    }
  }, [gravity, push])

  const colors = THEMES[theme]

  // Expose theme tokens as CSS custom properties so terminal + canvas
  // both pick up changes with a single CSS transition
  const cssVars = {
    '--dev-bg':       colors.bg,
    '--dev-canvas-bg': colors.canvasBg,
    '--dev-text':     colors.text,
    '--dev-accent':   colors.accent,
    '--dev-dim':      colors.dim,
    '--dev-border':   colors.border,
    '--dev-error':    colors.error,
    '--dev-success':  colors.success,
  }

  return (
    <section id="dev" className="dev-section wrap" style={cssVars}>
      <div className="dev-head">
        <h2>_dev<span className="dev-blink">&gt;</span></h2>
        <p className="dev-sub">
          Retro terminal + 8-bit canvas. All commands require the{' '}
          <code>ghb</code> authorization prefix.
        </p>
      </div>

      <div className="dev-split">
        <TerminalPanel log={log} onCommand={handleCommand} />
        <GameCanvas sprites={sprites} gravity={gravity} colors={colors} />
      </div>
    </section>
  )
}
