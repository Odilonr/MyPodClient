import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '@/api/client'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Modal, ModalBody, ModalHeader } from '@/components/base/modal/modal'
import { useLibrary } from './LibraryContext'

export function NewPlaylistDialog () {
  const { newPlaylistFor, closeNewPlaylist, createPlaylist } = useLibrary()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setName('')
    setError(null)
  }, [newPlaylistFor])

  async function handleSubmit (event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      await createPlaylist(name.trim(), newPlaylistFor?.episode)
      closeNewPlaylist()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError('You already have a playlist with this name.')
      else if (err instanceof ApiError && err.status === 400) setError('Enter a name of 1 to 60 characters.')
      else setError('The playlist could not be created. Check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal size="sm" isOpen={newPlaylistFor !== null} onOpenChange={(open) => { if (!open) closeNewPlaylist() }}>
      <ModalHeader
        title="New playlist"
        description={newPlaylistFor?.episode ? `"${newPlaylistFor.episode.title}" will be added to it.` : 'Group episodes your own way.'}
      />
      <ModalBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-1">
          <Input
            label="Name"
            isRequired
            autoFocus
            maxLength={60}
            value={name}
            onChange={(value) => { setName(value); setError(null) }}
            isInvalid={error !== null}
            errorMessage={error}
          />
          <Button type="submit" disabled={isSaving} className="w-full justify-center">Create playlist</Button>
        </form>
      </ModalBody>
    </Modal>
  )
}
