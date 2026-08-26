import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'

async function openLogin() {
  await userEvent.click(screen.getByRole('button', { name: 'Login' }))
  return screen.findByRole('dialog', { name: 'Welcome back' })
}

describe('LoginPage', () => {
  it('shows the full landing page and keeps the login form hidden initially', async () => {
    render(<LoginPage busy={false} error="" onLogin={vi.fn()} />)

    expect(screen.getByText('Private collection access')).toBeInTheDocument()
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
    await openLogin()
    expect(screen.getByLabelText('Username')).toHaveValue('admin')
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
