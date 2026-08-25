import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import WaveText from './WaveText'

describe('WaveText', () => {
  it('keeps the phrase accessible while separating its visual characters', () => {
    render(<WaveText text="Under lock." />)

    const phrase = screen.getByLabelText('Under lock.')
    expect(phrase).toHaveClass('wave-text')
    expect(phrase.querySelectorAll('.wave-character')).toHaveLength(11)
    expect(phrase.querySelectorAll('[aria-hidden="true"]')).toHaveLength(11)
  })
})
