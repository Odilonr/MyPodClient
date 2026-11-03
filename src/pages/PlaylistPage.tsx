import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError, getPlaylist, removeFromPlaylist } from '@/api/client'
import type { Episode, PlaylistDetail } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/base/buttons/button'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/base/modal/modal'
import { SkeletonText } from '@/components/base/skeleton/skeleton'
import { EpisodeList } from '@/components/EpisodeList'
import { LoadError } from '@/components/LoadError'
import { LogInPrompt } from '@/components/LogInPrompt'
import { useLibrary } from '@/library/LibraryContext'

type PageState =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'failed' }
  | { kind: 'ready', playlist: PlaylistDetail }

export function PlaylistPage () {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { status } = useAuth()
  const { deletePlaylist, refreshPlaylists, playlists } = useLibrary()
  const [state, setState] = useState<PageState>({ kind: 'loading' })
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const signedIn = status === 'signed-in'
  const listedCount = playlists.find((playlist) => playlist.id === id)?.episode_count

  const load = useCallback(() => {
    if (!signedIn) return
    getPlaylist(id)
      .then((playlist) => setState({ kind: 'ready', playlist }))
      .catch((err) => setState({ kind: err instanceof ApiError && err.status === 404 ? 'missing' : 'failed' }))
  }, [id, signedIn])

  // The count changes when an episode is added from a row on this page.
  useEffect(load, [load, listedCount])

  async function handleRemove (episode: Episode) {
    setActionError(null)
    try {
      await removeFromPlaylist(id, episode.id)
      load()
      await refreshPlaylists()
    } catch {
      setActionError('The episode could not be removed. Try again.')
    }
  }

  async function handleDelete () {
    try {
      await deletePlaylist(id)
      navigate('/playlists')
    } catch {
      setConfirmingDelete(false)
      setActionError('The playlist could not be deleted. Try again.')
    }
  }

  if (!signedIn) return <LogInPrompt message="Log in to see your playlists." />
  if (state.kind === 'loading') return <div aria-label="Loading playlist" className="pt-4"><SkeletonText lines={4} /></div>
  if (state.kind === 'failed') return <LoadError message="This playlist could not be loaded. Check your connection." onRetry={load} />
  if (state.kind === 'missing') {
    return (
      <div className="py-8">
        <h1 className="mb-2 font-display text-[40px] font-bold tracking-tight">This playlist does not exist</h1>
        <Link to="/playlists" className="text-body-medium text-accent-600 underline underline-offset-2">See your playlists</Link>
      </div>
    )
  }

  const { playlist } = state
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 pt-2">
        <div className="min-w-0">
          <h1 className="break-words font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-none tracking-tight">{playlist.name}</h1>
          <p className="mt-2 text-body-regular text-text-secondary">
            {playlist.episodes.length} {playlist.episodes.length === 1 ? 'episode' : 'episodes'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setConfirmingDelete(true)}>Delete playlist</Button>
      </div>
      {actionError && <p role="alert" className="mb-3 text-body-medium text-text-error-primary">{actionError}</p>}
      {playlist.episodes.length === 0 ? (
        <p className="py-4 text-body-regular text-text-secondary">
          This playlist is empty. Press the plus on any episode to add it here. <Link to="/" className="text-accent-600 underline underline-offset-2">Find episodes</Link>
        </p>
      ) : (
        <EpisodeList episodes={playlist.episodes} onRemove={handleRemove} />
      )}
      <Modal size="sm" isOpen={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <ModalHeader title={`Delete ${playlist.name}?`} />
        <ModalBody>
          <p className="text-body-regular text-text-secondary">The episodes stay in MyPod. Only this playlist is deleted.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>Keep playlist</Button>
          <Button variant="danger" onClick={handleDelete}>Delete playlist</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
