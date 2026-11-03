import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UploadAudio } from './UploadAudio'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

const result = {
  episode: { id: 'episode-1', title: 'From the tag', description: '', date_added: '2026-01-01', duration: 60, show_id: 'show-1', show_name: '', profile: '' },
  show: { id: 'show-1', name: 'Tagged show', show_type: 'Science', description: '', profile_img_link: 'generated', release_schedule: '', studio: '', host_name: '' }
}

describe('uploading audio', () => {
  let uploadResponse: () => Response
  let fetchMock: ReturnType<typeof vi.fn>
  const file = new File(['audio'], 'episode.mp3', { type: 'audio/mpeg' })

  beforeEach(() => {
    uploadResponse = () => json(result, 201)
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/me/uploads') && init?.method === 'POST') return uploadResponse()
      if (url.endsWith('/me/uploads/episode-1') && init?.method === 'PATCH') {
        return json({ ...result, show: { ...result.show, id: 'show-2' } })
      }
      if (url.endsWith('/me/uploads/episode-1') && init?.method === 'DELETE') return json({ showRemoved: true })
      return json([])
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  const renderUpload = () => render(
    <MemoryRouter initialEntries={['/add']}>
      <Routes>
        <Route path="add" element={<UploadAudio />} />
        <Route path="shows/:id" element={<p>Opened show page</p>} />
      </Routes>
    </MemoryRouter>
  )

  async function uploadFile () {
    const user = userEvent.setup()
    renderUpload()
    await user.upload(screen.getByLabelText('Audio file'), file)
    return user
  }

  it('sends the file as form data, without forcing a JSON type', async () => {
    await uploadFile()
    await screen.findByLabelText(/Episode title/)
    const [, init] = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/me/uploads')) ?? []
    expect(init.body).toBeInstanceOf(FormData)
    expect(init.body.get('file').name).toBe('episode.mp3')
    expect(new Headers(init.headers).get('Content-Type')).toBeNull()
  })

  it('fills the form from the file, and saves the edits', async () => {
    const user = await uploadFile()
    const title = await screen.findByLabelText(/Episode title/)
    expect(title).toHaveValue('From the tag')
    expect(screen.getByLabelText(/^Show/)).toHaveValue('Tagged show')
    expect(screen.getByLabelText(/Category/)).toHaveValue('Science')

    await user.clear(title)
    await user.type(title, 'My title')
    await user.click(screen.getByRole('button', { name: 'Save to my library' }))

    expect(await screen.findByText('Opened show page')).toBeInTheDocument()
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')
    expect(JSON.parse(String(call?.[1].body))).toEqual({ title: 'My title', showName: 'Tagged show', category: 'Science' })
  })

  it('removes the file when the user changes their mind', async () => {
    const user = await uploadFile()
    await user.click(await screen.findByRole('button', { name: 'Remove file' }))
    await waitFor(() => expect(screen.getByLabelText('Audio file')).toBeInTheDocument())
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true)
  })

  it('shows the reason when the server refuses the file', async () => {
    uploadResponse = () => json({ message: 'This file is not a supported audio file.' }, 415)
    await uploadFile()
    expect(await screen.findByRole('alert')).toHaveTextContent('not a supported audio file')
    expect(screen.getByLabelText('Audio file')).toBeInTheDocument()
  })

  it('refuses a file over the limit before sending it', async () => {
    const user = userEvent.setup()
    renderUpload()
    const big = new File(['x'], 'big.mp3', { type: 'audio/mpeg' })
    Object.defineProperty(big, 'size', { value: 201 * 1024 * 1024 })
    await user.upload(screen.getByLabelText('Audio file'), big)
    expect(await screen.findByRole('alert')).toHaveTextContent('too large')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
