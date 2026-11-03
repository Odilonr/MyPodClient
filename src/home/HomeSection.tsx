import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Episode, Playlist, RecentEpisode, Show } from '@/api/types'
import { EpisodeCard } from '@/components/EpisodeCard'
import { EpisodeList } from '@/components/EpisodeList'
import { PlaylistGrid } from '@/components/PlaylistGrid'
import { Shelf } from '@/components/Shelf'
import { ShowGrid } from '@/components/ShowGrid'
import { SECTION_INFO, type LayoutSection } from './layout'

const ROWS = { small: 4, large: 12 }

export interface HomeData {
  shows: Show[]
  episodes: Episode[]
  featured: Episode[]
  topics: string[]
  recent: RecentEpisode[]
  favorites: Episode[]
  playlists: Playlist[]
}

function Titled ({ title, action, children }: { title: string, action?: ReactNode, children: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

const Hint = ({ children }: { children: string }) => <p className="text-body-regular text-text-secondary">{children}</p>

// Draws one section. Returns null when a section has nothing to show outside edit mode.
export function HomeSection ({ section, data, isEditing }: { section: LayoutSection, data: HomeData, isEditing: boolean }) {
  const { type, size, hiddenItems } = section
  const { title, emptyHint } = SECTION_INFO[type]
  const compact = size === 'small'
  const isShown = (item: string) => !hiddenItems.includes(item)
  const empty = isEditing ? <Titled title={title}><Hint>{emptyHint}</Hint></Titled> : null

  switch (type) {
    case 'recent':
      if (data.recent.length === 0) return empty
      return (
        <Shelf title={title}>
          {data.recent.map((episode) => <EpisodeCard key={episode.id} episode={episode} position={episode.currentplaytime} compact={compact} />)}
        </Shelf>
      )
    case 'start_here': {
      const featured = data.featured.filter((episode) => isShown(episode.show_id))
      if (featured.length === 0) return empty
      return (
        <Shelf title={title}>
          {featured.map((episode) => <EpisodeCard key={episode.id} episode={episode} compact={compact} />)}
        </Shelf>
      )
    }
    case 'latest':
      if (data.episodes.length === 0) return empty
      return <Titled title={title}><EpisodeList episodes={data.episodes.slice(0, ROWS[size])} twoColumns /></Titled>
    case 'shows': {
      const shows = data.shows.filter((show) => isShown(show.id))
      if (shows.length === 0) return empty
      return (
        <Titled title={title} action={<Link to="/browse" className="text-body-medium text-accent-600 underline-offset-2 hover:underline">See all shows</Link>}>
          <ShowGrid shows={shows} compact={compact} />
        </Titled>
      )
    }
    case 'favorites':
      return (
        <Titled title={title}>
          {data.favorites.length > 0
            ? <EpisodeList episodes={data.favorites.slice(0, ROWS[size])} twoColumns />
            : <Hint>{emptyHint}</Hint>}
        </Titled>
      )
    case 'playlists':
      return (
        <Titled title={title}>
          <PlaylistGrid playlists={data.playlists.filter((playlist) => isShown(playlist.id))} compact={compact} />
        </Titled>
      )
    case 'topics': {
      const topics = data.topics.filter(isShown)
      if (topics.length === 0) return empty
      return (
        <Titled title={title}>
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
        </Titled>
      )
    }
  }
}
