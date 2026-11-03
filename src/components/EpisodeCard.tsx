import { RiPauseFill, RiPlayFill } from '@remixicon/react'
import { Link } from 'react-router'
import type { Episode } from '@/api/types'
import { usePlayer } from '@/player/PlayerContext'
import { cx } from '@/utils/cx'
import { formatClock, formatDate, formatDuration } from '@/utils/format'
import { Cover, coverPalette } from './Cover'
import { EpisodeActions } from './EpisodeActions'

interface EpisodeCardProps {
  episode: Episode
  // Seconds already heard. When set, the card shows how far along the episode is.
  position?: number
  compact?: boolean
}

// A large colored card. Its color comes from the show, so a show looks the same everywhere.
export function EpisodeCard ({ episode, position, compact = false }: EpisodeCardProps) {
  const { episode: current, isPlaying, playEpisode, togglePlay } = usePlayer()
  const palette = coverPalette(episode.show_id)
  const isCurrent = current?.id === episode.id
  const isActive = isCurrent && isPlaying
  const percent = position !== undefined && episode.duration ? Math.min(100, (position / episode.duration) * 100) : null

  return (
    <li className={cx('shrink-0 snap-start', compact ? 'w-56' : 'w-72')}>
      <article className={cx('flex h-full flex-col rounded-md p-4', !compact && 'min-h-72')} style={{ background: palette.ground, color: palette.text }}>
        {!compact && <Cover seed={episode.show_id} image={episode.profile} className="size-24 rounded-sm outline outline-1 -outline-offset-1 outline-white/25" />}
        <p className="mt-3 text-caption-1-medium opacity-80">{formatDate(episode.date_added)}</p>
        <h3 className="mt-0.5 line-clamp-2 font-display text-[21px] font-semibold leading-tight">{episode.title}</h3>
        <Link to={`/shows/${episode.show_id}`} className="mt-1 truncate text-body-regular opacity-90 underline-offset-2 hover:underline">
          {episode.show_name}
        </Link>
        <div className="mt-auto pt-3">
          {percent !== null && (
            <div className="relative mb-2 h-3" role="img" aria-label={`${formatClock(position ?? 0)} heard`}>
              <div className="tuner-marks absolute inset-0 opacity-50" />
              <div className="absolute -inset-y-0.5 w-[3px] -translate-x-1/2 rounded-full bg-current" style={{ left: `${percent}%` }} />
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label={`${isActive ? 'Pause' : 'Play'} ${episode.title}`}
              onClick={() => (isCurrent ? togglePlay() : playEpisode(episode))}
              className="flex h-9 items-center gap-1 rounded-full pl-2 pr-3 text-body-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              style={{ background: palette.text, color: palette.ground }}
            >
              {isActive ? <RiPauseFill className="size-5" aria-hidden /> : <RiPlayFill className="size-5" aria-hidden />}
              {position ? 'Resume' : formatDuration(episode.duration) || 'Play'}
            </button>
            <EpisodeActions episode={episode} />
          </div>
        </div>
      </article>
    </li>
  )
}
