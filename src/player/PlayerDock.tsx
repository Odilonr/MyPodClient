import { RiForward30Line, RiPauseFill, RiPlayFill, RiReplay15Line } from '@remixicon/react'
import { Link } from 'react-router'
import { Slider } from '@/components/base/slider/slider'
import { Cover } from '@/components/Cover'
import { useAuth } from '@/auth/AuthContext'
import { cx } from '@/utils/cx'
import { formatClock } from '@/utils/format'
import { usePlayer } from './PlayerContext'
import { TunerDial } from './TunerDial'

const transportButton = 'grid size-10 place-items-center rounded-full text-dock-text outline-none transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-butter disabled:cursor-default disabled:opacity-40 disabled:hover:text-dock-text'

export function PlayerDock () {
  const { episode, isPlaying, currentTime, duration, volume, message, togglePlay, seek, skip, setVolume } = usePlayer()
  const { status, openDialog } = useAuth()
  const empty = !episode

  return (
    <section aria-label="Player" className="fixed inset-x-0 bottom-0 z-40 bg-ink text-white">
      <TunerDial currentTime={currentTime} duration={duration} disabled={empty} onSeek={seek} />

      <div className="flex items-center gap-3 px-4 pb-3 pt-1 sm:gap-6 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {episode ? (
            <>
              <Cover seed={episode.show_id} image={episode.profile} className="size-11 shrink-0 rounded-sm" />
              <div className="min-w-0">
                <p className="truncate text-body-medium">{episode.title}</p>
                <Link to={`/shows/${episode.show_id}`} className="block truncate text-caption-1-medium text-dock-text hover:text-white hover:underline">
                  {episode.show_name}
                </Link>
              </div>
            </>
          ) : (
            <p className="text-body-regular text-dock-text">Choose an episode to start listening.</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button type="button" aria-label="Back 15 seconds" disabled={empty} onClick={() => skip(-15)} className={cx(transportButton, 'hidden sm:grid')}>
            <RiReplay15Line className="size-6" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={empty}
            onClick={togglePlay}
            className="grid size-11 place-items-center rounded-full bg-butter text-ink outline-none transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-butter disabled:cursor-default disabled:opacity-40 disabled:hover:scale-100 motion-reduce:transition-none"
          >
            {isPlaying ? <RiPauseFill className="size-6" aria-hidden /> : <RiPlayFill className="size-6" aria-hidden />}
          </button>
          <button type="button" aria-label="Forward 30 seconds" disabled={empty} onClick={() => skip(30)} className={cx(transportButton, 'hidden sm:grid')}>
            <RiForward30Line className="size-6" aria-hidden />
          </button>
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-5 sm:flex">
          {message ? (
            <p role="status" className="min-w-0 text-caption-1-medium text-butter">{message}</p>
          ) : episode && status === 'guest' ? (
            <button type="button" onClick={() => openDialog('log-in')} className="text-caption-1-medium text-dock-text underline underline-offset-2 hover:text-white">
              Log in to save your place
            </button>
          ) : null}
          <p className="shrink-0 text-body-medium tabular-nums text-dock-text">
            {formatClock(currentTime)} / {formatClock(duration)}
          </p>
          <Slider
            aria-label="Volume"
            thumbLabel="Volume"
            showTooltip={false}
            className="dark hidden w-24 lg:block"
            minValue={0}
            maxValue={1}
            step={0.05}
            value={volume}
            onChange={(value) => setVolume(value as number)}
          />
        </div>
      </div>
      {message && <p role="status" className="px-4 pb-2 text-caption-1-medium text-butter sm:hidden">{message}</p>}
    </section>
  )
}
