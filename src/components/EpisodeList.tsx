import { RiCloseLine, RiPauseFill, RiPlayFill } from '@remixicon/react'
import { Link } from 'react-router'
import type { Episode } from '@/api/types'
import { usePlayer } from '@/player/PlayerContext'
import { cx } from '@/utils/cx'
import { formatDate, formatDuration } from '@/utils/format'
import { Cover } from './Cover'
import { EpisodeActions } from './EpisodeActions'

interface EpisodeListProps {
  episodes: Episode[]
  showArt?: boolean
  twoColumns?: boolean
  onRemove?: (episode: Episode) => void
}

export function EpisodeList ({ episodes, showArt = true, twoColumns = false, onRemove }: EpisodeListProps) {
  const { episode: current, isPlaying, playEpisode, togglePlay } = usePlayer()

  return (
    <ul className={cx('border-t border-separator-border', twoColumns && 'xl:grid xl:grid-cols-2 xl:gap-x-8')}>
      {episodes.map((episode) => {
        const isCurrent = current?.id === episode.id
        const isActive = isCurrent && isPlaying
        return (
          <li key={episode.id} className={cx('min-w-0 border-b border-separator-border', isCurrent && 'bg-butter/60')}>
            <div className="flex items-center gap-3 px-1 py-3 sm:px-3">
              <button
                type="button"
                aria-label={`${isActive ? 'Pause' : 'Play'} ${episode.title}`}
                onClick={() => (isCurrent ? togglePlay() : playEpisode(episode))}
                className={cx(
                  'grid size-10 shrink-0 place-items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2 motion-reduce:transition-none',
                  isActive ? 'bg-ink text-white' : 'bg-cobalt text-white hover:bg-accent-700'
                )}
              >
                {isActive ? <RiPauseFill className="size-5" aria-hidden /> : <RiPlayFill className="size-5" aria-hidden />}
              </button>
              {showArt && <Cover seed={episode.show_id} image={episode.profile} className="hidden size-12 shrink-0 rounded-sm sm:block" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-headline-medium">{episode.title}</p>
                <p className="truncate text-body-regular text-text-secondary">
                  {showArt ? (
                    <Link to={`/shows/${episode.show_id}`} className="underline-offset-2 hover:underline">{episode.show_name}</Link>
                  ) : episode.description}
                </p>
              </div>
              <div className="hidden shrink-0 text-right text-caption-1-medium tabular-nums text-text-tertiary sm:block">
                <p>{formatDuration(episode.duration)}</p>
                <p>{formatDate(episode.date_added)}</p>
              </div>
              <EpisodeActions episode={episode} />
              {onRemove && (
                <button
                  type="button"
                  aria-label={`Remove ${episode.title} from this playlist`}
                  onClick={() => onRemove(episode)}
                  className="grid size-9 shrink-0 place-items-center rounded-full outline-none hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                >
                  <RiCloseLine className="size-5" aria-hidden />
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
