import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const movies = [
  { id: 1, title: 'Arrival', releaseYear: 2016, director: 'Denis Villeneuve', genre: 'Science Fiction', runtimeMinutes: 116, language: 'English', watched: true, personalRating: 9.2, filePath: '/movies/arrival.mkv', notes: null },
  { id: 2, title: 'Heat', releaseYear: 1995, director: 'Michael Mann', genre: 'Crime', runtimeMinutes: 170, language: 'English', watched: false, personalRating: null, filePath: '/movies/heat.mkv', notes: null },
]

function mockFetch(data = movies) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(data) }))
}

afterEach(() => vi.restoreAllMocks())

describe('App', () => {
  it('loads and displays the library', async () => {
    mockFetch()
    render(<App />)
    expect((await screen.findAllByText('Arrival')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Heat').length).toBeGreaterThan(0)
    expect(screen.getByText('2 of 2 titles shown')).toBeInTheDocument()
  })

  it('filters titles using search', async () => {
    mockFetch()
    render(<App />)
    await screen.findAllByText('Arrival')
    await userEvent.type(screen.getByLabelText('Search library'), 'villeneuve')
    expect(screen.getAllByText('Arrival').length).toBeGreaterThan(0)
    expect(screen.queryByText('Heat')).not.toBeInTheDocument()
  })

  it('opens the add movie form and validates required fields', async () => {
    mockFetch([])
    render(<App />)
    await screen.findByText('No matching titles')
    await userEvent.click(screen.getAllByRole('button', { name: 'Add movie' })[0])
    expect(screen.getByRole('dialog', { name: 'Add a movie' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add to library' }))
    expect(screen.getByText('Enter a title.')).toBeInTheDocument()
    expect(screen.getByText('Enter a director.')).toBeInTheDocument()
  })

  it('shows a retry state when the backend is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<App />)
    expect(await screen.findByText('Could not load your library')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
  })

  it('adds a valid movie through the form', async () => {
    const created = { ...movies[0], id: 10, title: 'Moon', director: 'Duncan Jones', releaseYear: 2009, runtimeMinutes: 97, filePath: '/movies/moon.mkv' }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve(created) }))
    render(<App />)
    await screen.findByText('No matching titles')
    await userEvent.click(screen.getAllByRole('button', { name: 'Add movie' })[0])
    await userEvent.type(screen.getByLabelText('Title'), 'Moon')
    await userEvent.clear(screen.getByLabelText('Release year'))
    await userEvent.type(screen.getByLabelText('Release year'), '2009')
    await userEvent.clear(screen.getByLabelText('Runtime (minutes)'))
    await userEvent.type(screen.getByLabelText('Runtime (minutes)'), '97')
    await userEvent.type(screen.getByLabelText('Director'), 'Duncan Jones')
    await userEvent.type(screen.getByLabelText('Genre'), 'Science Fiction')
    await userEvent.type(screen.getByLabelText('File path'), '/movies/moon.mkv')
    await userEvent.click(screen.getByRole('button', { name: 'Add to library' }))
    expect((await screen.findAllByText('Moon')).length).toBeGreaterThan(0)
    expect(fetch).toHaveBeenLastCalledWith('/api/movies', expect.objectContaining({ method: 'POST' }))
  })

  it('toggles a movie watched state', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(movies) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ ...movies[1], watched: true }) }))
    render(<App />)
    await screen.findAllByText('Heat')
    await userEvent.click(screen.getByRole('button', { name: 'Mark Heat as watched' }))
    await waitFor(() => expect(fetch).toHaveBeenLastCalledWith('/api/movies/2', expect.objectContaining({ method: 'PUT' })))
    expect(await screen.findByText('Marked as watched')).toBeInTheDocument()
  })

  it('confirms and deletes a catalog entry', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(movies) })
      .mockResolvedValueOnce({ ok: true, status: 204 }))
    render(<App />)
    await screen.findAllByText('Heat')
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete Heat' })[0])
    expect(screen.getByRole('alertdialog', { name: 'Remove “Heat”?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(screen.queryAllByText('Heat')).toHaveLength(0))
    expect(fetch).toHaveBeenLastCalledWith('/api/movies/2', expect.objectContaining({ method: 'DELETE' }))
  })
})
