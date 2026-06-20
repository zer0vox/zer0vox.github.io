import { useRef, useEffect } from 'react'

const SCALE = 4 // canvas pixels per sprite pixel

/*
 * Sprite pixel art.
 * Color key:
 *   A = spriteA (primary theme accent)
 *   B = spriteB (secondary theme color)
 *   C = spriteC (tertiary theme color)
 *   S = skin tone  (#ffca94 — fixed)
 *   e = eye / pupil (#0a0614 — fixed)
 *   n = neutral / boot (#4a3020 — fixed)
 *   . = transparent
 */
const SPRITE_DEFS = {
  player: [
    '..AAAA..',
    '.AAAAAA.',
    '.SSSSSS.',
    '.SeSeSe.',
    '.SSSSSS.',
    '.BBBBBB.',
    'BBBBBBBB',
    '.BB..BB.',
    '.CC..CC.',
    '.CC..CC.',
    '.nn..nn.',
    '.nn..nn.',
  ],
  fish: [
    '..B.AAAA..',
    'BB..AAAAA.',
    '.B.eAAAAA.',
    'BB..AAAAA.',
    '..B.AAAA..',
  ],
  leaf: [
    '....A....',
    '...AAA...',
    '..AAAAA..',
    '.AAAAAAA.',
    '..BBBBB..',
    '...BBB...',
    '....n....',
    '....n....',
    '....n....',
  ],
}

function buildColorMap(colors) {
  return {
    A: colors.spriteA,
    B: colors.spriteB,
    C: colors.spriteC,
    S: '#ffca94',
    e: '#0a0614',
    n: '#4a3020',
    '.': null,
  }
}

function drawSprite(ctx, type, sx, sy, colorMap) {
  const rows = SPRITE_DEFS[type]
  rows.forEach((row, ry) => {
    for (let cx = 0; cx < row.length; cx++) {
      const fill = colorMap[row[cx]]
      if (!fill) continue
      ctx.fillStyle = fill
      ctx.fillRect(
        Math.round(sx) + cx * SCALE,
        Math.round(sy) + ry * SCALE,
        SCALE,
        SCALE
      )
    }
  })
}

function spriteSize(type) {
  const rows = SPRITE_DEFS[type]
  return { w: rows[0].length * SCALE, h: rows.length * SCALE }
}

export default function GameCanvas({ sprites, gravity, colors }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  // All mutable game state lives here — read by the RAF loop every tick
  const stateRef = useRef({ sprites: [], gravity })
  const colorsRef = useRef(colors)

  // Keep refs in sync with props without restarting the loop
  useEffect(() => { colorsRef.current = colors }, [colors])
  useEffect(() => { stateRef.current.gravity = gravity }, [gravity])

  // Merge incoming sprite list with live physics state
  useEffect(() => {
    const prev = stateRef.current.sprites
    stateRef.current.sprites = sprites.map(
      s => prev.find(p => p.id === s.id) ?? { ...s }
    )
  }, [sprites])

  // One-shot game loop — never re-created so no stale closure issues
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const tick = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(tick); return }

      const c    = colorsRef.current
      const cmap = buildColorMap(c)
      const { sprites: spr, gravity: g } = stateRef.current
      const W = canvas.width
      const H = canvas.height

      // Background fill
      ctx.fillStyle = c.canvasBg
      ctx.fillRect(0, 0, W, H)

      // Subtle pixel grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y < H; y += 16) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // Physics + render each sprite
      spr.forEach(s => {
        s.vy += g
        s.x  += s.vx
        s.y  += s.vy

        const { w, h } = spriteSize(s.type)

        // Floor bounce
        if (s.y + h >= H) {
          s.y   = H - h
          s.vy *= -0.7
          s.vx *= 0.88        // friction
          if (Math.abs(s.vy) < 0.6) s.vy = 0
        }
        // Ceiling
        if (s.y < 0) {
          s.y  = 0
          s.vy = Math.abs(s.vy) * 0.45
        }
        // Left wall
        if (s.x < 0) {
          s.x  = 0
          s.vx = Math.abs(s.vx) * 0.72
        }
        // Right wall
        if (s.x + w > W) {
          s.x  = W - w
          s.vx = -Math.abs(s.vx) * 0.72
        }

        drawSprite(ctx, s.type, s.x, s.y, cmap)
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, []) // intentionally empty — loop reads fresh values via refs

  // Sync canvas pixel dimensions to its CSS display size
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const sync = () => {
      canvas.width  = canvas.offsetWidth  || 400
      canvas.height = canvas.offsetHeight || 380
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  const isEmpty = sprites.length === 0

  return (
    <div className="dev-canvas-outer">
      <div className="dev-console-bezel">

        <div className="dev-console-top-bar">
          <span className="dev-console-led" />
          <span className="dev-console-label">CANVAS.EXE ── SPRITE RENDERER</span>
        </div>

        <div className="dev-screen-wrap">
          <canvas ref={canvasRef} className="dev-canvas" aria-label="8-bit sprite canvas" />
          <div className="dev-scanlines" />
          {isEmpty && (
            <div className="dev-canvas-empty">
              <span className="dev-canvas-empty-main">[ AWAITING INPUT ]</span>
              <span className="dev-canvas-empty-hint">ghb sprite player</span>
            </div>
          )}
        </div>

        <div className="dev-console-bottom-bar">
          <span>SPRITES: {sprites.length}</span>
          <span>GRAVITY: {gravity.toFixed(2)}</span>
          <span>GHB RUNTIME v1.0</span>
        </div>

      </div>
    </div>
  )
}
