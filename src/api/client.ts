import { API_URL } from '@/config'
import type { Episode, FieldError, Playlist, PlaylistDetail, RecentEpisode, Show } from './types'

export class ApiError extends Error {
  status: number
  fields: FieldError[]

  constructor (status: number, message: string, fields: FieldError[] = []) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

// The access token lives only in this variable, so page scripts cannot find it
// in browser storage. The refresh token is in an httpOnly cookie that scripts
// cannot read at all.
let accessToken: string | null = null
let refreshInFlight: Promise<boolean> | null = null

async function send (path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (init.body) headers.set('Content-Type', 'application/json')
  return fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' })
}

async function readJson<T> (response: Response): Promise<T> {
  if (response.status === 204) return [] as T
  if (response.ok) return response.json() as Promise<T>
  const body = await response.json().catch(() => null)
  throw new ApiError(response.status, body?.message ?? 'The request failed', body?.error ?? [])
}

export function refreshSession (): Promise<boolean> {
  // Several requests can fail at once. They all wait for the same refresh.
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(`${API_URL}/user/refresh`, { method: 'POST', credentials: 'include' })
      if (!response.ok) {
        accessToken = null
        return false
      }
      accessToken = (await response.json()).accessToken
      return true
    } catch {
      accessToken = null
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

// Sends a request that needs a login. If the access token has expired, gets a
// new one and tries once more.
async function sendWithLogin (path: string, init: RequestInit = {}) {
  const response = await send(path, init)
  if ((response.status !== 401 && response.status !== 403) || !(await refreshSession())) {
    return response
  }
  return send(path, init)
}

export const hasSession = () => accessToken !== null

export async function logIn (username: string, password: string) {
  const response = await send('/user/auth', { method: 'POST', body: JSON.stringify({ username, password }) })
  accessToken = (await readJson<{ accessToken: string }>(response)).accessToken
}

export async function register (username: string, email: string, password: string) {
  const response = await send('/user/register', { method: 'POST', body: JSON.stringify({ username, email, password }) })
  await readJson(response)
}

export async function logOut () {
  await send('/user/logout', { method: 'POST' })
  accessToken = null
}

export async function getShows () {
  return readJson<Show[]>(await send('/shows'))
}

export async function getShow (id: string) {
  return readJson<Show>(await send(`/shows/${encodeURIComponent(id)}`))
}

export async function getShowEpisodes (id: string) {
  return readJson<Episode[]>(await send(`/shows/${encodeURIComponent(id)}/episodes`))
}

export async function getLatestEpisodes (limit = 8) {
  return readJson<Episode[]>(await send(`/episodes?type=Latest&limit=${limit}`))
}

export async function getPlayPosition (episodeId: string) {
  const response = await sendWithLogin(`/episodes/${encodeURIComponent(episodeId)}/timestamp`)
  return (await readJson<{ currentplaytime: number }>(response)).currentplaytime
}

export async function savePlayPosition (episodeId: string, seconds: number) {
  const query = new URLSearchParams({ episodeID: episodeId, new: String(Math.floor(seconds)) })
  await readJson(await sendWithLogin(`/episodes/updatetime?${query}`, { method: 'POST' }))
}

export async function getRecentEpisodes () {
  return readJson<RecentEpisode[]>(await sendWithLogin('/me/recent'))
}

export async function getFavorites () {
  return readJson<Episode[]>(await sendWithLogin('/me/favorites'))
}

export async function addFavorite (episodeId: string) {
  await readJson(await sendWithLogin(`/me/favorites/${encodeURIComponent(episodeId)}`, { method: 'PUT' }))
}

export async function removeFavorite (episodeId: string) {
  await readJson(await sendWithLogin(`/me/favorites/${encodeURIComponent(episodeId)}`, { method: 'DELETE' }))
}

export async function getPlaylists () {
  return readJson<Playlist[]>(await sendWithLogin('/me/playlists'))
}

export async function createPlaylist (name: string) {
  const response = await sendWithLogin('/me/playlists', { method: 'POST', body: JSON.stringify({ name }) })
  return readJson<Playlist>(response)
}

export async function getPlaylist (id: string) {
  return readJson<PlaylistDetail>(await sendWithLogin(`/me/playlists/${encodeURIComponent(id)}`))
}

export async function deletePlaylist (id: string) {
  await readJson(await sendWithLogin(`/me/playlists/${encodeURIComponent(id)}`, { method: 'DELETE' }))
}

export async function addToPlaylist (playlistId: string, episodeId: string) {
  const path = `/me/playlists/${encodeURIComponent(playlistId)}/episodes/${encodeURIComponent(episodeId)}`
  await readJson(await sendWithLogin(path, { method: 'PUT' }))
}

export async function removeFromPlaylist (playlistId: string, episodeId: string) {
  const path = `/me/playlists/${encodeURIComponent(playlistId)}/episodes/${encodeURIComponent(episodeId)}`
  await readJson(await sendWithLogin(path, { method: 'DELETE' }))
}

export const audioUrl = (episodeId: string) => `${API_URL}/episodes/${encodeURIComponent(episodeId)}/audio`
