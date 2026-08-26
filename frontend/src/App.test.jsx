import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const admin = { username: 'admin', role: 'ADMIN' }
const movies = [
  { id: 1, title: 'Arrival', releaseYear: 2016, director: 'Denis Villeneuve', genre: 'Science Fiction', runtimeMinutes: 116, language: 'English', watched: true, personalRating: 9.2, filePath: '/movies/arrival.mkv', notes: null },
  { id: 2, title: 'Heat', releaseYear: 1995, director: 'Michael Mann', genre: 'Crime', runtimeMinutes: 170, language: 'English', watched: false, personalRating: null, filePath: '/movies/heat.mkv', notes: null },
]

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }
}

function mockAuthenticated(...movieResponses) {
  let movieCall = 0
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (url === '/api/auth/me') return Promise.resolve(response(admin))
    if (url === '/api/auth/csrf') return Promise.resolve(response({ token: 'csrf-token', headerName: 'X-XSRF-TOKEN' }))
    return Promise.resolve(movieResponses[movieCall++] || response(movies))
  }))
}

async function openLoginDialog() {
  await userEvent.click(await screen.findByRole('button', { name: 'Login' }))
  return screen.findByRole('dialog', { name: 'Welcome back' })
}

afterEach(() => vi.restoreAllMocks())

describe('App', () => {
  it('shows a session check while authentication is loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    render(<App />)
    expect(screen.getByText('Checking your session…')).toBeInTheDocument()
  })

  it('loads and displays the authenticated library', async () => {
    mockAuthenticated(response(movies))
    render(<App />)
    expect((await screen.findAllByText('Arrival')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Heat').length).toBeGreaterThan(0)
    expect(screen.getByText('2 of 2 titles shown')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('changes the authenticated account passcode', async () => {
    mockAuthenticated(response(movies), response(null, 204))
    render(<App />)
    await screen.findAllByText('Arrival')
    await userEvent.click(screen.getByRole('button', { name: 'Change passcode' }))
    await userEvent.type(screen.getByLabelText('Current passcode'), 'admin')
    await userEvent.type(screen.getByLabelText('New passcode'), 'unique-passcode')
    await userEvent.type(screen.getByLabelText('Confirm new passcode'), 'unique-passcode')
    await userEvent.click(screen.getByRole('button', { name: 'Update passcode' }))

    expect(await screen.findByText('Passcode updated')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Change passcode' })).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/auth/password', expect.objectContaining({ method: 'PUT' }))
  })

  it('shows the login page when no session exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: 'Authentication required' }, 401)))
    render(<App />)
    expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
    await openLoginDialog()
    expect(screen.getByLabelText('Username')).toHaveValue('admin')
    expect(screen.getByRole('button', { name: 'Enter library' })).toBeDisabled()
  })

  it('logs in with administrator credentials and loads the library', async () => {
    vi.stubGlobal('fetch', vi.fn((url, options = {}) => {
      if (url === '/api/auth/me') return Promise.resolve(response({ error: 'Authentication required' }, 401))
      if (url === '/api/auth/csrf') return Promise.resolve(response({ token: 'csrf-token', headerName: 'X-XSRF-TOKEN' }))
      if (url === '/api/auth/login') {
        expect(options.method).toBe('POST')
        expect(options.body.toString()).toBe('username=admin&password=admin')
        return Promise.resolve(response(admin))
      }
      return Promise.resolve(response(movies))
    }))

    render(<App />)
    await openLoginDialog()
    await userEvent.type(screen.getByLabelText('Password'), 'admin')
    await userEvent.click(screen.getByRole('button', { name: 'Enter library' }))
    expect((await screen.findAllByText('Arrival')).length).toBeGreaterThan(0)
    expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
  })

  it('shows invalid credentials returned by the server', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/auth/me') return Promise.resolve(response({ error: 'Authentication required' }, 401))
      if (url === '/api/auth/csrf') return Promise.resolve(response({ token: 'csrf-token' }))
      return Promise.resolve(response({ error: 'Invalid username or password' }, 401))
    }))
    render(<App />)
    await openLoginDialog()
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Enter library' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password')
  })

  it('creates an account and returns to sign in with the new username', async () => {
    vi.stubGlobal('fetch', vi.fn((url, options = {}) => {
      if (url === '/api/auth/me') return Promise.resolve(response({ error: 'Authentication required' }, 401))
      if (url === '/api/auth/csrf') return Promise.resolve(response({ token: 'csrf-token' }))
      if (url === '/api/auth/register') {
        expect(options.method).toBe('POST')
        expect(JSON.parse(options.body)).toEqual({ username: 'filmfan', passcode: 'safe-passcode' })
        return Promise.resolve(response({ username: 'filmfan', role: 'USER' }, 201))
      }
      throw new Error(`Unexpected URL: ${url}`)
    }))

    render(<App />)
    await openLoginDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    await userEvent.type(screen.getByLabelText('Username'), 'filmfan')
    await userEvent.type(screen.getByLabelText('Passcode'), 'safe-passcode')
    await userEvent.type(screen.getByLabelText('Confirm passcode'), 'safe-passcode')
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }))

    expect(await screen.findByText('Account created. Sign in to continue.')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toHaveValue('filmfan')
    expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ method: 'POST' }))
  })

  it('shows a duplicate username error during registration', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/auth/me') return Promise.resolve(response({ error: 'Authentication required' }, 401))
      if (url === '/api/auth/csrf') return Promise.resolve(response({ token: 'csrf-token' }))
      return Promise.resolve(response({ error: 'Username is already registered' }, 409))
    }))

    render(<App />)
    await openLoginDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    await userEvent.type(screen.getByLabelText('Username'), 'admin')
    await userEvent.type(screen.getByLabelText('Passcode'), 'safe-passcode')
    await userEvent.type(screen.getByLabelText('Confirm passcode'), 'safe-passcode')
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Username is already registered')
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument()
  })

  it('signs out and returns to the login page', async () => {
    mockAuthenticated(response(movies), response(null, 204))
    render(<App />)
    await screen.findAllByText('Arrival')
    await userEvent.click(screen.getAllByRole('button', { name: 'Sign out' })[0])
    expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }))
  })

  it('filters titles using search', async () => {
    mockAuthenticated(response(movies))
    render(<App />)
    await screen.findAllByText('Arrival')
    await userEvent.type(screen.getByLabelText('Search library'), 'villeneuve')
    expect(screen.getAllByText('Arrival').length).toBeGreaterThan(0)
    expect(screen.queryByText('Heat')).not.toBeInTheDocument()
  })

  it('opens the add movie form and validates required fields', async () => {
    mockAuthenticated(response([]))
    render(<App />)
    await screen.findByText('No matching titles')
    await userEvent.click(screen.getAllByRole('button', { name: 'Add movie' })[0])
    expect(screen.getByRole('dialog', { name: 'Add a movie' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add to library' }))
    expect(screen.getByText('Enter a title.')).toBeInTheDocument()
    expect(screen.getByText('Enter a director.')).toBeInTheDocument()
  })

  it('shows a retry state when the movie service is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/auth/me') return Promise.resolve(response(admin))
      return Promise.reject(new Error('offline'))
    }))
    render(<App />)
    expect(await screen.findByText('Could not load your library')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))
  })

  it('returns to login if the movie session expires', async () => {
    mockAuthenticated(response({ error: 'Authentication required' }, 401))
    render(<App />)
    expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('adds a valid movie through the form', async () => {
    const created = { ...movies[0], id: 10, title: 'Moon', director: 'Duncan Jones', releaseYear: 2009, runtimeMinutes: 97, filePath: '/movies/moon.mkv' }
    mockAuthenticated(response([]), response(created, 201))
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
    mockAuthenticated(response(movies), response({ ...movies[1], watched: true }))
    render(<App />)
    await screen.findAllByText('Heat')
    await userEvent.click(screen.getByRole('button', { name: 'Mark Heat as watched' }))
    await waitFor(() => expect(fetch).toHaveBeenLastCalledWith('/api/movies/2', expect.objectContaining({ method: 'PUT' })))
    expect(await screen.findByText('Marked as watched')).toBeInTheDocument()
  })

  it('edits and immediately displays a movie runtime', async () => {
    const updated = { ...movies[0], runtimeMinutes: 135 }
    mockAuthenticated(response(movies), response(updated))
    render(<App />)
    await screen.findAllByText('Arrival')

    await userEvent.click(screen.getByRole('button', { name: 'Edit Arrival' }))
    const runtime = screen.getByLabelText('Runtime (minutes)')
    expect(runtime).toHaveValue(116)
    await userEvent.clear(runtime)
    await userEvent.type(runtime, '135')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect((await screen.findAllByText('135 min')).length).toBeGreaterThan(0)
    expect(fetch).toHaveBeenLastCalledWith('/api/movies/1', expect.objectContaining({
      method: 'PUT',
      body: expect.stringContaining('"runtimeMinutes":135'),
    }))
  })

  it('confirms and deletes a catalog entry', async () => {
    mockAuthenticated(response(movies), response(null, 204))
    render(<App />)
    await screen.findAllByText('Heat')
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete Heat' })[0])
    expect(screen.getByRole('alertdialog', { name: 'Remove “Heat”?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(screen.queryAllByText('Heat')).toHaveLength(0))
    expect(fetch).toHaveBeenLastCalledWith('/api/movies/2', expect.objectContaining({ method: 'DELETE' }))
  })
})
