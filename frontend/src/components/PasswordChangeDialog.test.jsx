import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PasswordChangeDialog from './PasswordChangeDialog'

describe('PasswordChangeDialog', () => {
  it('submits a different confirmed passcode', async () => {
    const onSave = vi.fn()
    render(<PasswordChangeDialog busy={false} error="" onClose={vi.fn()} onSave={onSave} />)

    await userEvent.type(screen.getByLabelText('Current passcode'), 'admin')
    await userEvent.type(screen.getByLabelText('New passcode'), 'unique-passcode')
    await userEvent.type(screen.getByLabelText('Confirm new passcode'), 'unique-passcode')
    await userEvent.click(screen.getByRole('button', { name: 'Update passcode' }))

    expect(onSave).toHaveBeenCalledWith('admin', 'unique-passcode')
  })

  it('rejects mismatched and reused passcodes locally', async () => {
    const onSave = vi.fn()
    render(<PasswordChangeDialog busy={false} error="" onClose={vi.fn()} onSave={onSave} />)
    await userEvent.type(screen.getByLabelText('Current passcode'), 'old')
    await userEvent.type(screen.getByLabelText('New passcode'), 'new')
    await userEvent.type(screen.getByLabelText('Confirm new passcode'), 'different')
    await userEvent.click(screen.getByRole('button', { name: 'Update passcode' }))
    expect(screen.getByRole('alert')).toHaveTextContent('New passcodes do not match.')

    await userEvent.clear(screen.getByLabelText('New passcode'))
    await userEvent.type(screen.getByLabelText('New passcode'), 'old')
    await userEvent.clear(screen.getByLabelText('Confirm new passcode'))
    await userEvent.type(screen.getByLabelText('Confirm new passcode'), 'old')
    await userEvent.click(screen.getByRole('button', { name: 'Update passcode' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a passcode you have not used here before.')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows server errors, busy state, and closes', async () => {
    const onClose = vi.fn()
    render(<PasswordChangeDialog busy error="Current passcode is incorrect" onClose={onClose} onSave={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Current passcode is incorrect')
    expect(screen.getByRole('button', { name: 'Updating…' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Close passcode dialog' }))
    expect(onClose).toHaveBeenCalled()
  })
})
