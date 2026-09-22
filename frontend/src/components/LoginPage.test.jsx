import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'

async function openLogin() {
  await userEvent.click(screen.getByRole('button', { name: 'Login' }))
  return screen.findByRole('dialog', { name: 'Welcome back' })
}

describe('LoginPage', () => {
  it('shows the full landing page and keeps the login form hidden initially', async () => {
    render(<LoginPage busy={false} error="" onLogin={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'Scroll to explore Framebase' })).toHaveAttribute('href', '#organize')
    expect(screen.getByRole('group', { name: 'Interactive movie poster book' })).toBeInTheDocument()
    expect(document.querySelector('.book-section-number')).toHaveTextContent('02')
    expect(document.querySelector('.showcase-index')).toHaveTextContent('03 / IMDb SELECTS')
    expect(screen.getByRole('heading', { name: 'Your films are waiting.' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'The Shawshank Redemption, 1994 IMDb poster' })).toHaveAttribute('src', '/posters/reel/tt0111161.jpg')
    expect(screen.getByRole('img', { name: /Interstellar/ })).toHaveAttribute('src', '/posters/reel/tt0816692.jpg')
    expect(screen.getByRole('img', { name: 'The Godfather, 1972 IMDb poster' })).toHaveAttribute('src', '/posters/reel/tt0068646.jpg')
    expect(screen.getByRole('heading', { name: /Eight films/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Pulp Fiction on IMDb' })).toHaveAttribute('href', 'https://www.imdb.com/title/tt0110912/')
    expect(screen.getByRole('img', { name: 'Pulp Fiction IMDb poster' })).toHaveAttribute('src', '/posters/reel/tt0110912.jpg')
    expect(screen.queryByRole('heading', { name: /Catalog.*Watch.*Remember/i })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Animated movie poster reel' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Keep the reel moving.' })).not.toBeInTheDocument()
    const reels = document.querySelectorAll('.closing-filmstrip')
    expect(reels).toHaveLength(4)
    const uniquePosters = new Set()
    reels.forEach((reel) => {
      const posters = Array.from(reel.querySelectorAll('img'), (image) => image.getAttribute('src'))
      expect(posters).toHaveLength(30)
      expect(new Set(posters).size).toBe(15)
      posters.slice(0, 15).forEach((poster) => uniquePosters.add(poster))
    })
    expect(uniquePosters.size).toBe(60)
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
    await openLogin()
    expect(screen.getByLabelText('Username')).toHaveValue('admin')
  })

  it('turns persistent book leaves by swiping instead of clicking', async () => {
    render(<LoginPage busy={false} error="" onLogin={vi.fn()} />)
    const swipe = (from, to, pointerId) => {
      for (const [type, clientX] of [['pointerdown', from], ['pointermove', to], ['pointerup', to]]) {
        const event = new MouseEvent(type, { bubbles: true, button: 0, clientX })
        Object.defineProperty(event, 'pointerId', { value: pointerId })
        fireEvent(book, event)
      }
    }

    const book = screen.getByRole('group', { name: 'Interactive movie poster book' })
    expect(screen.getByRole('img', { name: 'Movie poster page 1' })).toHaveAttribute('src', expect.stringContaining('001-tt0111161.jpg'))
    expect(screen.getByText('Spread 1 of 31')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /poster spread/i })).not.toBeInTheDocument()
    expect(book.querySelectorAll('.book-leaf')).toHaveLength(3)
    const firstLeaf = document.querySelector('.book-leaf')
    const firstLeafPosters = Array.from(firstLeaf.querySelectorAll('img'), (image) => image.getAttribute('src'))

    await userEvent.click(screen.getByRole('img', { name: 'Movie poster page 2' }))
    expect(screen.getByText('Spread 1 of 31')).toBeInTheDocument()

    swipe(520, 120, 1)
    expect(screen.getByRole('img', { name: 'Movie poster page 3' })).toBeInTheDocument()
    expect(screen.getByText('Spread 2 of 31')).toBeInTheDocument()

    swipe(120, 520, 2)
    expect(screen.getByRole('img', { name: 'Movie poster page 1' })).toBeInTheDocument()
    expect(document.querySelector('.book-leaf')).toBe(firstLeaf)
    expect(Array.from(firstLeaf.querySelectorAll('img'), (image) => image.getAttribute('src'))).toEqual(firstLeafPosters)

    book.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('img', { name: 'Movie poster page 3' })).toBeInTheDocument()
  })

  it('switches the landing page and login dialog between English and Chinese', async () => {
    function BilingualLoginPage() {
      const [language, setLanguage] = useState('en')
      return <LoginPage busy={false} error="" language={language} onLanguageChange={setLanguage} onLogin={vi.fn()} />
    }
    render(<BilingualLoginPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Switch to Chinese' }))
    expect(document.querySelector('.login-page')).toHaveAttribute('lang', 'zh-CN')
    expect(screen.getByText('管理')).toBeInTheDocument()
    expect(screen.getByText('你的电影')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '你的电影正在等你。' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '登录' }))
    expect(await screen.findByRole('dialog', { name: '欢迎回来' })).toBeInTheDocument()
    expect(screen.getByLabelText('用户名')).toHaveValue('admin')
    expect(screen.getByRole('button', { name: '进入片库' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: '切换到英文' }))
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeInTheDocument()
  })

  it('opens the login dialog from the lower page call to action', async () => {
    render(<LoginPage busy={false} error="" onLogin={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Open Framebase' }))
    expect(await screen.findByRole('dialog', { name: 'Welcome back' })).toBeInTheDocument()
  })

  it('submits trimmed administrator credentials', async () => {
    const onLogin = vi.fn()
    render(<LoginPage busy={false} error="" onLogin={onLogin} />)
    await openLogin()
    await userEvent.clear(screen.getByLabelText('Username'))
    await userEvent.type(screen.getByLabelText('Username'), '  admin  ')
    await userEvent.type(screen.getByLabelText('Password'), 'admin')
    await userEvent.click(screen.getByRole('button', { name: 'Enter library' }))
    expect(onLogin).toHaveBeenCalledWith('admin', 'admin')
  })

  it('reveals and hides the password', async () => {
    render(<LoginPage busy={false} error="" onLogin={vi.fn()} />)
    await openLogin()
    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('shows errors and disables submission while busy', async () => {
    render(<LoginPage busy error="Account locked" onLogin={vi.fn()} />)
    await openLogin()
    expect(screen.getByRole('alert')).toHaveTextContent('Account locked')
    expect(screen.getByRole('button', { name: 'Verifying…' })).toBeDisabled()
  })

  it('switches to account creation and submits matching credentials', async () => {
    const onRegister = vi.fn().mockResolvedValue(true)
    render(<LoginPage busy={false} error="" onLogin={vi.fn()} onRegister={onRegister} />)

    await openLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toHaveValue('')

    await userEvent.type(screen.getByLabelText('Username'), 'New.User')
    expect(screen.getByLabelText('Passcode')).not.toHaveAttribute('minlength')
    expect(screen.getByLabelText('Passcode')).not.toHaveAttribute('maxlength')
    await userEvent.type(screen.getByLabelText('Passcode'), 'x')
    await userEvent.type(screen.getByLabelText('Confirm passcode'), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }))

    expect(onRegister).toHaveBeenCalledWith('New.User', 'x')
    expect(await screen.findByRole('status')).toHaveTextContent('Account created. Sign in to continue.')
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toHaveValue('New.User')
  })

  it('does not register when passcodes differ', async () => {
    const onRegister = vi.fn()
    render(<LoginPage busy={false} error="" onLogin={vi.fn()} onRegister={onRegister} />)
    await openLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    await userEvent.type(screen.getByLabelText('Username'), 'member')
    await userEvent.type(screen.getByLabelText('Passcode'), 'safe-passcode')
    await userEvent.type(screen.getByLabelText('Confirm passcode'), 'other-passcode')
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Passcodes do not match.')
    expect(onRegister).not.toHaveBeenCalled()
  })

  it('can cancel account creation and clears authentication errors', async () => {
    const onClearError = vi.fn()
    render(<LoginPage busy={false} error="Duplicate" onClearError={onClearError} onLogin={vi.fn()} onRegister={vi.fn()} />)
    await openLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    await userEvent.click(screen.getByRole('button', { name: 'Back to sign in' }))

    expect(onClearError).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })

  it('closes the login dialog without hiding the landing page', async () => {
    render(<LoginPage busy={false} error="" onLogin={vi.fn()} />)
    await openLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Close login' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
  })
})
