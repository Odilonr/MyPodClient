import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError, deleteFeed, editFeed, refreshFeed } from '@/api/client'
import type { Show } from '@/api/types'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/base/modal/modal'

const messageFrom = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

interface ImportedShowControlsProps {
  show: Show
  onChanged: () => void
}

export function ImportedShowControls ({ show, onChanged }: ImportedShowControlsProps) {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false)
  const [name, setName] = useState(show.name)
  const [category, setCategory] = useState(show.show_type)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    setName(show.name)
    setCategory(show.show_type)
  }, [show])

  async function handleSave (event: FormEvent) {
    event.preventDefault()
    setIsBusy(true)
    setError(null)
    try {
      await editFeed(show.id, name.trim(), category.trim())
      setIsEditing(false)
      setStatus('Details saved')
      onChanged()
    } catch (err) {
      setError(messageFrom(err, 'The details could not be saved. Try again.'))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleRefresh () {
    setIsBusy(true)
    setStatus(null)
    setError(null)
    try {
      const { added } = await refreshFeed(show.id)
      setStatus(added === 0 ? 'No new episodes' : `Added ${added} new ${added === 1 ? 'episode' : 'episodes'}`)
      if (added > 0) onChanged()
    } catch (err) {
      setError(messageFrom(err, 'The feed could not be checked. Try again.'))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleRemove () {
    setIsBusy(true)
    try {
      await deleteFeed(show.id)
      navigate('/add')
    } catch (err) {
      setIsConfirmingRemove(false)
      setError(messageFrom(err, 'The show could not be removed. Try again.'))
      setIsBusy(false)
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="small" onClick={() => setIsEditing(true)}>Edit details</Button>
        {show.feed_url && <Button variant="secondary" size="small" disabled={isBusy} onClick={handleRefresh}>Check for new episodes</Button>}
        <Button variant="secondary" size="small" onClick={() => setIsConfirmingRemove(true)}>Remove show</Button>
        {status && <p role="status" className="text-body-medium text-text-secondary">{status}</p>}
      </div>
      {error && !isEditing && <p role="alert" className="mt-2 text-body-medium text-text-error-primary">{error}</p>}

      <Modal size="sm" isOpen={isEditing} onOpenChange={setIsEditing}>
        <ModalHeader title="Edit details" description="These changes only affect your library." />
        <ModalBody>
          <form onSubmit={handleSave} className="flex flex-col gap-4 pb-1">
            {error && <p role="alert" className="text-body-medium text-text-error-primary">{error}</p>}
            <Input label="Show name" isRequired maxLength={200} value={name} onChange={setName} />
            <Input label="Category" isRequired maxLength={60} value={category} onChange={setCategory} />
            <Button type="submit" disabled={isBusy} className="w-full justify-center">Save details</Button>
          </form>
        </ModalBody>
      </Modal>

      <Modal size="sm" isOpen={isConfirmingRemove} onOpenChange={setIsConfirmingRemove}>
        <ModalHeader title={`Remove ${show.name}?`} />
        <ModalBody>
          <p className="text-body-regular text-text-secondary">{show.feed_url
            ? 'This removes the show, its episodes, and your favorites and saved places for them. You can add the feed again later.'
            : 'This permanently deletes the show, your uploaded files, and your favorites and saved places for them.'}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsConfirmingRemove(false)}>Keep show</Button>
          <Button variant="danger" disabled={isBusy} onClick={handleRemove}>Remove show</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
