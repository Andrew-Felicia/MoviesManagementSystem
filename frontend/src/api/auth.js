const AUTH_URL = import.meta.env.VITE_AUTH_URL || '/api/auth'
let csrfToken = null

async function readError(response, fallback) {
  try {
    const body = await response.json()
    const firstFieldError = body.fieldErrors && Object.values(body.fieldErrors)[0]
    return firstFieldError || body.error || fallback
  } catch {
    return fallback
  }
}

export async function getCsrfHeader(force = false) {
  if (!csrfToken || force) {
    const response = await fetch(`${AUTH_URL}/csrf`, { credentials: 'same-origin' })
    if (!response.ok) throw new Error('Could not initialize request security')
    const body = await response.json()
    csrfToken = body.token
  }
  return { 'X-XSRF-TOKEN': csrfToken }
}

export const authApi = {
  async me() {
    const response = await fetch(`${AUTH_URL}/me`, { credentials: 'same-origin' })
    if (!response.ok) {
      const error = new Error(await readError(response, 'Authentication required'))
      error.status = response.status
      throw error
    }
    return response.json()
  },

  async login(username, password) {
    const csrfHeader = await getCsrfHeader()
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...csrfHeader },
      body: new URLSearchParams({ username, password }),
    })
    if (!response.ok) {
      throw new Error(await readError(response, 'Invalid username or password'))
    }
    csrfToken = null
    await getCsrfHeader(true)
    return response.json()
  },

  async register(username, passcode) {
    const response = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...await getCsrfHeader() },
      body: JSON.stringify({ username, passcode }),
    })
    if (!response.ok) {
      throw new Error(await readError(response, 'Could not create account'))
    }
    return response.json()
  },

  async changePassword(currentPasscode, newPasscode) {
    const response = await fetch(`${AUTH_URL}/password`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...await getCsrfHeader() },
      body: JSON.stringify({ currentPasscode, newPasscode }),
    })
    if (!response.ok) {
      throw new Error(await readError(response, 'Could not change passcode'))
    }
  },

  async adminStats() {
    const response = await fetch('/api/admin/stats', { credentials: 'same-origin' })
    if (!response.ok) {
      const error = new Error(await readError(response, 'Could not load administrator statistics'))
      error.status = response.status
      throw error
    }
    return response.json()
  },

  async adminUsers() {
    const response = await fetch('/api/admin/users', { credentials: 'same-origin' })
    if (!response.ok) {
      const error = new Error(await readError(response, 'Could not load registered accounts'))
      error.status = response.status
      throw error
    }
    return response.json()
  },

  async resetUserPassword(username, newPasscode) {
    const response = await fetch(`/api/admin/users/${encodeURIComponent(username)}/password`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...await getCsrfHeader() },
      body: JSON.stringify({ newPasscode }),
    })
    if (!response.ok) {
      const error = new Error(await readError(response, 'Could not reset passcode'))
      error.status = response.status
      throw error
    }
  },

  async logout() {
    const response = await fetch(`${AUTH_URL}/logout`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: await getCsrfHeader(),
    })
    csrfToken = null
    if (!response.ok) throw new Error(await readError(response, 'Could not sign out'))
  },
}
