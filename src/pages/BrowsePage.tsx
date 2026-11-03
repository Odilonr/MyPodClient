import { RiSearchLine } from '@remixicon/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getShows } from '@/api/client'
import type { Show } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Input } from '@/components/base/input/input'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { LoadError } from '@/components/LoadError'
import { ShowGrid } from '@/components/ShowGrid'
import { cx } from '@/utils/cx'
import { withoutSampleLabel } from '@/utils/format'

export function BrowsePage () {
  const { status } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const topic = searchParams.get('topic')
  const [shows, setShows] = useState<Show[] | null>(null)
  const [search, setSearch] = useState('')
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    setFailed(false)
    getShows().then(setShows).catch(() => setFailed(true))
  }, [])

  useEffect(() => {
    if (status !== 'checking') load()
  }, [load, status])

  const topics = useMemo(() => [...new Set((shows ?? []).map((show) => show.show_type))].sort(), [shows])
  const matches = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (shows ?? []).filter((show) => (
      (!topic || show.show_type === topic) &&
      (!term || withoutSampleLabel(show.name).toLowerCase().includes(term))
    ))
  }, [search, shows, topic])

  const chip = (active: boolean) => cx(
    'rounded-full border px-4 py-2 text-body-medium outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring',
    active ? 'border-ink bg-ink text-white' : 'border-separator-border-strong hover:border-cobalt hover:text-cobalt'
  )

  return (
    <>
      <h1 className="pb-4 pt-2 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-none tracking-tight">Browse shows</h1>
      <Input aria-label="Search shows" placeholder="Search shows" leadingIcon={RiSearchLine} value={search} onChange={setSearch} className="max-w-md" />
      <div className="mb-6 mt-4 flex flex-wrap gap-2">
        <button type="button" aria-pressed={!topic} onClick={() => setSearchParams({})} className={chip(!topic)}>All</button>
        {topics.map((name) => (
          <button key={name} type="button" aria-pressed={topic === name} onClick={() => setSearchParams({ topic: name })} className={chip(topic === name)}>
            {name}
          </button>
        ))}
      </div>
      {failed ? (
        <LoadError message="The shows could not be loaded. Check that the API is running." onRetry={load} />
      ) : shows === null ? (
        <div aria-label="Loading shows" className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
          {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="aspect-square w-full" />)}
        </div>
      ) : matches.length === 0 ? (
        <p className="py-6 text-body-regular text-text-secondary">No shows match. Try another word or topic.</p>
      ) : (
        <ShowGrid shows={matches} />
      )}
    </>
  )
}
