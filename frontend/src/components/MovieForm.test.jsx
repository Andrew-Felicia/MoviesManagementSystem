import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import MovieForm from './MovieForm'

const movie = { title: 'Arrival', releaseYear: 2016, director: 'Denis Villeneuve', genre: 'Science Fiction', runtimeMinutes: 116, language: 'English', watched: false, personalRating: null, filePath: '/movies/arrival.mkv', notes: null }

describe('movie poster form', () => {
  it('saves and validates the richer details fields', async () => {
    const onSave = vi.fn()
    render(<MovieForm movie={movie} onSave={onSave} onClose={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Synopsis optional'), 'First contact changes everything.')
    await userEvent.type(screen.getByLabelText('Cast optional'), 'Amy Adams, Jeremy Renner')
    await userEvent.type(screen.getByLabelText('IMDb title URL optional'), 'https://www.imdb.com/title/tt2543164/')
    await userEvent.type(screen.getByLabelText('Trailer URL optional'), 'https://example.com/trailer')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      synopsis: 'First contact changes everything.',
      castMembers: 'Amy Adams, Jeremy Renner',
      imdbUrl: 'https://www.imdb.com/title/tt2543164/',
      trailerUrl: 'https://example.com/trailer',
    }))

    await userEvent.clear(screen.getByLabelText('IMDb title URL optional'))
    await userEvent.type(screen.getByLabelText('IMDb title URL optional'), 'https://example.com/not-imdb')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText(/Use an IMDb title URL/)).toBeInTheDocument()
  })

  it('previews, saves, edits, and removes a poster URL', async () => {
    const onSave = vi.fn()
    const { container } = render(<MovieForm movie={movie} onSave={onSave} onClose={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Poster URL'), 'https://example.com/arrival.jpg')
    expect(container.querySelector('.poster-tile img')).toHaveAttribute('src', 'https://example.com/arrival.jpg')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ posterUrl: 'https://example.com/arrival.jpg' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove poster' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ posterUrl: null }))
  })

  it('reads an uploaded photo and saves it with the movie', async () => {
    const onSave = vi.fn()
    render(<MovieForm movie={movie} onSave={onSave} onClose={vi.fn()} />)
    await userEvent.upload(screen.getByLabelText('Upload poster photo'), new File(['photo'], 'poster.png', { type: 'image/png' }))
    await screen.findByText('Uploaded image')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ posterUrl: 'data:image/png;base64,cGhvdG8=' }))
  })

  it('reports unsupported files, oversized photos, and invalid URLs', async () => {
    const onSave = vi.fn()
    render(<MovieForm movie={movie} onSave={onSave} onClose={vi.fn()} />)
    await userEvent.setup({ applyAccept: false }).upload(screen.getByLabelText('Upload poster photo'), new File(['svg'], 'poster.svg', { type: 'image/svg+xml' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Use an HTTP(S) image URL')
    await userEvent.upload(screen.getByLabelText('Upload poster photo'), new File([new Uint8Array(256 * 1024 + 1)], 'big.png', { type: 'image/png' }))
    expect(screen.getByRole('alert')).toHaveTextContent('no larger than 256 KB')
    await userEvent.type(screen.getByLabelText('Poster URL'), 'javascript:alert(1)')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Use an HTTP(S) image URL')
  })

  it('shows Chinese poster labels and preserves an existing uploaded image', async () => {
    const onSave = vi.fn()
    render(<MovieForm language="zh" movie={{ ...movie, posterUrl: 'data:image/webp;base64,cGhvdG8=' }} onSave={onSave} onClose={vi.fn()} />)
    expect(screen.getByLabelText('海报网址')).toHaveValue('')
    expect(screen.getByText('已上传图片')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '保存修改' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ posterUrl: 'data:image/webp;base64,cGhvdG8=' }))
  })

  it('reports file read failures and re-enables saving', async () => {
    const read = vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function () { this.onerror() })
    render(<MovieForm movie={movie} onSave={vi.fn()} onClose={vi.fn()} />)
    await userEvent.upload(screen.getByLabelText('Upload poster photo'), new File(['photo'], 'poster.png', { type: 'image/png' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read this image')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled())
    read.mockRestore()
  })
})
