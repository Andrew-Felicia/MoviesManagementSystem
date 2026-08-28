import { useState } from 'react'
import { KeyRound, LockKeyhole, X } from 'lucide-react'

const COPY = {
  en: { close: 'Close passcode dialog', eyebrow: 'Account security', title: 'Change passcode', intro: 'Replace compromised or reused credentials with a unique passcode.', current: 'Current passcode', next: 'New passcode', confirm: 'Confirm new passcode', mismatch: 'New passcodes do not match.', reused: 'Choose a passcode you have not used here before.', updating: 'Updating…', update: 'Update passcode' },
  zh: { close: '关闭口令窗口', eyebrow: '账户安全', title: '修改口令', intro: '使用唯一口令替换已泄露或重复使用的登录凭据。', current: '当前口令', next: '新口令', confirm: '确认新口令', mismatch: '两次输入的新口令不一致。', reused: '请选择一个此前未在这里使用过的口令。', updating: '正在更新…', update: '更新口令' }
}

const CHINESE_ERRORS = {
  'Current passcode is incorrect': '当前口令不正确',
  'New passcode must be different': '新口令必须与当前口令不同'
}

export default function PasswordChangeDialog({ language = 'en', username = '', busy, error, onClose, onSave }) {
  const copy = COPY[language]
  const [currentPasscode, setCurrentPasscode] = useState('')
  const [newPasscode, setNewPasscode] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [formError, setFormError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setFormError('')
    if (newPasscode !== confirmation) {
      setFormError('mismatch')
      return
    }
    if (currentPasscode === newPasscode) {
      setFormError('reused')
      return
    }
    await onSave(currentPasscode, newPasscode)
  }

  return (
    <div className="modal-backdrop">
      <section className="password-dialog" role="dialog" aria-modal="true" aria-labelledby="password-dialog-title">
        <button className="login-close" type="button" onClick={onClose} aria-label={copy.close}><X size={18} /></button>
        <div className="login-lock"><KeyRound size={22} /></div>
        <span className="eyebrow">{copy.eyebrow}</span>
        <h2 id="password-dialog-title">{copy.title}</h2>
        <p>{copy.intro}</p>

        <form className="login-form" onSubmit={submit}>
          <input className="credential-username" id="credential-username" name="username" value={username} readOnly autoComplete="username" aria-hidden="true" tabIndex={-1} />
          <label>
            <span>{copy.current}</span>
            <div className="login-input"><LockKeyhole size={16} /><input id="current-password" aria-label={copy.current} name="current-password" type="password" autoComplete="current-password" value={currentPasscode} onChange={(event) => setCurrentPasscode(event.target.value)} autoFocus /></div>
          </label>
          <label>
            <span>{copy.next}</span>
            <div className="login-input"><KeyRound size={16} /><input id="new-password" aria-label={copy.next} name="new-password" type="password" autoComplete="new-password" value={newPasscode} onChange={(event) => setNewPasscode(event.target.value)} /></div>
          </label>
          <label>
            <span>{copy.confirm}</span>
            <div className="login-input"><KeyRound size={16} /><input id="confirm-password" aria-label={copy.confirm} name="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
          </label>

          {(formError || error) && <div className="login-error" role="alert">{formError ? copy[formError] : language === 'zh' ? (CHINESE_ERRORS[error] || error) : error}</div>}
          <button className="button button-primary login-submit" type="submit" disabled={busy || !currentPasscode || !newPasscode || !confirmation}>{busy ? copy.updating : copy.update}</button>
        </form>
      </section>
    </div>
  )
}
