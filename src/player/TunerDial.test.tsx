import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TunerDial } from './TunerDial'

describe('TunerDial', () => {
  it('moves the needle to the current position', () => {
    render(<TunerDial currentTime={30} duration={120} onSeek={() => {}} />)
    expect(screen.getByTestId('tuner-needle')).toHaveStyle({ left: '25%' })
  })

  it('seeks when the slider changes', () => {
    const onSeek = vi.fn()
    render(<TunerDial currentTime={0} duration={120} onSeek={onSeek} />)
    fireEvent.change(screen.getByRole('slider', { name: 'Position in episode' }), { target: { value: '60' } })
    expect(onSeek).toHaveBeenCalledWith(60)
  })

  it('reads the position in words for screen readers', () => {
    render(<TunerDial currentTime={75} duration={120} onSeek={() => {}} />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '1 minute 15 seconds of 2 minutes 0 seconds')
  })

  it('is disabled when nothing is loaded', () => {
    render(<TunerDial currentTime={0} duration={0} disabled onSeek={() => {}} />)
    expect(screen.getByRole('slider')).toBeDisabled()
    expect(screen.getByTestId('tuner-needle')).toHaveStyle({ left: '0%' })
  })
})
