import { useState } from 'react'
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { BrandMark } from './Icons'
import WaveText from './WaveText'

export default function LoginPage({ busy, error, onClearError = () => {}, onLogin, onRegister }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit(event) {
    event.preventDefault()
    const cleanUsername = username.trim()
    setFormError('')
    setSuccess('')

    if (mode === 'login') {
      if (cleanUsername && password) await onLogin(cleanUsername, password)
      return
    }
    if (password !== confirmation) {
      setFormError('Passcodes do not match.')
      return
    }

    const created = await onRegister(cleanUsername, password)
    if (created) {
      setMode('login')
      setPassword('')
      setConfirmation('')
      setSuccess('Account created. Sign in to continue.')
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setUsername(nextMode === 'register' ? '' : 'admin')
    setPassword('')
    setConfirmation('')
    setFormError('')
    setSuccess('')
    setShowPassword(false)
    onClearError()
  }

  const registering = mode === 'register'

  return (
    <main className="login-page">
      <section className="login-story">
        <header className="login-topbar">
          <a className="brand login-brand" href="/" aria-label="Framebase home">
            <BrandMark />
            <span><strong>FRAMEBASE</strong><small>Personal movie index</small></span>
          </a>
          <button className="button button-primary login-nav-button" type="button" onClick={() => setPanelOpen(true)}>
            <LockKeyhole size={15} />Login
          </button>
        </header>
        <div className="login-copy">
{/*           <span className="eyebrow">Private collection access</span> */}
          <h1><WaveText text="Manage." /><br /><em> </em><br /><em><WaveText text="     Your films." /></em></h1>
{/*           <p>One secure doorway to your catalog, ratings, watch history, and every movie night ahead.</p> */}
        </div>
{/*         <div className="login-security-note"> */}
{/*           <ShieldCheck size={18} /> */}
{/*           <span><strong>Session protected</strong><small>Credentials are verified on the server</small></span> */}
{/*         </div> */}
        <div className="login-frame" aria-hidden="true"><span>24</span><small>frames / second</small></div>
      </section>

      {panelOpen && <div className="login-modal-backdrop">
        <section className="login-panel" role="dialog" aria-modal="true" aria-labelledby="login-dialog-title">
          <button className="login-close" type="button" onClick={() => setPanelOpen(false)} aria-label="Close login"><X size={18} /></button>
          <div className="login-card">
            <div className="login-lock"><LockKeyhole size={22} /></div>
            <span className="eyebrow">{registering ? 'New member access' : 'Secure member portal'}</span>
            <h2 id="login-dialog-title">{registering ? 'Create account' : 'Welcome back'}</h2>
            <p className="login-intro">{registering ? 'Choose a username and passcode for your library access.' : 'Sign in to continue to the movie library.'}</p>

            <form className="login-form" onSubmit={submit}>
              <label>
                <span>Username</span>
                <div className="login-input"><KeyRound size={16} /><input aria-label="Username" name="username" autoComplete="username" minLength={registering ? 3 : undefined} maxLength={50} pattern={registering ? '[A-Za-z0-9._-]+' : undefined} value={username} onChange={(event) => setUsername(event.target.value)} /></div>
              </label>
              <label>
                <span>{registering ? 'Passcode' : 'Password'}</span>
                <div className="login-input"><LockKeyhole size={16} /><input aria-label={registering ? 'Passcode' : 'Password'} name="password" type={showPassword ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} autoFocus /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              </label>

              {registering && <label>
                <span>Confirm passcode</span>
                <div className="login-input"><ShieldCheck size={16} /><input aria-label="Confirm passcode" name="confirmation" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
              </label>}

              {(formError || error) && <div className="login-error" role="alert">{formError || error}</div>}
              {success && <div className="login-success" role="status">{success}</div>}

              <button className="button button-primary login-submit" type="submit" disabled={busy || !username.trim() || !password || (registering && !confirmation)}>{busy ? (registering ? 'Creating…' : 'Verifying…') : (registering ? 'Create my account' : 'Enter library')}</button>
            </form>

            <div className="login-switch">
              <span>{registering ? 'Already have an account?' : 'New to Framebase?'}</span>
              <button type="button" onClick={() => changeMode(registering ? 'login' : 'register')}>{registering ? 'Back to sign in' : 'Create an account'}</button>
            </div>
            <p className="login-help">Passcodes are securely hashed and never stored as readable text.</p>
          </div>
        </section>
      </div>}
    </main>
  )
}
