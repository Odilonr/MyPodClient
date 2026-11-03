import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/auth/AuthContext'
import { AddPodcastPage } from './AddPodcastPage'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const FEED = 'https://feeds.example.com/show.xml'

const preview = {
  show: { name: 'Real Feed Show', description: 'From a feed', author: 'The Host', image: 'https://example.com/art.png', link: 'https://example.com/', category: 'Science' },
  episodeCount: 12,
  episodes: [{ title: 'Episode a', duration: 120, publishedAt: '2026-11-02T10:00:00.000Z' }]
}

describe('adding a podcast', () => {
  let signedIn: boolean
  let previewResponse: () => Response
  let importResponse: () => Response
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    signedIn = true
    previewResponse = () => json(preview)
    importResponse = () => json({ id: 'new-show', name: 'Real Feed Show' }, 201)
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/user/refresh')) return signedIn ? json({ accessToken: 'token' }) : new Response(null, { status: 400 })
      if (url.endsWith('/me/feeds/preview')) return previewResponse()
      if (url.endsWith('/me/feeds') && init?.method === 'POST') return importResponse()
      return json([])
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  const renderPage = () => render(
    <MemoryRouter initialEntries={['/add']}>
      <AuthProvider>
        <Routes>
          <Route path="add" element={<AddPodcastPage />} />
          <Route path="shows/:id" element={<p>Opened show page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )

  async function findPodcast () {
    const user = userEvent.setup()
    renderPage()
    await user.type(await screen.findByLabelText(/RSS feed link/), FEED)
    await user.click(screen.getByRole('button', { name: 'Find podcast' }))
    return user
  }

  it('asks a guest to log in', async () => {
    signedIn = false
    renderPage()
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/RSS feed link/)).not.toBeInTheDocument()
  })

  it('shows a preview that the user can edit, and saves nothing yet', async () => {
    await findPodcast()
    expect(await screen.findByText(/12 episodes found, by The Host/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Show name/)).toHaveValue('Real Feed Show')
    expect(screen.getByLabelText(/Category/)).toHaveValue('Science')
    expect(screen.getByText('Episode a')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/me/feeds') && init?.method === 'POST')).toBe(false)
  })

  it('sends the edited name and category, then opens the show', async () => {
    const user = await findPodcast()
    const name = await screen.findByLabelText(/Show name/)
    await user.clear(name)
    await user.type(name, 'My name')
    await user.clear(screen.getByLabelText(/Category/))
    await user.type(screen.getByLabelText(/Category/), 'Morning')
    await user.click(screen.getByRole('button', { name: 'Add to my library' }))

    expect(await screen.findByText('Opened show page')).toBeInTheDocument()
    const call = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/me/feeds') && init?.method === 'POST')
    expect(JSON.parse(String(call?.[1].body))).toEqual({ url: FEED, name: 'My name', category: 'Morning' })
  })

  it('shows the reason when the address is refused', async () => {
    previewResponse = () => json({ message: 'This address cannot be used' }, 400)
    await findPodcast()
    expect(await screen.findByRole('alert')).toHaveTextContent('This address cannot be used')
    expect(screen.queryByRole('button', { name: 'Add to my library' })).not.toBeInTheDocument()
  })

  it('clears the error when the link changes', async () => {
    previewResponse = () => json({ message: 'This address is not a podcast feed' }, 422)
    const user = await findPodcast()
    await screen.findByRole('alert')
    await user.type(screen.getByLabelText(/RSS feed link/), 'x')
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('keeps the preview and explains when the feed is already imported', async () => {
    importResponse = () => json({ message: 'You already imported this feed' }, 409)
    const user = await findPodcast()
    await user.click(await screen.findByRole('button', { name: 'Add to my library' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('You already imported this feed')
    expect(screen.getByLabelText(/Show name/)).toBeInTheDocument()
  })
})
