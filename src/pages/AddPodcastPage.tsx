import { RiRssLine } from '@remixicon/react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError, getFeeds, importFeed, previewFeed } from '@/api/client'
import type { FeedPreview, Show } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { uploadsEnabled } from '@/config'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Cover } from '@/components/Cover'
import { LogInPrompt } from '@/components/LogInPrompt'
import { ShowGrid } from '@/components/ShowGrid'
import { UploadAudio } from '@/library/UploadAudio'
import { formatDate, formatDuration } from '@/utils/format'

const messageFrom = (err: unknown) => (err instanceof ApiError
  ? err.message
  : 'MyPod could not reach the server. Check your connection and try again.')

export function AddPodcastPage () {
  const { status } = useAuth()
  const navigate = useNavigate()
  const signedIn = status === 'signed-in'

  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<FeedPreview | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [imported, setImported] = useState<Show[]>([])

  const loadImported = useCallback(() => {
    if (signedIn) getFeeds().then(setImported).catch(() => {})
  }, [signedIn])

  useEffect(loadImported, [loadImported])

  async function handleFind (event: FormEvent) {
    event.preventDefault()
    setIsBusy(true)
    setError(null)
    setPreview(null)
    try {
      const found = await previewFeed(url.trim())
      setPreview(found)
      setName(found.show.name)
      setCategory(found.show.category)
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleImport (event: FormEvent) {
    event.preventDefault()
    setIsBusy(true)
    setError(null)
    try {
      const show = await importFeed(url.trim(), name.trim(), category.trim())
      navigate(`/shows/${show.id}`)
    } catch (err) {
      setError(messageFrom(err))
      setIsBusy(false)
    }
  }

  return (
    <>
      <h1 className="pb-2 pt-2 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-none tracking-tight">Add a podcast</h1>

      {!signedIn ? (
        <LogInPrompt message="Log in to add podcasts to your library." />
      ) : (
        <>
          <h2 className="mb-1 mt-4 font-display text-[28px] font-bold leading-tight tracking-tight">From an RSS feed</h2>
          <p className="mb-4 max-w-[65ch] text-body-regular text-text-secondary">
            Paste the feed link of a public podcast, audio or video. It stays private to you, keeps its original credit, and plays from the podcast's own website. Paid and exclusive shows have no public feed, and YouTube feeds have no playable file, so they cannot be added.
          </p>
          <form onSubmit={handleFind} className="flex max-w-2xl flex-wrap items-end gap-2">
            <Input
              className="min-w-64 flex-1"
              label="RSS feed link"
              type="url"
              inputMode="url"
              placeholder="https://example.com/feed.xml"
              leadingIcon={RiRssLine}
              isRequired
              value={url}
              onChange={(value) => { setUrl(value); setError(null); setPreview(null) }}
            />
            <Button type="submit" disabled={isBusy}>{isBusy && !preview ? 'Looking...' : 'Find podcast'}</Button>
          </form>
          {error && <p role="alert" className="mt-3 max-w-2xl text-body-medium text-text-error-primary">{error}</p>}

          {preview && (
            <form onSubmit={handleImport} className="mt-6 grid max-w-4xl gap-6 rounded-md border border-separator-border bg-background-primary-default p-5 md:grid-cols-[180px_1fr]">
              <Cover seed={preview.show.name} image={preview.show.image ?? undefined} className="w-full max-w-[180px] rounded-sm" />
              <div className="flex min-w-0 flex-col gap-4">
                <div>
                  <p className="text-body-medium text-text-secondary">
                    {preview.episodeCount} {preview.episodeCount === 1 ? 'episode' : 'episodes'} found{preview.show.author ? `, by ${preview.show.author}` : ''}
                  </p>
                  {preview.show.description && <p className="mt-1 line-clamp-3 max-w-[65ch] text-body-regular">{preview.show.description}</p>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Show name" isRequired maxLength={200} value={name} onChange={setName} />
                  <Input label="Category" isRequired maxLength={60} value={category} onChange={setCategory} hint="Used for Browse by topic" />
                </div>
                <div>
                  <p className="mb-1 text-headline-medium">Latest episodes</p>
                  <ul>
                    {preview.episodes.map((episode) => (
                      <li key={`${episode.title}-${episode.publishedAt}`} className="flex justify-between gap-4 border-t border-separator-border py-1.5 text-body-regular">
                        <span className="min-w-0 truncate">{episode.title}</span>
                        <span className="shrink-0 tabular-nums text-text-tertiary">{formatDuration(episode.duration) || formatDate(episode.publishedAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={isBusy}>{isBusy ? 'Adding...' : 'Add to my library'}</Button>
                  <Button type="button" variant="secondary" onClick={() => setPreview(null)}>Cancel</Button>
                </div>
              </div>
            </form>
          )}

          {uploadsEnabled() && <section className="mt-10">
            <h2 className="mb-1 font-display text-[28px] font-bold leading-tight tracking-tight">From an audio file</h2>
            <p className="mb-4 max-w-[65ch] text-body-regular text-text-secondary">
              Upload an episode you already have. MyPod fills in what it can from the file, and you choose the show and category.
            </p>
            <UploadAudio />
          </section>}

          {imported.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 font-display text-[28px] font-bold leading-tight tracking-tight">Podcasts you added</h2>
              <ShowGrid shows={imported} />
            </section>
          )}
        </>
      )}
    </>
  )
}
