import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError, deleteUpload, getShow, getShowEpisodes } from '@/api/client'
import type { Episode, Show } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/base/buttons/button'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/base/modal/modal'
import { Skeleton, SkeletonText } from '@/components/base/skeleton/skeleton'
import { Cover } from '@/components/Cover'
import { EpisodeList } from '@/components/EpisodeList'
import { LoadError } from '@/components/LoadError'
import { ImportedShowControls } from '@/library/ImportedShowControls'
import { UploadDetailsForm } from '@/library/UploadDetailsForm'

type PageState =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'failed' }
  | { kind: 'ready', show: Show, episodes: Episode[] }

export function ShowPage () {
  const { id = '' } = useParams()
  const { status } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Episode | null>(null)
  const [removing, setRemoving] = useState<Episode | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [state, setState] = useState<PageState>({ kind: 'loading' })

  const load = useCallback(() => {
    Promise.all([getShow(id), getShowEpisodes(id)])
      .then(([show, episodes]) => setState({ kind: 'ready', show, episodes }))
      .catch((err) => setState({ kind: err instanceof ApiError && err.status === 404 ? 'missing' : 'failed' }))
  }, [id])

  useEffect(() => {
    if (status === 'checking') return
    setState({ kind: 'loading' })
    load()
  }, [load, status])

  if (state.kind === 'loading') {
    return (
      <div aria-label="Loading show" className="grid gap-6 pt-6 md:grid-cols-[280px_1fr]">
        <Skeleton className="aspect-square w-full max-w-[280px]" />
        <SkeletonText lines={4} />
      </div>
    )
  }
  if (state.kind === 'failed') {
    return <LoadError message="This show could not be loaded. Check that the API is running." onRetry={load} />
  }
  if (state.kind === 'missing') {
    return (
      <div className="py-12">
        <h1 className="mb-2 font-display text-[40px] font-bold tracking-tight">This show does not exist</h1>
        <Link to="/" className="text-body-medium text-accent-600 underline underline-offset-2">Browse all shows</Link>
      </div>
    )
  }

  const { show, episodes } = state
  const isImported = Boolean(show.owner_id)
  const isUpload = isImported && !show.feed_url

  async function handleRemoveUpload () {
    if (!removing) return
    try {
      const { showRemoved } = await deleteUpload(removing.id)
      setRemoving(null)
      if (showRemoved) navigate('/add')
      else load()
    } catch {
      setRemoving(null)
      setRemoveError('The file could not be removed. Try again.')
    }
  }
  return (
    <>
      <div className="grid items-end gap-6 pb-8 pt-6 md:grid-cols-[280px_1fr]">
        <Cover seed={show.id} image={show.profile_img_link} className="w-full max-w-[280px] rounded-sm" />
        <div>
          <h1 className="font-display text-[clamp(2.25rem,6vw,4.25rem)] font-bold leading-[0.98] tracking-tight">
            {show.name}
          </h1>
          <p className="mt-3 text-body-medium text-text-secondary">
            {isImported
              ? <>{isUpload ? 'Uploaded by you' : <>By {show.host_name}. Added by you from an RSS feed</>}. {show.show_type}.</>
              : <>By {show.host_name}. {show.show_type}.</>}
          </p>
          {show.source_link && (
            <a href={show.source_link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-body-medium text-accent-600 underline underline-offset-2">
              Visit the show's website
            </a>
          )}
          <p className="mt-3 line-clamp-5 max-w-[65ch] text-body-regular">{show.description}</p>
          {isImported && <ImportedShowControls show={show} onChanged={load} />}
        </div>
      </div>
      <h2 className="mb-3 font-display text-[28px] font-bold tracking-tight">Episodes</h2>
      {episodes.length === 0
        ? <p className="py-4 text-body-regular text-text-secondary">This show has no episodes yet.</p>
        : (
          <EpisodeList
            episodes={episodes}
            showArt={false}
            onEdit={isUpload ? setEditing : undefined}
            onRemove={isUpload ? setRemoving : undefined}
            removeLabel="from your uploads"
          />
        )}
      {removeError && <p role="alert" className="mt-3 text-body-medium text-text-error-primary">{removeError}</p>}
      <Modal size="sm" isOpen={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <ModalHeader title="Edit episode" />
        <ModalBody>
          {editing && (
            <div className="pb-1">
              <UploadDetailsForm
                episodeId={editing.id}
                title={editing.title}
                showName={show.name}
                category={show.show_type}
                saveLabel="Save details"
                onSaved={({ show: saved }) => {
                  setEditing(null)
                  if (saved.id === show.id) load()
                  else navigate(`/shows/${saved.id}`)
                }}
              />
            </div>
          )}
        </ModalBody>
      </Modal>
      <Modal size="sm" isOpen={removing !== null} onOpenChange={(open) => { if (!open) setRemoving(null) }}>
        <ModalHeader title="Delete this file?" />
        <ModalBody>
          <p className="text-body-regular text-text-secondary">This permanently deletes "{removing?.title}", plus your favorite and saved place for it.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setRemoving(null)}>Keep file</Button>
          <Button variant="danger" onClick={handleRemoveUpload}>Delete file</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
