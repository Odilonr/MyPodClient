import { formatClock, formatSpokenTime } from '@/utils/format'
import { cx } from '@/utils/cx'

const SCALE_MARKS = [0, 0.25, 0.5, 0.75, 1]

interface TunerDialProps {
  currentTime: number
  duration: number
  disabled?: boolean
  onSeek: (seconds: number) => void
}

// The progress bar, drawn as a radio band. A native range input sits on top, so
// dragging, touch and the keyboard all work and screen readers can read it.
export function TunerDial ({ currentTime, duration, disabled, onSeek }: TunerDialProps) {
  const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  return (
    <div className="px-4 pt-2 sm:px-6">
      <div className="relative h-9 rounded-sm text-dock-line has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-butter">
        <div aria-hidden className="tuner-marks absolute inset-0" />
        <div aria-hidden className="absolute inset-y-0 left-0 bg-cobalt/40" style={{ width: `${percent}%` }} />
        <div
          aria-hidden
          data-testid="tuner-needle"
          className={cx('absolute -inset-y-1 w-[3px] -translate-x-1/2 rounded-full', disabled ? 'bg-dock-line' : 'bg-signal')}
          style={{ left: `${percent}%` }}
        />
        <input
          type="range"
          aria-label="Position in episode"
          aria-valuetext={`${formatSpokenTime(currentTime)} of ${formatSpokenTime(duration)}`}
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(currentTime, duration || 0)}
          disabled={disabled}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="absolute inset-0 m-0 w-full cursor-ew-resize opacity-0 disabled:cursor-default"
        />
      </div>
      <div aria-hidden className="relative mt-1 h-4 text-[11px] tabular-nums text-dock-text">
        {SCALE_MARKS.map((mark) => (
          <span
            key={mark}
            className={cx('absolute', mark === 0 ? 'left-0' : mark === 1 ? 'right-0' : '-translate-x-1/2', mark > 0 && mark < 1 && 'hidden sm:block')}
            style={mark > 0 && mark < 1 ? { left: `${mark * 100}%` } : undefined}
          >
            {duration > 0 ? formatClock(duration * mark) : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
