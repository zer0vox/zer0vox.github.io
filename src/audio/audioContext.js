import { createContext, useContext } from 'react'

export const AudioCtx = createContext(null)

export function useAudio() {
  const value = useContext(AudioCtx)
  if (!value) throw new Error('useAudio must be used inside <AudioProvider>')
  return value
}
