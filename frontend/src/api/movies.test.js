import { afterEach, describe, expect, it, vi } from 'vitest'
import { movieApi } from './movies'

afterEach(() => vi.restoreAllMocks())

describe('movieApi', () => {
  it('loads movies', async () => {
    const movies = [{ id: 1, title: 'Arrival' }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(movies) }))
    await expect(movieApi.list()).resolves.toEqual(movies)
    expect(fetch).toHaveBeenCalledWith('/api/movies', expect.objectContaining({ headers: expect.any(Object) }))
  })

  it('creates a movie with JSON', async () => {
    const movie = { title: 'Arrival' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, ...movie }) }))
    await movieApi.create(movie)
    expect(fetch).toHaveBeenCalledWith('/api/movies', expect.objectContaining({ method: 'POST', body: JSON.stringify(movie) }))
  })

  it('returns null for a successful delete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }))
    await expect(movieApi.remove(7)).resolves.toBeNull()
  })

  it('exposes backend field errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({ error: 'Validation failed', fieldErrors: { title: 'Title is required' } }) }))
    await expect(movieApi.create({})).rejects.toMatchObject({ message: 'Validation failed', status: 400, fieldErrors: { title: 'Title is required' } })
  })

  it('handles a non-JSON server error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject(new Error('not JSON')) }))
    await expect(movieApi.list()).rejects.toMatchObject({ message: 'Request failed (500)', status: 500, fieldErrors: {} })
  })
})
