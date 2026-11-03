import { useAuth } from '@/auth/AuthContext'
import { LogInPrompt } from '@/components/LogInPrompt'
import { PlaylistGrid } from '@/components/PlaylistGrid'
import { useLibrary } from '@/library/LibraryContext'

export function PlaylistsPage () {
  const { status } = useAuth()
  const { playlists } = useLibrary()

  return (
    <>
      <h1 className="pb-4 pt-2 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-none tracking-tight">My playlists</h1>
      {status === 'signed-in'
        ? <PlaylistGrid playlists={playlists} />
        : <LogInPrompt message="Log in to build playlists and group episodes your own way." />}
    </>
  )
}
