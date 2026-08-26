import { useState } from 'react'
import { KeyRound, LockKeyhole, X } from 'lucide-react'

export default function PasswordChangeDialog({ busy, error, onClose, onSave }) {
  const [currentPasscode, setCurrentPasscode] = useState('')
  const [newPasscode, setNewPasscode] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [formError, setFormError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setFormError('')
    if (newPasscode !== confirmation) {
      setFormError('New passcodes do not match.')
      return
    }
    if (currentPasscode === newPasscode) {
      setFormError('Choose a passcode you have not used here before.')
      return
    }
    await onSave(currentPasscode, newPasscode)
  }

  return (
    <div className="modal-backdrop">
      <section className="password-dialog" role="dialog" aria-modal="true" aria-labelledby="password-dialog-title">
        <button className="login-close" type="button" onClick={onClose} aria-label="Close passcode dialog"><X size={18} /></button>
        <div className="login-lock"><KeyRound size={22} /></div>
        <span className="eyebrow">Account security</span>
        <h2 id="password-dialog-title">Change passcode</h2>
        <p>Replace compromised or reused credentials with a unique passcode.</p>

        <form className="login-form" onSubmit={submit}>
          <label>
            <span>Current passcode</span>
            <div className="login-input"><LockKeyhole size={16} /><input aria-label="Current passcode" type="password" autoComplete="current-password" value={currentPasscode} onChange={(event) => setCurrentPasscode(event.target.value)} autoFocus /></div>
          </label>
          <label>
            <span>New passcode</span>
            <div className="login-input"><KeyRound size={16} /><input aria-label="New passcode" type="password" autoComplete="new-password" value={newPasscode} onChange={(event) => setNewPasscode(event.target.value)} /></div>
          </label>
          <label>
            <span>Confirm new passcode</span>
            <div className="login-input"><KeyRound size={16} /><input aria-label="Confirm new passcode" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
          </label>

          {(formError || error) && <div className="login-error" role="alert">{formError || error}</div>}
          <button className="button button-primary login-submit" type="submit" disabled={busy || !currentPasscode || !newPasscode || !confirmation}>{busy ? 'Updating…' : 'Update passcode'}</button>
        </form>
      </section>
    </div>
  )
}
