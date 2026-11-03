import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getLatestEpisodes, getShows } from '@/api/client'
import type { Episode, Show } from '@/api/types'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { Cover } from '@/components/Cover'
import { EpisodeList } from '@/components/EpisodeList'
import { LoadError } from '@/components/LoadError'
import { usePlayer } from '@/player/PlayerContext'
import { cx } from '@/utils/cx'
import { isSample, withoutSampleLabel } from '@/utils/format'

function ShowBand ({ shows }: { shows: Show[] }) {
  const { episode } = usePlayer()

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
      {shows.map((show) => {
        const onAir = episode?.show_id === show.id
        return (
          <li key={show.id} className="relative pt-5">
            <div aria-hidden className="tuner-marks absolute inset-x-0 top-0 h-3 text-separator-border-strong" />
            <div aria-hidden className={cx('absolute left-4 top-0 h-5 w-[3px] rounded-full', onAir ? 'bg-signal' : 'bg-ink')} />
            <Link to={`/shows/${show.id}`} className="group block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2">
              <Cover seed={show.id} image={show.profile_img_link} className="w-full rounded-sm" />
              <p className="mt-2 font-display text-[19px] font-semibold leading-tight group-hover:underline">
                {withoutSampleLabel(show.name)}
              </p>
              <p className="mt-0.5 text-body-regular text-text-secondary">
                {isSample(show.name) ? 'Sample show, ' : ''}{show.show_type.toLowerCase()}, {show.release_schedule.toLowerCase()}
              </p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function LoadingBand () {
  return (
    <div aria-label="Loading shows" className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="aspect-square w-full" />)}
    </div>
  )
}

export function HomePage () {
  const [shows, setShows] = useState<Show[] | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    setFailed(false)
    Promise.all([getShows(), getLatestEpisodes()])
      .then(([nextShows, nextEpisodes]) => {
        setShows(nextShows)
        setEpisodes(nextEpisodes)
      })
      .catch(() => setFailed(true))
  }, [])

  useEffect(load, [load])

  const allSample = shows !== null && shows.length > 0 && shows.every((show) => isSample(show.name))

  return (
    <>
      <h1 className="max-w-3xl pb-3 pt-6 font-display text-[clamp(2.75rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-tight">
        What do you want to hear?
      </h1>
      {allSample && (
        <p className="mb-8 max-w-[65ch] text-body-regular text-text-secondary">
          These shows are sample data made for this demo. They are not real podcasts, and the audio is a generated tone.
        </p>
      )}

      {failed ? (
        <LoadError message="The shows could not be loaded. Check that the API is running." onRetry={load} />
      ) : shows === null ? (
        <LoadingBand />
      ) : shows.length === 0 ? (
        <p className="py-8 text-body-regular text-text-secondary">There are no shows yet. Add sample shows with npm run seed in the API folder.</p>
      ) : (
        <>
          <section aria-label="Shows"><ShowBand shows={shows} /></section>
          <section className="mt-12">
            <h2 className="mb-3 font-display text-[28px] font-bold tracking-tight">Latest episodes</h2>
            <EpisodeList episodes={episodes} />
          </section>
        </>
      )}
    </>
  )
}
