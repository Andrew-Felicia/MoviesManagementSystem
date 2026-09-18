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
  function mockUpload() {
    const xhr = { upload: {}, open: vi.fn(), setRequestHeader: vi.fn(), send: vi.fn() }
    vi.stubGlobal('XMLHttpRequest', vi.fn(function () { return xhr }))
    mockRequest(response({}))
    return xhr
  }

  it('reports uploaded bytes separately from server saving and keeps CSRF protection', async () => {
    const xhr = mockUpload()
    const progress = vi.fn()
    const movies = [{ title: 'Arrival' }]
    const pending = movieApi.createBatch(movies, progress)
    await vi.waitFor(() => expect(xhr.send).toHaveBeenCalled())
    expect(xhr.open).toHaveBeenCalledWith('POST', '/api/movies/batch')
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-XSRF-TOKEN', 'csrf-token')
    expect(xhr.send).toHaveBeenCalledWith(JSON.stringify({ movies }))
    expect(progress).toHaveBeenCalledWith({ stage: 'preparing' })
    xhr.upload.onprogress({ lengthComputable: true, loaded: 42, total: 100 })
    expect(progress).toHaveBeenLastCalledWith({ stage: 'uploading', percent: 42 })
    xhr.upload.onprogress({ lengthComputable: false })
    expect(progress).toHaveBeenLastCalledWith({ stage: 'uploading', percent: undefined })
    xhr.upload.onload()
    expect(progress).toHaveBeenLastCalledWith({ stage: 'saving' })
    xhr.status = 201
    xhr.response = { importedCount: 1, movies }
    xhr.onload()
    await expect(pending).resolves.toEqual(xhr.response)
  })

  it.each([
    [400, { error: 'Invalid poster', fieldErrors: { posterUrl: 'Too large' } }, 'Invalid poster'],
    [413, null, 'Request failed (413)'],
  ])('preserves upload HTTP errors (%s)', async (status, body, message) => {
    const xhr = mockUpload()
    const pending = movieApi.createBatch([], vi.fn())
    await vi.waitFor(() => expect(xhr.send).toHaveBeenCalled())
    xhr.status = status
    xhr.response = body
    xhr.onload()
    await expect(pending).rejects.toMatchObject({ status, message, fieldErrors: body?.fieldErrors || {} })
  })

  it.each(['onerror', 'onabort'])('handles interrupted uploads (%s)', async (event) => {
    const xhr = mockUpload()
    const pending = movieApi.createBatch([], vi.fn())
    await vi.waitFor(() => expect(xhr.send).toHaveBeenCalled())
    xhr[event]()
    await expect(pending).rejects.toThrow('duplicate movies will be skipped')
  })
  it('loads a single movie using the session cookie', async () => {
    const movie = { id: 1, title: 'Arrival' }
    mockRequest(response(movie))
    await expect(movieApi.get(1)).resolves.toEqual(movie)
    expect(fetch).toHaveBeenCalledWith('/api/movies/1', expect.objectContaining({ credentials: 'same-origin' }))
    expect(fetch).toHaveBeenCalledTimes(1)
  })

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

  it('creates movies in one batch request', async () => {
    const movies = [{ title: 'Arrival' }, { title: 'Heat' }]
    mockRequest(response({ importedCount: 2, skippedDuplicates: 0, movies }, 201))

    await expect(movieApi.createBatch(movies)).resolves.toMatchObject({ importedCount: 2 })
    expect(fetch).toHaveBeenCalledWith('/api/movies/batch', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ movies }),
      headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf-token' }),
    }))
  })

  it('updates a movie with JSON', async () => {
    const movie = { title: 'Heat', watched: true }
    mockRequest(response({ id: 7, ...movie }))
    await expect(movieApi.update(7, movie)).resolves.toEqual({ id: 7, ...movie })
    expect(fetch).toHaveBeenCalledWith('/api/movies/7', expect.objectContaining({ method: 'PUT' }))
  })

  it('runs owner-scoped bulk watch, unwatch, and delete actions', async () => {
    mockRequest(response({ affectedCount: 3 }))

    await expect(movieApi.markAllWatched()).resolves.toEqual({ affectedCount: 3 })
    await expect(movieApi.markAllUnwatched()).resolves.toEqual({ affectedCount: 3 })
    await expect(movieApi.removeAll()).resolves.toEqual({ affectedCount: 3 })
    expect(fetch).toHaveBeenCalledWith('/api/movies/batch/watched', expect.objectContaining({ method: 'PUT', headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf-token' }) }))
    expect(fetch).toHaveBeenCalledWith('/api/movies/batch/unwatched', expect.objectContaining({ method: 'PUT', headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf-token' }) }))
    expect(fetch).toHaveBeenCalledWith('/api/movies/batch', expect.objectContaining({ method: 'DELETE', headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf-token' }) }))
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
