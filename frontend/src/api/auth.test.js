import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let authApi
let getCsrfHeader

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }
}

beforeEach(async () => {
  vi.resetModules()
  ;({ authApi, getCsrfHeader } = await import('./auth'))
})

afterEach(() => vi.restoreAllMocks())

describe('authApi', () => {
  it('loads the current session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ username: 'admin', role: 'ADMIN' })))
    await expect(authApi.me()).resolves.toEqual({ username: 'admin', role: 'ADMIN' })
    expect(fetch).toHaveBeenCalledWith('/api/auth/me', { credentials: 'same-origin' })
  })

  it('reports an unauthenticated session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: 'Authentication required' }, 401)))
    await expect(authApi.me()).rejects.toMatchObject({ message: 'Authentication required', status: 401 })
  })

  it('logs in, refreshes CSRF, and returns the user', async () => {
    let csrfCalls = 0
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/auth/csrf') {
        csrfCalls += 1
        return Promise.resolve(response({ token: `csrf-${csrfCalls}` }))
      }
      return Promise.resolve(response({ username: 'admin', role: 'ADMIN' }))
    }))
    await expect(authApi.login('admin', 'admin')).resolves.toEqual({ username: 'admin', role: 'ADMIN' })
    expect(csrfCalls).toBe(2)
    expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf-1' }),
      body: new URLSearchParams({ username: 'admin', password: 'admin' }),
    }))
    await expect(getCsrfHeader()).resolves.toEqual({ 'X-XSRF-TOKEN': 'csrf-2' })
  })

  it('uses the server message when login fails', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => url.endsWith('/csrf') ? Promise.resolve(response({ token: 'csrf-token' })) : Promise.resolve(response({ error: 'Invalid username or password' }, 401))))
    await expect(authApi.login('admin', 'wrong')).rejects.toThrow('Invalid username or password')
  })

  it('registers an account using JSON and CSRF', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.endsWith('/csrf')) return Promise.resolve(response({ token: 'csrf-token' }))
      return Promise.resolve(response({ username: 'new-user', role: 'USER' }, 201))
    }))

    await expect(authApi.register('new-user', 'safe-passcode'))
      .resolves.toEqual({ username: 'new-user', role: 'USER' })
    expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': 'csrf-token' },
      body: JSON.stringify({ username: 'new-user', passcode: 'safe-passcode' }),
    }))
  })

  it('shows a registration field error returned by the server', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => url.endsWith('/csrf')
      ? Promise.resolve(response({ token: 'csrf-token' }))
      : Promise.resolve(response({ error: 'Validation failed', fieldErrors: { username: 'Username contains invalid characters' } }, 400))))

    await expect(authApi.register('bad user', 'x')).rejects.toThrow('Username contains invalid characters')
  })

  it('shows duplicate username conflicts returned by the server', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => url.endsWith('/csrf')
      ? Promise.resolve(response({ token: 'csrf-token' }))
      : Promise.resolve(response({ error: 'Username is already registered' }, 409))))

    await expect(authApi.register('admin', 'safe-passcode')).rejects.toThrow('Username is already registered')
  })

  it('changes the authenticated passcode using JSON and CSRF', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => url.endsWith('/csrf')
      ? Promise.resolve(response({ token: 'csrf-token' }))
      : Promise.resolve(response(null, 204))))

    await expect(authApi.changePassword('admin', 'unique-passcode')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith('/api/auth/password', expect.objectContaining({
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': 'csrf-token' },
      body: JSON.stringify({ currentPasscode: 'admin', newPasscode: 'unique-passcode' }),
    }))
  })

  it('reports a rejected passcode change', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => url.endsWith('/csrf')
      ? Promise.resolve(response({ token: 'csrf-token' }))
      : Promise.resolve(response({ error: 'Current passcode is incorrect' }, 400))))

    await expect(authApi.changePassword('wrong', 'new')).rejects.toThrow('Current passcode is incorrect')
  })

  it('falls back when an error response is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: () => Promise.reject(new Error('not JSON')) }))
    await expect(authApi.me()).rejects.toMatchObject({ message: 'Authentication required', status: 503 })
  })

  it('rejects when CSRF initialization fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, 500)))
    await expect(getCsrfHeader()).rejects.toThrow('Could not initialize request security')
  })

  it('signs out with CSRF and clears the cached token', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => url.endsWith('/csrf') ? Promise.resolve(response({ token: 'csrf-token' })) : Promise.resolve(response(null, 204))))
    await expect(authApi.logout()).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST', headers: { 'X-XSRF-TOKEN': 'csrf-token' } }))
  })

  it('reports a logout failure', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => url.endsWith('/csrf') ? Promise.resolve(response({ token: 'csrf-token' })) : Promise.resolve(response({ error: 'Could not sign out' }, 500))))
    await expect(authApi.logout()).rejects.toThrow('Could not sign out')
  })
})
