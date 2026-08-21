// ─── Procedural street ambience ──────────────────────────────────────────────
// Everything below is synthesised at runtime with the Web Audio API: a low
// traffic rumble, rain on glass, the occasional distant horn and a car passing
// under the window. Nothing is sampled, so the layer carries no licence of its
// own and mixes live over whatever the music player is doing.
//
// The graph, once started:
//
//   noise ─┬─ lowpass 320   ─ trafficGain ─┐
//          └─ bandpass 1.4k ─ rainGain    ─┤
//   horns ─── bandpass ── distance lowpass ┼─ master ─ destination
//   passby ── bandpass sweep ──────────────┘

const HORN_MIN_GAP = 7
const HORN_MAX_GAP = 23
const PASSBY_MIN_GAP = 9
const PASSBY_MAX_GAP = 26

const rand = (min, max) => min + Math.random() * (max - min)

// Two seconds of noise, looped. `brown` integrates white noise into the low
// rumble a street has; plain white is left for the rain.
function makeNoiseBuffer(ctx, brown) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1
    if (brown) {
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    } else {
      data[i] = white
    }
  }
  return buffer
}

export function createCityAmbience() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null

  const ctx = new Ctx()
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // ── Traffic rumble ────────────────────────────────────────────────────────
  const traffic = ctx.createBufferSource()
  traffic.buffer = makeNoiseBuffer(ctx, true)
  traffic.loop = true
  const trafficFilter = ctx.createBiquadFilter()
  trafficFilter.type = 'lowpass'
  trafficFilter.frequency.value = 320
  const trafficGain = ctx.createGain()
  trafficGain.gain.value = 0.5
  traffic.connect(trafficFilter).connect(trafficGain).connect(master)

  // ── Rain on the glass ─────────────────────────────────────────────────────
  const rain = ctx.createBufferSource()
  rain.buffer = makeNoiseBuffer(ctx, false)
  rain.loop = true
  const rainFilter = ctx.createBiquadFilter()
  rainFilter.type = 'bandpass'
  rainFilter.frequency.value = 1400
  rainFilter.Q.value = 0.6
  const rainGain = ctx.createGain()
  rainGain.gain.value = 0 // raised only in badal mode
  rain.connect(rainFilter).connect(rainGain).connect(master)

  traffic.start()
  rain.start()

  let timers = []
  let stopped = false

  const later = (fn, seconds) => {
    const id = setTimeout(fn, seconds * 1000)
    timers.push(id)
  }

  // A horn is two detuned saw waves a rough minor third apart — that interval is
  // what makes a car horn read as a car horn — pushed through a bandpass and
  // then a low-pass that stands in for the distance down to the street.
  function honk(when, hold) {
    const root = rand(370, 480)
    const shape = ctx.createBiquadFilter()
    shape.type = 'bandpass'
    shape.frequency.value = root * 2
    shape.Q.value = 1.1
    const distance = ctx.createBiquadFilter()
    distance.type = 'lowpass'
    distance.frequency.value = rand(700, 1300)
    const gain = ctx.createGain()
    const pan = ctx.createStereoPanner()
    pan.pan.value = rand(-0.8, 0.8)

    const peak = rand(0.05, 0.13)
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.035)
    gain.gain.setValueAtTime(peak, when + hold)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + hold + 0.22)

    shape.connect(distance).connect(gain).connect(pan).connect(master)

    ;[root, root * 1.19].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = i === 0 ? 'sawtooth' : 'square'
      osc.frequency.value = freq
      osc.connect(shape)
      osc.start(when)
      osc.stop(when + hold + 0.3)
    })
  }

  function scheduleHorns() {
    if (stopped) return
    later(() => {
      const now = ctx.currentTime
      const blasts = Math.random() < 0.35 ? 2 + Math.floor(Math.random() * 2) : 1
      for (let i = 0; i < blasts; i += 1) {
        honk(now + i * rand(0.28, 0.5), rand(0.12, 0.42))
      }
      scheduleHorns()
    }, rand(HORN_MIN_GAP, HORN_MAX_GAP))
  }

  // A car crossing under the window: noise swept through a moving bandpass,
  // panned left→right (or right→left).
  function schedulePassby() {
    if (stopped) return
    later(() => {
      const now = ctx.currentTime
      const dur = rand(1.8, 3.4)
      const src = ctx.createBufferSource()
      src.buffer = makeNoiseBuffer(ctx, true)
      const band = ctx.createBiquadFilter()
      band.type = 'bandpass'
      band.Q.value = 0.9
      band.frequency.setValueAtTime(240, now)
      band.frequency.linearRampToValueAtTime(rand(700, 1100), now + dur * 0.5)
      band.frequency.linearRampToValueAtTime(200, now + dur)
      const gain = ctx.createGain()
      const peak = rand(0.06, 0.14)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.linearRampToValueAtTime(peak, now + dur * 0.5)
      gain.gain.linearRampToValueAtTime(0.0001, now + dur)
      const pan = ctx.createStereoPanner()
      const dir = Math.random() < 0.5 ? -1 : 1
      pan.pan.setValueAtTime(-dir, now)
      pan.pan.linearRampToValueAtTime(dir, now + dur)

      src.connect(band).connect(gain).connect(pan).connect(master)
      src.start(now)
      src.stop(now + dur + 0.1)
      schedulePassby()
    }, rand(PASSBY_MIN_GAP, PASSBY_MAX_GAP))
  }

  scheduleHorns()
  schedulePassby()

  return {
    // Browsers hand back a suspended context until a user gesture unlocks it.
    resume: () => ctx.resume(),
    suspend: () => ctx.suspend(),
    setLevel(value) {
      master.gain.setTargetAtTime(Math.max(0, Math.min(1, value)), ctx.currentTime, 0.4)
    },
    // Badal trades some engine rumble for rain against the glass.
    setMode(mode) {
      const wet = mode === 'badal'
      rainGain.gain.setTargetAtTime(wet ? 0.35 : 0, ctx.currentTime, 1.2)
      trafficGain.gain.setTargetAtTime(wet ? 0.32 : 0.5, ctx.currentTime, 1.2)
      trafficFilter.frequency.setTargetAtTime(wet ? 220 : 320, ctx.currentTime, 1.2)
    },
    destroy() {
      stopped = true
      timers.forEach(clearTimeout)
      timers = []
      ctx.close()
    }
  }
}
