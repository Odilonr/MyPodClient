import { RiUploadCloud2Line } from '@remixicon/react'
import { useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError, deleteUpload, uploadAudio } from '@/api/client'
import type { UploadResult } from '@/api/types'
import { Button } from '@/components/base/buttons/button'
import { Cover } from '@/components/Cover'
import { cx } from '@/utils/cx'
import { UploadDetailsForm } from './UploadDetailsForm'

const MAX_FILE_BYTES = 200 * 1024 * 1024

export function UploadAudio () {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploaded, setUploaded] = useState<UploadResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send (file: File | undefined) {
    if (!file) return
    setError(null)
    if (file.size > MAX_FILE_BYTES) {
      setError('This file is too large. The limit is 200 MB.')
      return
    }
    setIsUploading(true)
    try {
      setUploaded(await uploadAudio(file))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The file could not be uploaded. Check your connection and try again.')
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDiscard () {
    if (!uploaded) return
    try {
      await deleteUpload(uploaded.episode.id)
      setUploaded(null)
    } catch {
      setError('The file could not be removed. Try again.')
    }
  }

  function handleDrop (event: DragEvent) {
    event.preventDefault()
    setIsDragging(false)
    send(event.dataTransfer.files[0])
  }

  if (uploaded) {
    return (
      <div className="grid max-w-4xl gap-6 rounded-md border border-separator-border bg-background-primary-default p-5 md:grid-cols-[180px_1fr]">
        <Cover seed={uploaded.show.id} className="w-full max-w-[180px] rounded-sm" />
        <div className="min-w-0">
          <p role="status" className="mb-3 text-body-medium text-text-secondary">
            Uploaded. Check these details, which were filled in from the file.
          </p>
          {error && <p role="alert" className="mb-3 text-body-medium text-text-error-primary">{error}</p>}
          <UploadDetailsForm
            episodeId={uploaded.episode.id}
            title={uploaded.episode.title}
            showName={uploaded.show.name}
            category={uploaded.show.show_type}
            saveLabel="Save to my library"
            onSaved={({ show }) => navigate(`/shows/${show.id}`)}
          >
            <Button type="button" variant="secondary" onClick={handleDiscard}>Remove file</Button>
          </UploadDetailsForm>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <label
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cx(
          'flex flex-col items-center gap-1 rounded-md border-2 border-dashed px-4 py-8 text-center has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-border-focus-ring',
          isUploading ? 'cursor-wait' : 'cursor-pointer',
          isDragging ? 'border-cobalt bg-accent-50' : 'border-separator-border-strong hover:border-cobalt'
        )}
      >
        <RiUploadCloud2Line className="size-7 text-text-secondary" aria-hidden />
        <span className="text-headline-medium">{isUploading ? 'Uploading. Large files can take a few minutes.' : 'Choose an audio file or drop it here'}</span>
        <span className="text-body-regular text-text-secondary">MP3, M4A, AAC, OGG, WAV or FLAC, up to 200 MB. Only you can play it.</span>
        <input
          ref={inputRef}
          type="file"
          aria-label="Audio file"
          accept="audio/*,.mp3,.m4a,.aac,.ogg,.opus,.wav,.flac"
          disabled={isUploading}
          onChange={(event) => send(event.target.files?.[0])}
          className="sr-only"
        />
      </label>
      {error && <p role="alert" className="mt-3 text-body-medium text-text-error-primary">{error}</p>}
    </div>
  )
}
