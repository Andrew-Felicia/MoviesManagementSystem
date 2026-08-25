import { afterEach, describe, expect, it, vi } from 'vitest'
import { movieApi } from './movies'

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }
}

function mockRequest(apiResponse) {
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (url === '/api/auth/csrf') return Promise.resolve(response({ token: 'csrf-token' }))
    return Promise.resolve(apiResponse)
  }))
}

afterEach(() => vi.restoreAllMocks())

describe('movieApi', () => {
  it('loads movies', async () => {
    const movies = [{ id: 1, title: 'Arrival' }]
    mockRequest(response(movies))
    await expect(movieApi.list()).resolves.toEqual(movies)
    expect(fetch).toHaveBeenCalledWith('/api/movies', expect.objectContaining({ credentials: 'same-origin', headers: expect.any(Object) }))
  })

  it('creates a movie with JSON and CSRF protection', async () => {
    const movie = { title: 'Arrival' }
    mockRequest(response({ id: 1, ...movie }, 201))
    await movieApi.create(movie)
    expect(fetch).toHaveBeenCalledWith('/api/movies', expect.objectContaining({ method: 'POST', body: JSON.stringify(movie), headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf-token' }) }))
  })

  it('updates a movie with JSON', async () => {
    const movie = { title: 'Heat', watched: true }
    mockRequest(response({ id: 7, ...movie }))
    await expect(movieApi.update(7, movie)).resolves.toEqual({ id: 7, ...movie })
    expect(fetch).toHaveBeenCalledWith('/api/movies/7', expect.objectContaining({ method: 'PUT' }))
  })

  it('returns null for a successful delete', async () => {
    mockRequest(response(null, 204))
    await expect(movieApi.remove(7)).resolves.toBeNull()
    expect(fetch).toHaveBeenCalledWith('/api/movies/7', expect.objectContaining({ method: 'DELETE' }))
  })

  it('exposes backend field errors', async () => {
    mockRequest(response({ error: 'Validation failed', fieldErrors: { title: 'Title is required' } }, 400))
    await expect(movieApi.create({})).rejects.toMatchObject({ message: 'Validation failed', status: 400, fieldErrors: { title: 'Title is required' } })
  })

  it('handles a non-JSON server error', async () => {
    mockRequest({ ok: false, status: 500, json: () => Promise.reject(new Error('not JSON')) })
    await expect(movieApi.list()).rejects.toMatchObject({ message: 'Request failed (500)', status: 500, fieldErrors: {} })
  })
})
