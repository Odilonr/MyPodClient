import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Cover } from './Cover'

describe('Cover', () => {
  it('draws the same art for the same show', () => {
    const first = render(<Cover seed="show-1" />).container.innerHTML
    const second = render(<Cover seed="show-1" />).container.innerHTML
    expect(first).toBe(second)
  })

  it('uses a web image link when there is one', () => {
    const { container } = render(<Cover seed="show-1" image="https://example.com/art.png" />)
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/art.png')
  })

  it.each(['generated', 'javascript:alert(1)', 'data:image/svg+xml,<svg/>'])('does not load %s as an image', (image) => {
    const { container } = render(<Cover seed="show-1" image={image} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
