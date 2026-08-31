import { useState } from 'react'
import { KeyRound, Users, X } from 'lucide-react'

const COPY = {
  en: {
    close: 'Close account management', eyebrow: 'Administrator', title: 'Account management', intro: 'Review registered accounts and replace a passcode when a member cannot sign in. Existing passcodes are never displayed.',
    username: 'Username', role: 'Role', joined: 'Created', movies: 'Movies', action: 'Action', noAccounts: 'No accounts found.', reset: 'Reset passcode', resetFor: (username) => `Reset passcode for ${username}`, resetIntro: 'This immediately replaces the account passcode. The previous passcode cannot be viewed or recovered.', newPasscode: 'New passcode', confirmPasscode: 'Confirm new passcode', mismatch: 'New passcodes do not match.', updating: 'Resetting…', update: 'Reset passcode', cancel: 'Cancel', loading: 'Loading accounts…'
  },
  zh: {
    close: '关闭账户管理', eyebrow: '管理员', title: '账户管理', intro: '查看已注册账户；当用户无法登录时可重置其口令。系统不会显示已有口令。',
    username: '用户名', role: '角色', joined: '创建时间', movies: '电影数', action: '操作', noAccounts: '未找到账户。', reset: '重置口令', resetFor: (username) => `重置 ${username} 的口令`, resetIntro: '这会立即替换该账户的口令。原口令无法查看或恢复。', newPasscode: '新口令', confirmPasscode: '确认新口令', mismatch: '两次输入的新口令不一致。', updating: '正在重置…', update: '重置口令', cancel: '取消', loading: '正在加载账户…'
  }
}

function formatCreatedAt(value, locale) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function AdminUsersDialog({ language = 'en', users, loading, error, resetError, busy, onClose, onReset }) {
  const copy = COPY[language]
  const [resetUsername, setResetUsername] = useState('')
  const [newPasscode, setNewPasscode] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [formError, setFormError] = useState('')

  function beginReset(username) {
    setResetUsername(username)
    setNewPasscode('')
    setConfirmation('')
    setFormError('')
  }

  async function submit(event) {
    event.preventDefault()
    setFormError('')
    if (newPasscode !== confirmation) {
      setFormError(copy.mismatch)
      return
    }
    if (await onReset(resetUsername, newPasscode)) {
      beginReset('')
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="admin-users-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-users-title">
        <button className="login-close" type="button" onClick={onClose} aria-label={copy.close}><X size={18} /></button>
        <div className="login-lock"><Users size={22} /></div>
        <span className="eyebrow">{copy.eyebrow}</span>
        <h2 id="admin-users-title">{copy.title}</h2>
        <p>{copy.intro}</p>

        {loading ? <div className="admin-users-state">{copy.loading}</div> : error ? <div className="login-error" role="alert">{error}</div> : <div className="admin-users-table-wrap">
          <table className="admin-users-table">
            <thead><tr><th>{copy.username}</th><th>{copy.role}</th><th>{copy.joined}</th><th>{copy.movies}</th><th><span className="sr-only">{copy.action}</span></th></tr></thead>
            <tbody>
              {users.length === 0 ? <tr><td colSpan="5" className="admin-empty">{copy.noAccounts}</td></tr> : users.map((account) => <tr key={account.username}>
                <td><strong>{account.username}</strong></td>
                <td><span className={`account-role ${account.role === 'ADMIN' ? 'admin' : ''}`}>{account.role}</span></td>
                <td>{formatCreatedAt(account.createdAt, language === 'zh' ? 'zh-CN' : 'en-US')}</td>
                <td>{account.movieCount}</td>
                <td><button className="button button-quiet admin-reset-button" type="button" onClick={() => beginReset(account.username)}>{copy.reset}</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>}

        {resetUsername && <form className="admin-reset-form" onSubmit={submit}>
          <div><span className="eyebrow">{copy.resetFor(resetUsername)}</span><p>{copy.resetIntro}</p></div>
          <label><span>{copy.newPasscode}</span><div className="login-input"><KeyRound size={16} /><input aria-label={copy.newPasscode} type="password" autoComplete="new-password" value={newPasscode} onChange={(event) => setNewPasscode(event.target.value)} autoFocus /></div></label>
          <label><span>{copy.confirmPasscode}</span><div className="login-input"><KeyRound size={16} /><input aria-label={copy.confirmPasscode} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div></label>
          {(formError || resetError) && <div className="login-error" role="alert">{formError || resetError}</div>}
          <div className="admin-reset-actions"><button className="button button-quiet" type="button" onClick={() => beginReset('')} disabled={busy}>{copy.cancel}</button><button className="button button-primary" type="submit" disabled={busy || !newPasscode || !confirmation}>{busy ? copy.updating : copy.update}</button></div>
        </form>}
      </section>
    </div>
  )
}
