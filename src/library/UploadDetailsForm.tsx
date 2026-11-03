import { useState, type FormEvent } from 'react'
import { ApiError, updateUpload } from '@/api/client'
import type { UploadResult } from '@/api/types'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'

interface UploadDetailsFormProps {
  episodeId: string
  title: string
  showName: string
  category: string
  saveLabel: string
  onSaved: (result: UploadResult) => void
  children?: React.ReactNode
}

export function UploadDetailsForm ({ episodeId, title: startTitle, showName: startShow, category: startCategory, saveLabel, onSaved, children }: UploadDetailsFormProps) {
  const [title, setTitle] = useState(startTitle)
  const [showName, setShowName] = useState(startShow)
  const [category, setCategory] = useState(startCategory)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit (event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      onSaved(await updateUpload(episodeId, { title: title.trim(), showName: showName.trim(), category: category.trim() }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The details could not be saved. Check your connection and try again.')
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <p role="alert" className="text-body-medium text-text-error-primary">{error}</p>}
      <Input label="Episode title" isRequired maxLength={300} value={title} onChange={setTitle} />
      <Input label="Show" isRequired maxLength={200} value={showName} onChange={setShowName} hint="Use the same name to keep episodes in one show." />
      <Input label="Category" isRequired maxLength={60} value={category} onChange={setCategory} hint="Used for Browse by topic." />
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={isSaving}>{saveLabel}</Button>
        {children}
      </div>
    </form>
  )
}
