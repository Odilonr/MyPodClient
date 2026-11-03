import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '@/auth/AuthContext'
import { defaultLayout, type LayoutSection } from '@/home/layout'
import { LibraryProvider } from '@/library/LibraryContext'
import { PlayerProvider } from '@/player/PlayerContext'
import { HomePage } from './HomePage'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

const show = {
  id: 'show-1',
  name: 'Night Shift Notes',
  description: 'Sample',
  profile_img_link: 'generated',
  release_schedule: 'Weekly',
  studio: 'Sample',
  host_name: 'Sample',
  show_type: 'Stories'
}
const episode = {
  id: 'episode-1',
  title: 'The 3 a.m. bus',
  description: 'Sample',
  date_added: '2026-01-01',
  duration: 60,
  show_id: 'show-1',
  show_name: show.name,
  profile: 'generated'
}

function DialogState () {
  const { dialogMode } = useAuth()
  return <p>dialog: {dialogMode ?? 'closed'}</p>
}

describe('customizing the home page', () => {
  let signedIn: boolean
  let savedLayout: LayoutSection[]
  let saveFails: boolean
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    signedIn = true
    savedLayout = defaultLayout()
    saveFails = false
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/user/refresh')) return signedIn ? json({ accessToken: 'token' }) : new Response(null, { status: 400 })
      if (url.endsWith('/shows')) return json([show])
      if (url.includes('/episodes?type=Latest')) return json([episode])
      if (url.endsWith('/me/layout') && init?.method === 'PUT') {
        if (saveFails) return new Response(null, { status: 500 })
        savedLayout = JSON.parse(String(init.body)).sections
        return json({ sections: savedLayout, isCustom: true })
      }
      if (url.endsWith('/me/layout')) return json({ sections: savedLayout, isCustom: false })
      return json([])
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  const renderHome = () => render(
    <MemoryRouter>
      <AuthProvider>
        <LibraryProvider>
          <PlayerProvider>
            <HomePage />
            <DialogState />
          </PlayerProvider>
        </LibraryProvider>
      </AuthProvider>
    </MemoryRouter>
  )

  const headings = () => screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
  const saveCalls = () => fetchMock.mock.calls.filter(([url, init]) => String(url).endsWith('/me/layout') && init?.method === 'PUT')

  async function startEditing () {
    const user = userEvent.setup()
    renderHome()
    await screen.findByRole('heading', { name: 'Latest episodes' })
    await user.click(screen.getByRole('button', { name: 'Customize home' }))
    await screen.findByText('Customizing your home')
    return user
  }

  it('asks a guest to log in', async () => {
    signedIn = false
    const user = userEvent.setup()
    renderHome()
    await screen.findByRole('heading', { name: 'Latest episodes' })
    await user.click(screen.getByRole('button', { name: 'Customize home' }))
    expect(screen.getByText('dialog: log-in')).toBeInTheDocument()
    expect(screen.queryByText('Customizing your home')).not.toBeInTheDocument()
  })

  it('shows the saved order and leaves out hidden sections', async () => {
    const [recent, startHere, latest, shows, favorites, playlists, topics] = defaultLayout()
    savedLayout = [topics, { ...latest, visible: false }, shows, recent, startHere, favorites, playlists]
    renderHome()
    await screen.findByRole('heading', { name: 'Shows' })
    expect(headings()).toEqual(['Browse by topic', 'Shows', 'Start here', 'My favorites', 'My playlists'])
  })

  it('makes play buttons and links do nothing while editing', async () => {
    await startEditing()
    const frame = screen.getByTestId('edit-section-latest')
    expect(frame.querySelector('[inert]')).toContainElement(within(frame).getByRole('button', { name: 'Play The 3 a.m. bus', hidden: true }))
  })

  it('moves a section, and saves the new order only on Save', async () => {
    const user = await startEditing()
    await user.click(screen.getByRole('button', { name: 'Move Latest episodes up' }))
    expect(saveCalls()).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.queryByText('Customizing your home')).not.toBeInTheDocument())

    expect(saveCalls()).toHaveLength(1)
    expect(savedLayout.map((section) => section.type).slice(0, 3)).toEqual(['recent', 'latest', 'start_here'])
    expect(headings().indexOf('Latest episodes')).toBeLessThan(headings().indexOf('Start here'))
  })

  it('throws away changes on Cancel', async () => {
    const user = await startEditing()
    await user.click(screen.getByRole('button', { name: 'Move Latest episodes up' }))
    await user.click(screen.getByRole('switch', { name: 'Show Latest episodes' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Customizing your home')).not.toBeInTheDocument()
    expect(saveCalls()).toHaveLength(0)
    expect(headings().indexOf('Start here')).toBeLessThan(headings().indexOf('Latest episodes'))
  })

  it('cannot move the first section up or the last section down', async () => {
    await startEditing()
    expect(screen.getByRole('button', { name: 'Move Recently listened up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Browse by topic down' })).toBeDisabled()
  })

  it('stays in edit mode and keeps changes when saving fails', async () => {
    saveFails = true
    const user = await startEditing()
    await user.click(screen.getByRole('button', { name: 'Move Latest episodes up' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('could not be saved')
    expect(screen.getByText('Customizing your home')).toBeInTheDocument()
    const frames = screen.getAllByTestId(/edit-section-/).map((frame) => frame.dataset.testid)
    expect(frames.indexOf('edit-section-latest')).toBeLessThan(frames.indexOf('edit-section-start_here'))
  })

  it('resets to the starting layout after asking', async () => {
    const [recent, startHere, latest, shows, favorites, playlists, topics] = defaultLayout()
    savedLayout = [topics, recent, startHere, latest, shows, favorites, playlists]
    const user = await startEditing()

    await user.click(screen.getByRole('button', { name: 'Reset to starting layout' }))
    await user.click(await screen.findByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(screen.queryByText('Go back to the starting layout?')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(saveCalls()).toHaveLength(1))
    expect(savedLayout).toEqual(defaultLayout())
  })
})
