import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MoviePoster from './MoviePoster'

describe('MoviePoster', () => {
  it('shows supplied images, falls back on failure, and recovers with a new URL', () => {
    const movie = { title: 'Blade Runner', posterUrl: 'https://example.com/one.jpg' }
    const { container, rerender } = render(<MoviePoster movie={movie} />)
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy')
    expect(container.querySelector('img')).toHaveAttribute('referrerpolicy', 'no-referrer')
    fireEvent.error(container.querySelector('img'))
    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent('BR')
    rerender(<MoviePoster movie={{ ...movie, posterUrl: 'https://example.com/two.jpg' }} eager />)
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/two.jpg')
    expect(container.querySelector('img')).toHaveAttribute('loading', 'eager')
  })

  it('never renders unsupported image sources', () => {
    const { container } = render(<MoviePoster movie={{ posterUrl: 'javascript:alert(1)' }} />)
    expect(container.querySelector('img')).toBeNull()
  })
})
