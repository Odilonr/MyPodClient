import { useAuth } from '@/auth/AuthContext'
import { EpisodeList } from '@/components/EpisodeList'
import { LogInPrompt } from '@/components/LogInPrompt'
import { useLibrary } from '@/library/LibraryContext'

export function FavoritesPage () {
  const { status } = useAuth()
  const { favorites } = useLibrary()

  return (
    <>
      <h1 className="pb-4 pt-2 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-none tracking-tight">My favorites</h1>
      {status !== 'signed-in' ? (
        <LogInPrompt message="Log in to keep your favorite episodes in one place." />
      ) : favorites.length === 0 ? (
        <p className="py-4 text-body-regular text-text-secondary">Press the heart on any episode to keep it here.</p>
      ) : (
        <EpisodeList episodes={favorites} twoColumns />
      )}
    </>
  )
}
