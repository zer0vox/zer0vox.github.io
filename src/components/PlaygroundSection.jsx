import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const GRID_COLUMNS = 10
const GRID_ROWS = 20
const LOCK_DELAY_MS = 500
const LINE_CLEAR_MS = 360
const LEVEL_LINES = 10
const MIN_SPEED_MS = 120
const BASE_SPEED_MS = 800
const STORAGE_KEY = 'tetrisHighScore'

const PIECES = {
  I: {
    states: [
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 1], [1, 1], [2, 1], [3, 1]],
      [[1, 0], [1, 1], [1, 2], [1, 3]]
    ],
    color: '#8abfff'
  },
  O: {
    states: [
      [[1, 1], [2, 1], [1, 2], [2, 2]],
      [[1, 1], [2, 1], [1, 2], [2, 2]],
      [[1, 1], [2, 1], [1, 2], [2, 2]],
      [[1, 1], [2, 1], [1, 2], [2, 2]]
    ],
    color: '#f7d14b'
  },
  T: {
    states: [
      [[1, 1], [0, 2], [1, 2], [2, 2]],
      [[1, 1], [1, 2], [2, 1], [1, 3]],
      [[0, 2], [1, 2], [2, 2], [1, 3]],
      [[1, 1], [0, 2], [1, 2], [1, 3]]
    ],
    color: '#c179ff'
  },
  S: {
    states: [
      [[1, 2], [2, 2], [0, 3], [1, 3]],
      [[1, 1], [1, 2], [2, 2], [2, 3]],
      [[1, 2], [2, 2], [0, 3], [1, 3]],
      [[1, 1], [1, 2], [2, 2], [2, 3]]
    ],
    color: '#7ee5a9'
  },
  Z: {
    states: [
      [[0, 2], [1, 2], [1, 3], [2, 3]],
      [[2, 1], [1, 2], [2, 2], [1, 3]],
      [[0, 2], [1, 2], [1, 3], [2, 3]],
      [[2, 1], [1, 2], [2, 2], [1, 3]]
    ],
    color: '#ff7a8d'
  },
  J: {
    states: [
      [[0, 1], [0, 2], [1, 2], [2, 2]],
      [[1, 1], [2, 1], [1, 2], [1, 3]],
      [[0, 2], [1, 2], [2, 2], [2, 3]],
      [[1, 1], [1, 2], [0, 3], [1, 3]]
    ],
    color: '#5fb8ff'
  },
  L: {
    states: [
      [[2, 1], [0, 2], [1, 2], [2, 2]],
      [[1, 1], [1, 2], [1, 3], [2, 3]],
      [[0, 2], [1, 2], [2, 2], [0, 3]],
      [[0, 1], [1, 1], [1, 2], [1, 3]]
    ],
    color: '#ffb36b'
  }
}

const SRS_KICKS = {
  normal: {
    cw: [
      [0, 0],
      [-1, 0],
      [-1, 1],
      [0, -2],
      [-1, -2]
    ],
    ccw: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, -2],
      [1, -2]
    ]
  },
  I: {
    cw: [
      [0, 0],
      [-2, 0],
      [1, 0],
      [-2, -1],
      [1, 2]
    ],
    ccw: [
      [0, 0],
      [-1, 0],
      [2, 0],
      [-1, 2],
      [2, -1]
    ]
  }
}

const SCORING = {
  lines: { 1: 100, 2: 300, 3: 500, 4: 800 },
  tspin: { 1: 800, 2: 1200, 3: 1600 }
}

function createEmptyBoard() {
  return Array.from({ length: GRID_ROWS }, () => Array(GRID_COLUMNS).fill(null))
}

function getPieceCells(piece) {
  return PIECES[piece.type].states[piece.rotation].map(([cx, cy]) => ({
    x: piece.x + cx,
    y: piece.y + cy
  }))
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

class GameEngine {
  constructor(onChange) {
    this.onChange = onChange
    this.board = createEmptyBoard()
    this.nextPiece = this.randomPiece()
    this.activePiece = null
    this.lockTimer = null
    this.clearTimer = null
    this.gravityTimer = null
    this.level = 1
    this.lines = 0
    this.score = 0
    this.combo = 0
    this.isPaused = false
    this.isGameOver = false
    this.lastAction = null
    this.isClearing = false
    this.spawnPiece()
  }

  randomPiece() {
    const types = Object.keys(PIECES)
    const type = types[Math.floor(Math.random() * types.length)]
    return { type, rotation: 0, x: 3, y: -1 }
  }

  spawnPiece() {
    this.activePiece = this.nextPiece
    this.nextPiece = this.randomPiece()
    if (!this.isValid(this.activePiece, 0, 0, this.activePiece.rotation)) {
      this.isGameOver = true
      this.saveHighScore()
    }
    this.lockTimer = null
    this.lastAction = null
    this.update()
  }

  isValid(piece, dx, dy, rotation) {
    const state = PIECES[piece.type].states[rotation]
    return state.every(([cx, cy]) => {
      const x = piece.x + dx + cx
      const y = piece.y + dy + cy
      if (x < 0 || x >= GRID_COLUMNS || y >= GRID_ROWS) return false
      return y < 0 || !this.board[y][x]
    })
  }

  move(dx, dy) {
    if (this.isPaused || this.isGameOver || this.isClearing) return
    if (this.isValid(this.activePiece, dx, dy, this.activePiece.rotation)) {
      this.activePiece.x += dx
      this.activePiece.y += dy
      if (dy > 0) this.lockTimer = null
      this.lastAction = dy > 0 ? 'softDrop' : 'move'
      this.update()
      return true
    }
    return false
  }

  rotate(direction) {
    if (this.isPaused || this.isGameOver || this.isClearing) return
    const piece = this.activePiece
    const nextRotation = (piece.rotation + (direction === 'cw' ? 1 : 3)) % 4
    const kicks = PIECES[piece.type] === PIECES.I ? SRS_KICKS.I : SRS_KICKS.normal
    for (const [kx, ky] of kicks[direction]) {
      if (this.isValid(piece, kx, ky, nextRotation)) {
        piece.rotation = nextRotation
        piece.x += kx
        piece.y += ky
        this.lastAction = 'rotate'
        this.lockTimer = null
        this.update()
        return
      }
    }
  }

  hardDrop() {
    if (this.isPaused || this.isGameOver || this.isClearing) return
    while (this.move(0, 1)) {}
    this.lockPiece()
  }

  getGhostPiece() {
    if (!this.activePiece) return null
    const ghost = { ...this.activePiece, x: this.activePiece.x, y: this.activePiece.y }
    while (this.isValid(ghost, 0, 1, ghost.rotation)) {
      ghost.y += 1
    }
    return ghost
  }

  getLevelSpeed() {
    return clamp(BASE_SPEED_MS - (this.level - 1) * 60, MIN_SPEED_MS, BASE_SPEED_MS)
  }

  tick() {
    if (this.isPaused || this.isGameOver || this.isClearing) return
    if (this.move(0, 1)) {
      this.scheduleGravity()
      return
    }
    if (!this.lockTimer) {
      this.lockTimer = window.performance.now()
      this.scheduleGravity()
      return
    }
    if (window.performance.now() - this.lockTimer >= LOCK_DELAY_MS) {
      this.lockPiece()
    } else {
      this.scheduleGravity()
    }
  }

  scheduleGravity() {
    window.clearTimeout(this.gravityTimer)
    this.gravityTimer = window.setTimeout(() => this.tick(), this.getLevelSpeed())
  }

  lockPiece() {
    const cells = getPieceCells(this.activePiece)
    cells.forEach(({ x, y }) => {
      if (y >= 0) {
        this.board[y][x] = {
          type: this.activePiece.type,
          color: PIECES[this.activePiece.type].color
        }
      }
    })
    const isTSpin = this.detectTSpin()
    const linesCleared = this.clearLines()
    if (!this.isGameOver && linesCleared === 0) {
      this.spawnPiece()
    } else if (!this.isGameOver) {
      this.spawnPiece()
    }
    this.lastAction = isTSpin ? 'tspin' : 'lock'
    this.update()
  }

  detectTSpin() {
    if (this.activePiece.type !== 'T' || this.lastAction !== 'rotate') return false
    const corners = [
      { x: this.activePiece.x, y: this.activePiece.y },
      { x: this.activePiece.x + 2, y: this.activePiece.y },
      { x: this.activePiece.x, y: this.activePiece.y + 2 },
      { x: this.activePiece.x + 2, y: this.activePiece.y + 2 }
    ]
    const occupied = corners.filter(({ x, y }) => {
      if (x < 0 || x >= GRID_COLUMNS || y < 0 || y >= GRID_ROWS) return true
      return !!this.board[y][x]
    }).length
    return occupied >= 3
  }

  clearLines() {
    const rowsToClear = []
    this.board.forEach((row, index) => {
      if (row.every(Boolean)) rowsToClear.push(index)
    })
    if (!rowsToClear.length) return 0

    this.isClearing = true
    const count = rowsToClear.length
    const isTSpin = this.activePiece.type === 'T' && this.lastAction === 'tspin'
    const points = isTSpin
      ? SCORING.tspin[count] || SCORING.tspin[1]
      : SCORING.lines[count] || 0

    this.score += points * this.level
    this.lines += count
    this.level = Math.floor(this.lines / LEVEL_LINES) + 1
    this.combo = this.combo + 1
    this.saveHighScore()

    this.update({
      overlayText: isTSpin ? `T-spin ${count}` : `${count}-line clear`,
      isClearing: true
    })

    this.clearTimer = window.setTimeout(() => {
      this.board = this.board
        .filter((_, index) => !rowsToClear.includes(index))
      while (this.board.length < GRID_ROWS) {
        this.board.unshift(Array(GRID_COLUMNS).fill(null))
      }
      this.isClearing = false
      this.update({ overlayText: '', isClearing: false })
    }, LINE_CLEAR_MS)

    return count
  }

  togglePause() {
    if (this.isGameOver) return
    this.isPaused = !this.isPaused
    if (!this.isPaused) {
      this.scheduleGravity()
    } else {
      window.clearTimeout(this.gravityTimer)
    }
    this.update({ overlayText: this.isPaused ? 'Paused' : '' })
  }

  restart() {
    window.clearTimeout(this.gravityTimer)
    window.clearTimeout(this.clearTimer)
    this.board = createEmptyBoard()
    this.level = 1
    this.lines = 0
    this.score = 0
    this.combo = 0
    this.isPaused = false
    this.isGameOver = false
    this.isClearing = false
    this.lastAction = null
    this.lockTimer = null
    this.spawnPiece()
    this.scheduleGravity()
  }

  saveHighScore() {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY) || 0)
    if (this.score > stored) {
      window.localStorage.setItem(STORAGE_KEY, String(this.score))
    }
  }

  update(overrides = {}) {
    const active = this.activePiece
      ? { ...this.activePiece, cells: getPieceCells(this.activePiece) }
      : null
    const next = this.nextPiece
      ? { ...this.nextPiece, cells: getPieceCells(this.nextPiece) }
      : null
    this.onChange({
      board: this.board,
      active,
      ghost: active ? getPieceCells(this.getGhostPiece()) : null,
      next,
      score: this.score,
      level: this.level,
      lines: this.lines,
      highScore: Number(window.localStorage.getItem(STORAGE_KEY) || 0),
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,
      isClearing: this.isClearing,
      overlayText: overrides.overlayText || '',
      lastAction: this.lastAction
    })
  }
}

class Renderer {
  constructor(boardCanvas, previewCanvas) {
    this.boardCanvas = boardCanvas
    this.previewCanvas = previewCanvas
    this.accent = '#a8c7ff'
    if (typeof window !== 'undefined') {
      this.accent = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim() || this.accent
    }
  }

  clear(ctx, width, height) {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#08090b'
    ctx.fillRect(0, 0, width, height)
  }

  drawBoard(state) {
    const canvas = this.boardCanvas
    if (!canvas || !state) return
    const ctx = canvas.getContext('2d')
    const ratio = window.devicePixelRatio || 1
    const width = canvas.clientWidth || 280
    const height = canvas.clientHeight || 560
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    const cellSize = Math.floor(Math.min(width / GRID_COLUMNS, height / GRID_ROWS))
    const boardWidth = cellSize * GRID_COLUMNS
    const boardHeight = cellSize * GRID_ROWS
    const offsetX = (width - boardWidth) / 2
    const offsetY = (height - boardHeight) / 2

    this.clear(ctx, width, height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.strokeRect(offsetX, offsetY, boardWidth, boardHeight)

    const drawCell = (x, y, fill, alpha = 1) => {
      ctx.globalAlpha = alpha
      ctx.fillStyle = fill
      ctx.fillRect(
        offsetX + x * cellSize + 1,
        offsetY + y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      )
      ctx.globalAlpha = 1
    }

    state.board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) drawCell(x, y, cell.color)
      })
    })

    if (state.ghost) {
      state.ghost.forEach(({ x, y }) => {
        if (y >= 0) drawCell(x, y, this.accent, 0.24)
      })
    }

    if (state.active) {
      state.active.cells.forEach(({ x, y }) => {
        if (y >= 0) drawCell(x, y, PIECES[state.active.type].color)
      })
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    for (let x = 1; x < GRID_COLUMNS; x++) {
      const px = offsetX + x * cellSize
      ctx.beginPath()
      ctx.moveTo(px, offsetY)
      ctx.lineTo(px, offsetY + boardHeight)
      ctx.stroke()
    }
    for (let y = 1; y < GRID_ROWS; y++) {
      const py = offsetY + y * cellSize
      ctx.beginPath()
      ctx.moveTo(offsetX, py)
      ctx.lineTo(offsetX + boardWidth, py)
      ctx.stroke()
    }
  }

  drawPreview(next) {
    const canvas = this.previewCanvas
    if (!canvas || !next) return
    const ctx = canvas.getContext('2d')
    const ratio = window.devicePixelRatio || 1
    const width = canvas.clientWidth || 160
    const height = canvas.clientHeight || 160
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    this.clear(ctx, width, height)
    const cellSize = Math.floor(Math.min(width / 6, height / 6))
    const offsetX = (width - cellSize * 4) / 2
    const offsetY = (height - cellSize * 4) / 2
    next.cells.forEach(({ x, y }) => {
      const px = x - 3
      const py = y - 1
      ctx.fillStyle = PIECES[next.type].color
      ctx.fillRect(
        offsetX + px * cellSize + 1,
        offsetY + py * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      )
    })
  }

  render(state) {
    if (!this.boardCanvas || !this.previewCanvas) return
    this.drawBoard(state)
    this.drawPreview(state.next)
  }
}

export default function PlaygroundSection() {
  const canvasRef = useRef(null)
  const previewRef = useRef(null)
  const engineRef = useRef(null)
  const rendererRef = useRef(null)
  const sectionRef = useRef(null)

  const [gameState, setGameState] = useState({
    board: createEmptyBoard(),
    active: null,
    ghost: null,
    next: null,
    score: 0,
    level: 1,
    lines: 0,
    highScore: 0,
    isPaused: false,
    isGameOver: false,
    isClearing: false,
    overlayText: ''
  })

  const [announce, setAnnounce] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const [autoPaused, setAutoPaused] = useState(false)

  const handleUpdate = useCallback((payload) => {
    setGameState((prev) => ({ ...prev, ...payload }))
  }, [])

  const startGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restart()
    } else {
      const engine = new GameEngine(handleUpdate)
      engineRef.current = engine
      engine.scheduleGravity()
    }
    setHasStarted(true)
    setAutoPaused(false)
  }, [handleUpdate])

  const resumeGame = useCallback(() => {
    const engine = engineRef.current
    if (engine && engine.isPaused) {
      engine.togglePause()
    }
    setAutoPaused(false)
  }, [])

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY) || 0)
    setGameState((prev) => ({ ...prev, highScore: stored }))
    rendererRef.current = new Renderer(canvasRef.current, previewRef.current)
    return () => {
      if (engineRef.current) {
        window.clearTimeout(engineRef.current.gravityTimer)
        window.clearTimeout(engineRef.current.clearTimer)
      }
    }
  }, [])

  useEffect(() => {
    if (!rendererRef.current) return
    rendererRef.current.render(gameState)
  }, [gameState])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        const engine = engineRef.current
        if (!engine || engine.isGameOver) return
        if (!entry.isIntersecting && !engine.isPaused) {
          engine.togglePause()
          setAutoPaused(true)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setAnnounce(
      `Score ${gameState.score}, level ${gameState.level}, ${gameState.lines} lines cleared.` +
        (gameState.isGameOver ? ' Game over.' : gameState.isPaused ? ' Paused.' : '')
    )
  }, [gameState.score, gameState.level, gameState.lines, gameState.isPaused, gameState.isGameOver])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!engineRef.current) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          startGame()
        }
        return
      }
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          engineRef.current.move(-1, 0)
          break
        case 'ArrowRight':
          event.preventDefault()
          engineRef.current.move(1, 0)
          break
        case 'ArrowDown':
          event.preventDefault()
          engineRef.current.move(0, 1)
          break
        case 'ArrowUp':
          event.preventDefault()
          engineRef.current.rotate('cw')
          break
        case ' ':
          event.preventDefault()
          engineRef.current.hardDrop()
          break
        case 'p':
        case 'P':
          event.preventDefault()
          engineRef.current.togglePause()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [startGame])

  const action = (name) => {
    const engine = engineRef.current
    if (!engine) return
    switch (name) {
      case 'left':
        engine.move(-1, 0)
        break
      case 'right':
        engine.move(1, 0)
        break
      case 'down':
        engine.move(0, 1)
        break
      case 'rotate':
        engine.rotate('cw')
        break
      case 'hard':
        engine.hardDrop()
        break
      case 'pause':
        engine.togglePause()
        break
      case 'restart':
        engine.restart()
        break
      default:
        break
    }
  }

  return (
    <motion.section
      ref={sectionRef}
      id="playground"
      className="blog-sect wrap"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
    >
      <div className="blog-head">
        <h2>Playground</h2>
        <p className="blog-sub">
          A responsive Tetris playground built into the site with keyboard controls, live scoring, and a visual game board that matches the existing section style.
        </p>
      </div>

      <div className="playground-grid">
        <div className="card playground-game-card">
          <div className="playground-canvas-frame">
            <canvas ref={canvasRef} width="280" height="560" aria-label="Tetris game board" />
            {!hasStarted ? (
              <div className="playground-overlay">
                <div className="playground-overlay-eyebrow">Tetris</div>
                <div className="playground-overlay-copy">Ready to play?</div>
                <button className="playground-overlay-button" type="button" onClick={startGame}>
                  Start Game
                </button>
              </div>
            ) : gameState.isGameOver ? (
              <div className="playground-overlay">
                <div className="playground-overlay-copy">Game Over</div>
                <button className="playground-overlay-button" type="button" onClick={startGame}>
                  Restart
                </button>
              </div>
            ) : gameState.isPaused ? (
              <div className="playground-overlay">
                {autoPaused && (
                  <div className="playground-overlay-eyebrow">Scrolled away</div>
                )}
                <div className="playground-overlay-copy">
                  {autoPaused ? 'Still there?' : 'Paused'}
                </div>
                {autoPaused ? (
                  <button className="playground-overlay-button" type="button" onClick={resumeGame}>
                    Continue
                  </button>
                ) : (
                  <button className="playground-overlay-button playground-overlay-button--ghost" type="button" onClick={() => action('pause')}>
                    Resume
                  </button>
                )}
              </div>
            ) : (gameState.isClearing && gameState.overlayText) ? (
              <div className="playground-overlay playground-overlay--flash">
                <div className="playground-overlay-copy">{gameState.overlayText}</div>
              </div>
            ) : null}
          </div>

          <div className="playground-controls">
            <div className="playground-control-row">
              <button type="button" onClick={() => action('left')} aria-label="Move left">←</button>
              <button type="button" onClick={() => action('rotate')} aria-label="Rotate">⟳</button>
              <button type="button" onClick={() => action('right')} aria-label="Move right">→</button>
            </div>
            <div className="playground-control-row">
              <button type="button" onClick={() => action('down')} aria-label="Soft drop">↓</button>
              <button type="button" onClick={() => action('hard')} aria-label="Hard drop">Space</button>
              <button type="button" onClick={() => action('pause')} aria-label="Pause">P</button>
            </div>
          </div>

          <dl className="playground-instructions">
            <div><dt>← →</dt><dd>Move</dd></div>
            <div><dt>↑</dt><dd>Rotate CW</dd></div>
            <div><dt>↓</dt><dd>Soft drop</dd></div>
            <div><dt>Space</dt><dd>Hard drop</dd></div>
            <div><dt>P</dt><dd>Pause</dd></div>
            <div><dt>Enter</dt><dd>Start / restart</dd></div>
          </dl>
        </div>

        <div className="playground-panel">
          <div className="card">
            <div className="meta">
              <div>
                <div className="t">Score</div>
                <div className="c">{gameState.score}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="meta">
              <div>
                <div className="t">Level</div>
                <div className="c">{gameState.level}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="meta">
              <div>
                <div className="t">Lines</div>
                <div className="c">{gameState.lines}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="meta">
              <div>
                <div className="t">High score</div>
                <div className="c">{gameState.highScore}</div>
              </div>
            </div>
          </div>

          <div className="card playground-preview-card">
            <div className="playground-preview-label">Next piece</div>
            <canvas ref={previewRef} width="160" height="160" aria-label="Next tetromino preview" />
          </div>
        </div>
      </div>

      <div role="status" aria-live="polite" className="playground-announcer">
        {announce}
      </div>
    </motion.section>
  )
}
