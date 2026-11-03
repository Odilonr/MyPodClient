import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Episode } from '@/api/types'
import { AuthProvider } from '@/auth/AuthContext'
import { PlayerProvider, usePlayer } from './PlayerContext'

const episode = (mediaType: 'audio' | 'video'): Episode => ({
  id: 'episode-1',
  title: 'A long episode',
  description: 'Sample',
  date_added: '2026-01-01',
  duration: 3600,
  show_id: 'show-1',
  show_name: 'Show',
  profile: 'generated',
  audio_link: 'https://cdn.example.com/one.mp4',
  media_type: mediaType
})

function PlayButton ({ item }: { item: Episode }) {
  const { playEpisode } = usePlayer()
  return <button type="button" onClick={() => playEpisode(item)}>Start</button>
}

describe('the media player', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 400 })))
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue()
  })

  async function start (item: Episode) {
    const user = userEvent.setup()
    render(<AuthProvider><PlayerProvider><PlayButton item={item} /></PlayerProvider></AuthProvider>)
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await screen.findByTestId('media-player')
    return user
  }

  it('keeps the player hidden for an audio episode', async () => {
    await start(episode('audio'))
    expect(screen.getByTestId('media-player')).toHaveClass('hidden')
    expect(screen.queryByRole('button', { name: 'Hide video' })).not.toBeInTheDocument()
  })

  it('shows the picture for a video episode, from its own web address', async () => {
    await start(episode('video'))
    const player = await screen.findByRole('button', { name: 'Hide video' })
    expect(player).toBeInTheDocument()
    expect(screen.getByTestId('media-player')).not.toHaveClass('hidden')
    expect(screen.getByTestId('media-player')).toHaveAttribute('src', 'https://cdn.example.com/one.mp4')
  })

  it('can hide the picture and show it again', async () => {
    const user = await start(episode('video'))
    await user.click(await screen.findByRole('button', { name: 'Hide video' }))
    expect(screen.getByTestId('media-player')).toHaveClass('hidden')
    await user.click(screen.getByRole('button', { name: 'Show video' }))
    expect(screen.getByTestId('media-player')).not.toHaveClass('hidden')
  })
})
