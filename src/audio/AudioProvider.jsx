import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AudioCtx } from './audioContext'
import { TRACKS, findTrackIndex } from './tracks'
import { createCityAmbience } from './cityAmbience'

const STORE_KEY = 'mx.audio.v1'

// One <audio> element for the whole app. It is mounted here, above the router,
// so navigating between routes never tears it down — that is what keeps the
// music running after you leave /mx.

function readStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStored(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state))
  } catch {
    // Private mode / quota. Playback still works, it just isn't remembered.
  }
}

export default function AudioProvider({ children }) {
  const audioRef = useRef(null)
  const ambienceRef = useRef(null)
  const [stored] = useState(readStored)

  const [index, setIndex] = useState(() => (stored?.trackId ? findTrackIndex(stored.trackId) : 0))
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(stored?.position ?? 0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(stored?.volume ?? 0.7)
  const [muted, setMuted] = useState(stored?.muted ?? false)
  const [ambience, setAmbienceState] = useState(stored?.ambience ?? 0.35)
  const [mode, setModeState] = useState(stored?.mode === 'clear' ? 'clear' : 'badal')
  // Stays false until the first successful play(), so a mini-player never shows
  // up on a cold load where nothing has actually been heard yet.
  const [engaged, setEngaged] = useState(false)

  const track = TRACKS[index]

  // Position to restore once the file reports its duration.
  const pendingSeek = useRef(stored?.position ?? 0)

  // Mirror level state onto the element. Autoplay is deliberately never forced
  // here: the element is primed and waits for a click, which is what browser
  // autoplay policy expects.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.muted = muted
  }, [volume, muted])

  // ── Persistence ───────────────────────────────────────────────────────────
  const persist = useCallback(() => {
    writeStored({
      trackId: TRACKS[index]?.id,
      position: audioRef.current?.currentTime ?? 0,
      volume,
      muted,
      ambience,
      mode
    })
  }, [index, volume, muted, ambience, mode])

  useEffect(() => {
    persist()
  }, [persist])

  useEffect(() => {
    const onLeave = () => persist()
    window.addEventListener('pagehide', onLeave)
    document.addEventListener('visibilitychange', onLeave)
    return () => {
      window.removeEventListener('pagehide', onLeave)
      document.removeEventListener('visibilitychange', onLeave)
    }
  }, [persist])

  // pagehide covers an ordinary navigation away, but not a crash or a killed
  // tab — so the position is also written down every few seconds while playing.
  useEffect(() => {
    if (!isPlaying) return undefined
    const id = setInterval(persist, 5000)
    return () => clearInterval(id)
  }, [isPlaying, persist])

  // ── Street ambience, built lazily on the first play ───────────────────────
  const ensureAmbience = useCallback(() => {
    if (!ambienceRef.current) {
      ambienceRef.current = createCityAmbience()
      ambienceRef.current?.setMode(mode)
    }
    return ambienceRef.current
  }, [mode])

  useEffect(() => () => ambienceRef.current?.destroy(), [])

  useEffect(() => {
    ambienceRef.current?.setMode(mode)
  }, [mode])

  useEffect(() => {
    ambienceRef.current?.setLevel(muted ? 0 : ambience)
  }, [ambience, muted])

  // The street follows the music. resume() also lives in play() because a
  // suspended AudioContext may only be unlocked from inside a user gesture.
  useEffect(() => {
    if (!isPlaying) ambienceRef.current?.suspend()
  }, [isPlaying])

  // ── Transport ─────────────────────────────────────────────────────────────
  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      await audio.play()
      setEngaged(true)
      const amb = ensureAmbience()
      await amb?.resume()
      amb?.setLevel(muted ? 0 : ambience)
    } catch {
      // Blocked by autoplay policy, or the file is still loading. Remaining
      // paused is the right outcome — the control simply stays a play button.
      setIsPlaying(false)
    }
  }, [ambience, muted, ensureAmbience])

  const pause = useCallback(() => audioRef.current?.pause(), [])

  const toggle = useCallback(() => {
    if (audioRef.current?.paused) play()
    else pause()
  }, [play, pause])

  const selectTrack = useCallback(
    (nextIndex, { autoplay = true } = {}) => {
      const wrapped = (nextIndex + TRACKS.length) % TRACKS.length
      const audio = audioRef.current
      pendingSeek.current = 0
      setCurrentTime(0)

      if (wrapped === index) {
        // Same file: nothing will reload, so just take it from the top.
        if (audio) audio.currentTime = 0
        if (autoplay) play()
        return
      }

      setIndex(wrapped)
      if (audio && autoplay) {
        // React swaps the src on the next render; start once it can play.
        audio.addEventListener('loadeddata', () => play(), { once: true })
      }
    },
    [play, index]
  )

  const next = useCallback(() => selectTrack(index + 1), [index, selectTrack])

  const previous = useCallback(() => {
    // As in every real player: a few seconds in, "previous" restarts the track.
    if ((audioRef.current?.currentTime ?? 0) > 4) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
      return
    }
    selectTrack(index - 1)
  }, [index, selectTrack])

  const seek = useCallback((seconds) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(seconds)) return
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || 0))
    setCurrentTime(audio.currentTime)
  }, [])

  const setVolume = useCallback((value) => {
    const clamped = Math.max(0, Math.min(1, value))
    setVolumeState(clamped)
    // Dragging the slider up is an unmute in every player anyone has used.
    if (clamped > 0) setMuted(false)
  }, [])

  const toggleMute = useCallback(() => setMuted((m) => !m), [])

  const setAmbience = useCallback((value) => {
    setAmbienceState(Math.max(0, Math.min(1, value)))
  }, [])

  const setMode = useCallback((value) => setModeState(value === 'clear' ? 'clear' : 'badal'), [])
  const toggleMode = useCallback(() => setModeState((m) => (m === 'badal' ? 'clear' : 'badal')), [])

  // ── Media Session ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track || !window.MediaMetadata) return
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'MX — after office hours',
      artwork: [{ src: track.artwork, sizes: '512x512', type: 'image/png' }]
    })
  }, [track])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const handlers = [
      ['play', () => play()],
      ['pause', () => pause()],
      ['previoustrack', () => previous()],
      ['nexttrack', () => next()],
      ['seekto', (details) => details.seekTime != null && seek(details.seekTime)]
    ]
    handlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // Action unsupported in this browser.
      }
    })
    return () => {
      handlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null)
        } catch {
          // Nothing to clear.
        }
      })
    }
  }, [play, pause, previous, next, seek])

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }
  }, [isPlaying])

  // ── Element events ────────────────────────────────────────────────────────
  const onLoadedMetadata = (event) => {
    const audio = event.currentTarget
    setDuration(audio.duration || 0)
    if (pendingSeek.current > 0 && pendingSeek.current < audio.duration) {
      audio.currentTime = pendingSeek.current
      setCurrentTime(pendingSeek.current)
    }
    pendingSeek.current = 0
  }

  const value = useMemo(
    () => ({
      tracks: TRACKS,
      track,
      index,
      isPlaying,
      currentTime,
      duration,
      volume,
      muted,
      ambience,
      mode,
      engaged,
      play,
      pause,
      toggle,
      next,
      previous,
      seek,
      selectTrack,
      setVolume,
      toggleMute,
      setAmbience,
      setMode,
      toggleMode
    }),
    [
      track,
      index,
      isPlaying,
      currentTime,
      duration,
      volume,
      muted,
      ambience,
      mode,
      engaged,
      play,
      pause,
      toggle,
      next,
      previous,
      seek,
      selectTrack,
      setVolume,
      toggleMute,
      setAmbience,
      setMode,
      toggleMode
    ]
  )

  return (
    <AudioCtx.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={track?.src}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={next}
      />
    </AudioCtx.Provider>
  )
}
