import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { movieApi } from '../api/movies'
import MovieDetailsPage from './MovieDetailsPage'

vi.mock('../api/movies', () => ({ movieApi: { get: vi.fn() } }))

const movie = {
  id: 1, title: 'Arrival', releaseYear: 2016, director: 'Denis Villeneuve', genre: 'Science Fiction',
  runtimeMinutes: 116, language: 'English', watched: true, personalRating: 9.2,
  filePath: '/movies/arrival.mkv', notes: 'First line\nSecond line', createdAt: '2026-09-17T10:30:00',
  synopsis: 'A linguist learns to communicate with visitors.', castMembers: 'Amy Adams, Jeremy Renner',
  imdbUrl: 'https://www.imdb.com/title/tt2543164/', trailerUrl: 'https://example.com/arrival-trailer',
}

afterEach(() => vi.resetAllMocks())

describe('MovieDetailsPage', () => {
  it('shows a loading state, then all saved details', async () => {
    let resolve
    movieApi.get.mockReturnValue(new Promise((done) => { resolve = done }))
    render(<MovieDetailsPage movieId="1" onSessionExpired={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading movie details…')
    resolve(movie)
    await screen.findByRole('heading', { name: 'Arrival' })
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Arrival' })).toHaveFocus())
    expect(screen.getByText('9.2 / 10')).toBeInTheDocument()
    expect(screen.getByText('Watched')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('First line Second line')).toBeInTheDocument()
    expect(screen.getByText('A linguist learns to communicate with visitors.')).toBeInTheDocument()
    expect(screen.getByText('Amy Adams')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View on IMDb' })).toHaveAttribute('href', movie.imdbUrl)
    expect(screen.getByRole('link', { name: 'Watch trailer' })).toHaveAttribute('href', movie.trailerUrl)
    expect(screen.getByText(/Sep 17, 2026/)).toBeInTheDocument()
  })

  it('supports editing, watch status changes, and neighboring movie navigation', async () => {
    const onEdit = vi.fn()
    const onToggleWatched = vi.fn().mockResolvedValue({ ...movie, watched: false })
    movieApi.get.mockResolvedValue(movie)
    render(<MovieDetailsPage movieId="1" previousMovie={{ id: 2, title: 'Heat' }} nextMovie={{ id: 3, title: 'Dune' }} onEdit={onEdit} onToggleWatched={onToggleWatched} onSessionExpired={vi.fn()} />)
    await screen.findByRole('heading', { name: 'Arrival' })
    expect(screen.getByRole('link', { name: 'Previous movie: Heat' })).toHaveAttribute('href', '#movies/2')
    expect(screen.getByRole('link', { name: 'Next movie: Dune' })).toHaveAttribute('href', '#movies/3')
    await userEvent.click(screen.getByRole('button', { name: 'Edit movie' }))
    expect(onEdit).toHaveBeenCalledWith(movie)
    await userEvent.click(screen.getByRole('button', { name: 'Move to watchlist' }))
    await waitFor(() => expect(onToggleWatched).toHaveBeenCalledWith(movie))
    expect(screen.getByRole('button', { name: 'Mark watched' })).toBeInTheDocument()
  })

  it('supports Chinese and empty optional values without treating zero as unrated', async () => {
    movieApi.get.mockResolvedValue({ ...movie, notes: ' ', personalRating: 0, watched: false, createdAt: null })
    const { rerender } = render(<MovieDetailsPage movieId="1" language="zh" onSessionExpired={vi.fn()} />)
    await screen.findByRole('heading', { name: 'Arrival' })
    expect(screen.getByRole('link', { name: '返回片库' })).toHaveAttribute('href', '#catalog-results')
    expect(screen.getByText('尚未添加笔记。')).toBeInTheDocument()
    expect(screen.getByText('未观看')).toBeInTheDocument()
    expect(screen.getByText('0.0 / 10')).toBeInTheDocument()
    expect(screen.getByText('未提供')).toBeInTheDocument()
    movieApi.get.mockResolvedValue({ ...movie, personalRating: null, notes: null, filePath: '', createdAt: 'invalid' })
    rerender(<MovieDetailsPage key="2" movieId="2" language="zh" onSessionExpired={vi.fn()} />)
    expect(await screen.findByText('暂无评分')).toBeInTheDocument()
    expect(screen.getAllByText('未提供')).toHaveLength(2)
  })

  it.each([403, 404])('shows a private unavailable state for HTTP %s', async (status) => {
    movieApi.get.mockRejectedValue({ status })
    render(<MovieDetailsPage movieId="1" onSessionExpired={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Movie unavailable')
    expect(screen.queryByText('/movies/arrival.mkv')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
  })

  it('allows retrying a failed request', async () => {
    movieApi.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(movie)
    render(<MovieDetailsPage movieId="1" onSessionExpired={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load movie details')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'Arrival' })).toBeInTheDocument()
    expect(movieApi.get).toHaveBeenCalledTimes(2)
  })

  it('returns expired sessions to login', async () => {
    const onSessionExpired = vi.fn()
    movieApi.get.mockRejectedValue({ status: 401 })
    render(<MovieDetailsPage movieId="1" onSessionExpired={onSessionExpired} />)
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalledOnce())
  })

  it('ignores a previous movie response after navigation', async () => {
    let resolveOld
    const onSessionExpired = vi.fn()
    movieApi.get.mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve })).mockResolvedValueOnce({ ...movie, id: 2, title: 'Heat' })
    const { rerender } = render(<MovieDetailsPage movieId="1" onSessionExpired={onSessionExpired} />)
    rerender(<MovieDetailsPage movieId="2" onSessionExpired={onSessionExpired} />)
    await screen.findByRole('heading', { name: 'Heat' })
    resolveOld(movie)
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Arrival' })).not.toBeInTheDocument())
  })
})
