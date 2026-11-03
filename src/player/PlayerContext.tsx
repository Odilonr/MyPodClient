import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as api from '@/api/client'
import type { Episode } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'

const SAVE_EVERY_MS = 5000
const VOLUME_KEY = 'mypod-volume'
// Near the end of an episode, start again instead of resuming.
const END_MARGIN_SECONDS = 2

function readSavedVolume () {
  try {
    const saved = Number(localStorage.getItem(VOLUME_KEY))
    return saved >= 0 && saved <= 1 && localStorage.getItem(VOLUME_KEY) !== null ? saved : 0.7
  } catch {
    return 0.7
  }
}

interface PlayerValue {
  episode: Episode | null
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  message: string | null
  playEpisode: (episode: Episode) => Promise<void>
  togglePlay: () => void
  seek: (seconds: number) => void
  skip: (seconds: number) => void
  setVolume: (volume: number) => void
}

const PlayerContext = createContext<PlayerValue | null>(null)

export function PlayerProvider ({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const signedIn = status === 'signed-in'

  const audioRef = useRef<HTMLAudioElement>(null)
  const startAtRef = useRef(0)
  const latestRequestRef = useRef(0)

  const [episode, setEpisode] = useState<Episode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(readSavedVolume)
  const [message, setMessage] = useState<string | null>(null)

  const savePosition = useCallback(async (episodeId: string, seconds: number) => {
    if (!signedIn) return
    try {
      await api.savePlayPosition(episodeId, seconds)
    } catch {
      setMessage('Your place could not be saved. Check your connection.')
    }
  }, [signedIn])

  const playEpisode = useCallback(async (next: Episode) => {
    const audio = audioRef.current
    if (!audio) return
    const request = ++latestRequestRef.current

    if (episode) await savePosition(episode.id, audio.currentTime)

    setIsLoading(true)
    setMessage(null)
    let startAt = 0
    if (signedIn) {
      try {
        startAt = await api.getPlayPosition(next.id)
      } catch {
        setMessage('Your saved place could not be loaded, so this starts from the beginning.')
      }
    }
    // Another episode was chosen while this one was loading.
    if (request !== latestRequestRef.current) return

    setEpisode(next)
    setCurrentTime(startAt)
    setDuration(next.duration ?? 0)
    startAtRef.current = startAt
    audio.src = api.audioUrl(next.id)
    try {
      await audio.play()
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') setMessage('Press play to start listening.')
    }
  }, [episode, savePosition, signedIn])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !episode) return
    if (audio.paused) {
      audio.play().catch(() => setMessage('This episode could not be played.'))
    } else {
      audio.pause()
    }
  }, [episode])

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio || !episode) return
    const limit = Number.isFinite(audio.duration) ? audio.duration : duration
    const next = Math.min(Math.max(0, seconds), limit)
    audio.currentTime = next
    setCurrentTime(next)
  }, [duration, episode])

  const skip = useCallback((seconds: number) => {
    if (audioRef.current) seek(audioRef.current.currentTime + seconds)
  }, [seek])

  const setVolume = useCallback((next: number) => {
    setVolumeState(next)
    try {
      localStorage.setItem(VOLUME_KEY, String(next))
    } catch {
      // Volume still works for this visit when browser storage is blocked.
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // While playing, save the place every few seconds.
  useEffect(() => {
    if (!isPlaying || !episode || !signedIn) return
    const timer = setInterval(() => {
      if (audioRef.current) savePosition(episode.id, audioRef.current.currentTime)
    }, SAVE_EVERY_MS)
    return () => clearInterval(timer)
  }, [episode, isPlaying, savePosition, signedIn])

  const value = useMemo(() => ({
    episode, isPlaying, isLoading, currentTime, duration, volume, message,
    playEpisode, togglePlay, seek, skip, setVolume
  }), [episode, isPlaying, isLoading, currentTime, duration, volume, message, playEpisode, togglePlay, seek, skip, setVolume])

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={(event) => {
          setIsPlaying(false)
          if (episode && !event.currentTarget.ended) savePosition(episode.id, event.currentTarget.currentTime)
        }}
        onEnded={() => {
          setIsPlaying(false)
          if (episode) savePosition(episode.id, 0)
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget
          setDuration(audio.duration)
          if (startAtRef.current > 0 && startAtRef.current < audio.duration - END_MARGIN_SECONDS) {
            audio.currentTime = startAtRef.current
          }
          startAtRef.current = 0
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setIsPlaying(false)
          setMessage('This episode could not be played.')
        }}
      />
    </PlayerContext.Provider>
  )
}

export function usePlayer () {
  const value = useContext(PlayerContext)
  if (!value) throw new Error('usePlayer must be used inside PlayerProvider')
  return value
}
