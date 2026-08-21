// MX playlist. Files live in /public/mx so they stream (and seek) straight from
// the server instead of being inlined into the JS bundle — drop a new mp3 in
// there and add a row here to swap the soundtrack.
export const TRACKS = [
  {
    id: 'badal-barsha-bijuli',
    title: 'Badal Barsha Bijuli',
    artist: 'Ananda Karki · Prashna Shakya',
    src: '/mx/badal-barsha-bijuli.mp3',
    artwork: '/mx/office-badal.png',
    mode: 'badal'
  },
  {
    id: 'parkhi-base-aaula-bhani',
    title: 'Parkhi Base Aaula Bhani',
    artist: 'Narayan Gopal',
    src: '/mx/parkhi-base-aaula-bhani.mp3',
    artwork: '/mx/office-clear.png',
    mode: 'clear'
  }
]

export const findTrackIndex = (id) => {
  const i = TRACKS.findIndex((t) => t.id === id)
  return i === -1 ? 0 : i
}
