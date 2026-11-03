import { Link } from 'react-router'
import type { Show } from '@/api/types'
import { usePlayer } from '@/player/PlayerContext'
import { cx } from '@/utils/cx'
import { isSample, withoutSampleLabel } from '@/utils/format'
import { Cover } from './Cover'

export function ShowGrid ({ shows, compact = false }: { shows: Show[], compact?: boolean }) {
  const { episode } = usePlayer()

  return (
    <ul className={cx('grid gap-x-4 gap-y-6', compact ? 'grid-cols-[repeat(auto-fill,minmax(110px,1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(170px,1fr))]')}>
      {shows.map((show) => (
        <li key={show.id} className="relative pt-5">
          <div aria-hidden className="tuner-marks absolute inset-x-0 top-0 h-3 text-separator-border-strong" />
          <div aria-hidden className={cx('absolute left-4 top-0 h-5 w-[3px] rounded-full', episode?.show_id === show.id ? 'bg-signal' : 'bg-ink')} />
          <Link to={`/shows/${show.id}`} className="group block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2">
            <Cover seed={show.id} image={show.profile_img_link} className="w-full rounded-sm" />
            <p className={cx('mt-2 font-display font-semibold leading-tight group-hover:underline', compact ? 'text-[15px]' : 'text-[19px]')}>
              {withoutSampleLabel(show.name)}
            </p>
            {compact ? (
              isSample(show.name) && <p className="mt-0.5 text-caption-1-medium text-text-secondary">Sample show</p>
            ) : (
              <p className="mt-0.5 text-body-regular text-text-secondary">
                {show.owner_id
                  ? show.show_type
                  : <>{isSample(show.name) ? 'Sample show, ' : ''}{show.show_type.toLowerCase()}, {show.release_schedule.toLowerCase()}</>}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
