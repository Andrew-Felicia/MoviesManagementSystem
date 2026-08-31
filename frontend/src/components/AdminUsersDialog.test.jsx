import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AdminUsersDialog from './AdminUsersDialog'

const users = [
  { username: 'admin', role: 'ADMIN', createdAt: '2026-08-31T09:30:00', movieCount: 500 },
  { username: 'member', role: 'USER', createdAt: '2026-08-31T10:30:00', movieCount: 3 },
]

describe('AdminUsersDialog', () => {
  it('shows safe account information and resets a selected account passcode', async () => {
    const onReset = vi.fn().mockResolvedValue(true)
    render(<AdminUsersDialog users={users} loading={false} error="" resetError="" busy={false} onClose={vi.fn()} onReset={onReset} />)

    expect(screen.getByRole('dialog', { name: 'Account management' })).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.queryByText('passwordHash')).not.toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('button', { name: 'Reset passcode' })[1])
    expect(screen.getByText('Reset passcode for member')).toBeInTheDocument()
    expect(screen.getByLabelText('New passcode')).toHaveAttribute('autocomplete', 'new-password')
    await userEvent.type(screen.getByLabelText('New passcode'), 'new-member-passcode')
    await userEvent.type(screen.getByLabelText('Confirm new passcode'), 'new-member-passcode')
    await userEvent.click(screen.getAllByRole('button', { name: 'Reset passcode' }).at(-1))

    expect(onReset).toHaveBeenCalledWith('member', 'new-member-passcode')
    expect(screen.queryByText('Reset passcode for member')).not.toBeInTheDocument()
  })

  it('rejects locally mismatched passcodes and renders loading, errors, and close controls', async () => {
    const onClose = vi.fn()
    const onReset = vi.fn()
    const { rerender } = render(<AdminUsersDialog users={users} loading={false} error="" resetError="" busy={false} onClose={onClose} onReset={onReset} />)
    await userEvent.click(screen.getAllByRole('button', { name: 'Reset passcode' })[0])
    await userEvent.type(screen.getByLabelText('New passcode'), 'first')
    await userEvent.type(screen.getByLabelText('Confirm new passcode'), 'second')
    await userEvent.click(screen.getAllByRole('button', { name: 'Reset passcode' }).at(-1))
    expect(screen.getByRole('alert')).toHaveTextContent('New passcodes do not match.')
    expect(onReset).not.toHaveBeenCalled()

    rerender(<AdminUsersDialog users={[]} loading error="" resetError="" busy={false} onClose={onClose} onReset={onReset} />)
    expect(screen.getByText('Loading accounts…')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Close account management' }))
    expect(onClose).toHaveBeenCalled()
  })
})
