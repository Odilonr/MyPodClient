import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError, getShow, getShowEpisodes } from '@/api/client'
import type { Episode, Show } from '@/api/types'
import { Skeleton, SkeletonText } from '@/components/base/skeleton/skeleton'
import { Cover } from '@/components/Cover'
import { EpisodeList } from '@/components/EpisodeList'
import { LoadError } from '@/components/LoadError'
import { isSample, withoutSampleLabel } from '@/utils/format'

type PageState =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'failed' }
  | { kind: 'ready', show: Show, episodes: Episode[] }

export function ShowPage () {
  const { id = '' } = useParams()
  const [state, setState] = useState<PageState>({ kind: 'loading' })

  const load = useCallback(() => {
    setState({ kind: 'loading' })
    Promise.all([getShow(id), getShowEpisodes(id)])
      .then(([show, episodes]) => setState({ kind: 'ready', show, episodes }))
      .catch((err) => setState({ kind: err instanceof ApiError && err.status === 404 ? 'missing' : 'failed' }))
  }, [id])

  useEffect(load, [load])

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
  return (
    <>
      <div className="grid items-end gap-6 pb-8 pt-6 md:grid-cols-[280px_1fr]">
        <Cover seed={show.id} image={show.profile_img_link} className="w-full max-w-[280px] rounded-sm" />
        <div>
          {isSample(show.name) && <p className="mb-2 text-body-medium text-text-secondary">Sample show</p>}
          <h1 className="font-display text-[clamp(2.25rem,6vw,4.25rem)] font-bold leading-[0.98] tracking-tight">
            {withoutSampleLabel(show.name)}
          </h1>
          <p className="mt-3 text-body-medium text-text-secondary">
            {show.host_name}, {show.studio}. {show.release_schedule}.
          </p>
          <p className="mt-3 max-w-[65ch] text-body-regular">{show.description}</p>
        </div>
      </div>
      <h2 className="mb-3 font-display text-[28px] font-bold tracking-tight">Episodes</h2>
      {episodes.length === 0
        ? <p className="py-4 text-body-regular text-text-secondary">This show has no episodes yet.</p>
        : <EpisodeList episodes={episodes} showArt={false} />}
    </>
  )
}
