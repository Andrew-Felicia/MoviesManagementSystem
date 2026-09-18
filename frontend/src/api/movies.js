import { getCsrfHeader } from './auth'

const API_URL = import.meta.env.VITE_API_URL || '/api/movies'

async function request(path = '', options = {}) {
  const method = options.method || 'GET'
  const csrfHeader = ['GET', 'HEAD', 'OPTIONS'].includes(method) ? {} : await getCsrfHeader()
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeader,
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let details
    try {
      details = await response.json()
    } catch {
      details = null
    }

    const error = new Error(details?.error || `Request failed (${response.status})`)
    error.status = response.status
    error.fieldErrors = details?.fieldErrors || {}
    throw error
  }

  if (response.status === 204) return null
  return response.json()
}

async function uploadBatch(movies, onProgress) {
  // XMLHttpRequest exposes upload byte counts; fetch does not.
  onProgress({ stage: 'preparing' })
  const csrfHeader = await getCsrfHeader()
  const body = JSON.stringify({ movies })
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/batch`)
    xhr.responseType = 'json'
    xhr.setRequestHeader('Content-Type', 'application/json')
    for (const [name, value] of Object.entries(csrfHeader)) xhr.setRequestHeader(name, value)
    xhr.upload.onprogress = (event) => onProgress({
      stage: 'uploading',
      percent: event.lengthComputable ? Math.min(100, Math.round(event.loaded / event.total * 100)) : undefined,
    })
    xhr.upload.onload = () => onProgress({ stage: 'saving' })
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response)
      } else {
        const error = new Error(xhr.response?.error || `Request failed (${xhr.status})`)
        error.status = xhr.status
        error.fieldErrors = xhr.response?.fieldErrors || {}
        reject(error)
      }
    }
    xhr.onerror = () => reject(Object.assign(new Error('Connection lost during import. Check your connection and retry; duplicate movies will be skipped.'), { code: 'IMPORT_NETWORK' }))
    xhr.onabort = () => reject(Object.assign(new Error('Import was interrupted. You can retry; duplicate movies will be skipped.'), { code: 'IMPORT_ABORTED' }))
    onProgress({ stage: 'uploading', percent: 0 })
    xhr.send(body)
  })
}

export const movieApi = {
  list: () => request(),
  get: (id) => request(`/${encodeURIComponent(id)}`),
  localizePosters: () => request('/posters/localize', { method: 'POST' }),
  create: (movie) => request('', { method: 'POST', body: JSON.stringify(movie) }),
  createBatch: (movies, onProgress) => onProgress
    ? uploadBatch(movies, onProgress)
    : request('/batch', { method: 'POST', body: JSON.stringify({ movies }) }),
  markAllWatched: () => request('/batch/watched', { method: 'PUT' }),
  markAllUnwatched: () => request('/batch/unwatched', { method: 'PUT' }),
  removeAll: () => request('/batch', { method: 'DELETE' }),
  update: (id, movie) => request(`/${id}`, { method: 'PUT', body: JSON.stringify(movie) }),
  remove: (id) => request(`/${id}`, { method: 'DELETE' }),
}
