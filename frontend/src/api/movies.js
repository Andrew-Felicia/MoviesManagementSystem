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

export const movieApi = {
  list: () => request(),
  create: (movie) => request('', { method: 'POST', body: JSON.stringify(movie) }),
  createBatch: (movies) => request('/batch', { method: 'POST', body: JSON.stringify({ movies }) }),
  update: (id, movie) => request(`/${id}`, { method: 'PUT', body: JSON.stringify(movie) }),
  remove: (id) => request(`/${id}`, { method: 'DELETE' }),
}
