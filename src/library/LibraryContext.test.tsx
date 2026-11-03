import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Episode } from '@/api/types'
import { AuthProvider, useAuth } from '@/auth/AuthContext'
import { EpisodeActions } from '@/components/EpisodeActions'
import { LibraryProvider } from './LibraryContext'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

const episode: Episode = {
  id: 'episode-1',
  title: 'The 3 a.m. bus',
  description: 'Sample',
  date_added: '2026-01-01',
  duration: 60,
  show_id: 'show-1',
  show_name: 'Sample: Night Shift Notes',
  profile: 'generated'
}

function DialogState () {
  const { dialogMode } = useAuth()
  return <p>dialog: {dialogMode ?? 'closed'}</p>
}

const renderActions = () => render(
  <AuthProvider>
    <LibraryProvider>
      <EpisodeActions episode={episode} />
      <DialogState />
    </LibraryProvider>
  </AuthProvider>
)

describe('favorites button', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let favoriteResponse: () => Response

  beforeEach(() => {
    vi.resetModules()
    favoriteResponse = () => new Response(null, { status: 204 })
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/user/refresh')) return signedIn ? json({ accessToken: 'token' }) : new Response(null, { status: 400 })
      if (url.includes('/me/favorites/') && init?.method === 'PUT') return favoriteResponse()
      return json([])
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  let signedIn = false
  const heart = () => screen.getByRole('button', { name: /favorites/ })

  it('asks a guest to log in instead of saving', async () => {
    signedIn = false
    const user = userEvent.setup()
    renderActions()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve))
    await user.click(heart())
    expect(screen.getByText('dialog: log-in')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/me/favorites/'))).toBe(false)
  })

  it('saves for a signed-in user', async () => {
    signedIn = true
    const user = userEvent.setup()
    renderActions()
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/me/favorites'))).toBe(true))
    await user.click(heart())
    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'true'))
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/me/favorites/episode-1') && init?.method === 'PUT')).toBe(true)
  })

  it('undoes the heart when saving fails', async () => {
    signedIn = true
    favoriteResponse = () => new Response(null, { status: 500 })
    const user = userEvent.setup()
    renderActions()
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/me/favorites'))).toBe(true))
    await user.click(heart())
    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'false'))
  })
})
