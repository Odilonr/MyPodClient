import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { getLatestEpisodes, getShows } from '@/api/client'
import type { Episode, Show } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/base/buttons/button'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { EpisodeCard } from '@/components/EpisodeCard'
import { EpisodeList } from '@/components/EpisodeList'
import { LoadError } from '@/components/LoadError'
import { PlaylistGrid } from '@/components/PlaylistGrid'
import { Shelf } from '@/components/Shelf'
import { ShowGrid } from '@/components/ShowGrid'
import { useLibrary } from '@/library/LibraryContext'
import { usePlayer } from '@/player/PlayerContext'
import { isSample } from '@/utils/format'

const LATEST_COUNT = 24
const SHOWN_IN_LIST = 12

function newestPerShow (episodes: Episode[]) {
  const seen = new Set<string>()
  return episodes.filter((episode) => {
    if (seen.has(episode.show_id)) return false
    seen.add(episode.show_id)
    return true
  })
}

function SectionTitle ({ children }: { children: string }) {
  return <h2 className="mb-3 font-display text-[28px] font-bold leading-tight tracking-tight">{children}</h2>
}

export function HomePage () {
  const { status, openDialog } = useAuth()
  const { recent, favorites, playlists, refreshRecent } = useLibrary()
  const { episode: currentEpisode, isPlaying } = usePlayer()

  const [shows, setShows] = useState<Show[] | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    setFailed(false)
    Promise.all([getShows(), getLatestEpisodes(LATEST_COUNT)])
      .then(([nextShows, nextEpisodes]) => {
        setShows(nextShows)
        setEpisodes(nextEpisodes)
      })
      .catch(() => setFailed(true))
  }, [])

  useEffect(load, [load])

  // A new listen changes this list, so reload it when playback starts or stops.
  useEffect(() => {
    refreshRecent().catch(() => {})
  }, [currentEpisode?.id, isPlaying, refreshRecent])

  const featured = useMemo(() => newestPerShow(episodes), [episodes])
  const topics = useMemo(() => [...new Set((shows ?? []).map((show) => show.show_type))].sort(), [shows])
  const allSample = shows !== null && shows.length > 0 && shows.every((show) => isSample(show.name))
  const signedIn = status === 'signed-in'

  return (
    <>
      <h1 className="max-w-4xl pb-2 pt-2 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[0.98] tracking-tight">
        What do you want to hear?
      </h1>
      {allSample && (
        <p className="max-w-[65ch] text-body-regular text-text-secondary">
          These shows are sample data made for this demo. They are not real podcasts, and the audio is a generated tone.
        </p>
      )}

      {signedIn && recent.length > 0 && (
        <Shelf title="Recently listened">
          {recent.map((episode) => <EpisodeCard key={episode.id} episode={episode} position={episode.currentplaytime} />)}
        </Shelf>
      )}

      {failed ? (
        <LoadError message="The shows could not be loaded. Check that the API is running." onRetry={load} />
      ) : shows === null ? (
        <div aria-label="Loading shows" className="mt-10 flex gap-4 overflow-hidden">
          {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-72 w-72 shrink-0" />)}
        </div>
      ) : shows.length === 0 ? (
        <p className="py-8 text-body-regular text-text-secondary">There are no shows yet. Add sample shows with npm run seed in the API folder.</p>
      ) : (
        <>
          <Shelf title="Start here">
            {featured.map((episode) => <EpisodeCard key={episode.id} episode={episode} />)}
          </Shelf>

          <section className="mt-10">
            <SectionTitle>Latest episodes</SectionTitle>
            <EpisodeList episodes={episodes.slice(0, SHOWN_IN_LIST)} twoColumns />
          </section>

          <section className="mt-10">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight">Shows</h2>
              <Link to="/browse" className="text-body-medium text-accent-600 underline-offset-2 hover:underline">See all shows</Link>
            </div>
            <ShowGrid shows={shows} />
          </section>

          {signedIn ? (
            <>
              <section className="mt-10">
                <SectionTitle>My favorites</SectionTitle>
                {favorites.length > 0
                  ? <EpisodeList episodes={favorites.slice(0, SHOWN_IN_LIST)} twoColumns />
                  : <p className="text-body-regular text-text-secondary">Press the heart on any episode to keep it here.</p>}
              </section>
              <section className="mt-10">
                <SectionTitle>My playlists</SectionTitle>
                <PlaylistGrid playlists={playlists} />
              </section>
            </>
          ) : (
            <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-md bg-background-secondary-default p-5">
              <div>
                <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight">Keep what you like</h2>
                <p className="mt-1 max-w-[60ch] text-body-regular text-text-secondary">
                  Create an account to save favorites, build playlists, and pick up where you stopped.
                </p>
              </div>
              <Button onClick={() => openDialog('sign-up')}>Create account</Button>
            </section>
          )}

          <section className="mt-10">
            <SectionTitle>Browse by topic</SectionTitle>
            <ul className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <li key={topic}>
                  <Link
                    to={`/browse?topic=${encodeURIComponent(topic)}`}
                    className="block rounded-full border border-separator-border-strong px-4 py-2 text-body-medium outline-none hover:border-cobalt hover:text-cobalt focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                  >
                    {topic}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  )
}
