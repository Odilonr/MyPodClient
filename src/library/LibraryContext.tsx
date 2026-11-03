import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from '@/api/client'
import type { Episode, Playlist, RecentEpisode } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'

interface LibraryValue {
  favorites: Episode[]
  playlists: Playlist[]
  recent: RecentEpisode[]
  notice: string | null
  newPlaylistFor: { episode: Episode | null } | null
  isFavorite: (episodeId: string) => boolean
  toggleFavorite: (episode: Episode) => Promise<void>
  refreshRecent: () => Promise<void>
  refreshPlaylists: () => Promise<void>
  openNewPlaylist: (episode?: Episode) => void
  closeNewPlaylist: () => void
  createPlaylist: (name: string, episode?: Episode | null) => Promise<void>
  addToPlaylist: (playlist: Playlist, episode: Episode) => Promise<void>
  deletePlaylist: (id: string) => Promise<void>
}

const LibraryContext = createContext<LibraryValue | null>(null)

export function LibraryProvider ({ children }: { children: ReactNode }) {
  const { status, openDialog } = useAuth()
  const signedIn = status === 'signed-in'

  const [favorites, setFavorites] = useState<Episode[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [recent, setRecent] = useState<RecentEpisode[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [newPlaylistFor, setNewPlaylistFor] = useState<{ episode: Episode | null } | null>(null)

  const refreshRecent = useCallback(async () => {
    if (signedIn) setRecent(await api.getRecentEpisodes())
  }, [signedIn])

  const refreshPlaylists = useCallback(async () => {
    if (signedIn) setPlaylists(await api.getPlaylists())
  }, [signedIn])

  useEffect(() => {
    if (!signedIn) {
      setFavorites([])
      setPlaylists([])
      setRecent([])
      return
    }
    Promise.all([api.getFavorites(), api.getPlaylists(), api.getRecentEpisodes()])
      .then(([nextFavorites, nextPlaylists, nextRecent]) => {
        setFavorites(nextFavorites)
        setPlaylists(nextPlaylists)
        setRecent(nextRecent)
      })
      .catch(() => setNotice('Your library could not be loaded. Check your connection.'))
  }, [signedIn])

  const showNotice = useCallback((text: string) => {
    setNotice(text)
    setTimeout(() => setNotice((current) => (current === text ? null : current)), 4000)
  }, [])

  const isFavorite = useCallback((episodeId: string) => favorites.some((episode) => episode.id === episodeId), [favorites])

  const toggleFavorite = useCallback(async (episode: Episode) => {
    if (!signedIn) {
      openDialog('log-in')
      return
    }
    const wasFavorite = isFavorite(episode.id)
    const previous = favorites
    setFavorites(wasFavorite ? favorites.filter((item) => item.id !== episode.id) : [episode, ...favorites])
    try {
      await (wasFavorite ? api.removeFavorite(episode.id) : api.addFavorite(episode.id))
    } catch {
      setFavorites(previous)
      showNotice('Favorites could not be updated. Try again.')
    }
  }, [favorites, isFavorite, openDialog, showNotice, signedIn])

  const openNewPlaylist = useCallback((episode?: Episode) => {
    if (!signedIn) {
      openDialog('log-in')
      return
    }
    setNewPlaylistFor({ episode: episode ?? null })
  }, [openDialog, signedIn])

  const closeNewPlaylist = useCallback(() => setNewPlaylistFor(null), [])

  const createPlaylist = useCallback(async (name: string, episode?: Episode | null) => {
    const playlist = await api.createPlaylist(name)
    if (episode) await api.addToPlaylist(playlist.id, episode.id)
    await refreshPlaylists()
    showNotice(episode ? `Added to ${playlist.name}` : `Created ${playlist.name}`)
  }, [refreshPlaylists, showNotice])

  const addToPlaylist = useCallback(async (playlist: Playlist, episode: Episode) => {
    try {
      await api.addToPlaylist(playlist.id, episode.id)
      await refreshPlaylists()
      showNotice(`Added to ${playlist.name}`)
    } catch {
      showNotice(`The episode could not be added to ${playlist.name}. Try again.`)
    }
  }, [refreshPlaylists, showNotice])

  const deletePlaylist = useCallback(async (id: string) => {
    await api.deletePlaylist(id)
    await refreshPlaylists()
  }, [refreshPlaylists])

  const value = useMemo(() => ({
    favorites, playlists, recent, notice, newPlaylistFor, isFavorite, toggleFavorite, refreshRecent,
    refreshPlaylists, openNewPlaylist, closeNewPlaylist, createPlaylist, addToPlaylist, deletePlaylist
  }), [favorites, playlists, recent, notice, newPlaylistFor, isFavorite, toggleFavorite, refreshRecent,
    refreshPlaylists, openNewPlaylist, closeNewPlaylist, createPlaylist, addToPlaylist, deletePlaylist])

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary () {
  const value = useContext(LibraryContext)
  if (!value) throw new Error('useLibrary must be used inside LibraryProvider')
  return value
}
