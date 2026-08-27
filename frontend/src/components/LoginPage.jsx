import { useState } from 'react'
import { ArrowDown, Check, Clock3, Eye, EyeOff, Film, KeyRound, Languages, LockKeyhole, Search, ShieldCheck, Star, X } from 'lucide-react'
import { BrandMark } from './Icons'

const COPY = {
  en: {
    locale: 'en', brandSubtitle: 'Personal movie index', switchLanguage: 'Switch to Chinese', switchText: '中文', login: 'Login',
    manage: 'Manage', yourFilms: 'Your films', posterGallery: 'Classic cinema poster gallery', scrollLabel: 'Scroll to explore Framebase', scroll: 'Scroll to explore',
    collectionEyebrow: 'Your collection, in focus', collectionTitle: 'Everything worth watching.', collectionAccent: 'Easy to find again.', collectionBody: 'Framebase turns a scattered list of files and memories into one searchable, personal film index.',
    exampleIndex: 'Example movie index', searchLibrary: 'Search your library', threeTitles: '3 titles', scienceFiction: 'Science Fiction', crime: 'Crime', thriller: 'Thriller', watchlist: 'Watchlist', watched: 'Watched',
    featuresEyebrow: 'Built around your movie nights', featuresTitle: 'Less searching.', featuresAccent: 'More watching.',
    featureOneTitle: 'Keep one catalog', featureOneBody: 'Save titles, directors, genres, languages, runtimes, and the location of every movie file.',
    featureTwoTitle: 'Track every watch', featureTwoBody: 'See what you have finished, what is still waiting, and how much time you have spent watching.',
    featureThreeTitle: 'Remember your favorites', featureThreeBody: 'Add personal ratings and notes so the films that stayed with you never disappear into the list.',
    privateEyebrow: 'Private by design', ctaTitle: 'Your films are waiting.', ctaBody: 'Sign in to open your collection, or create an account to start a new one.', openFramebase: 'Open Framebase', footer: 'Your collection. Your ratings. Your next movie.', backToTop: 'Back to top',
    closeLogin: 'Close login', newMember: 'New member access', securePortal: 'Secure member portal', createAccount: 'Create account', welcomeBack: 'Welcome back',
    registerIntro: 'Choose a username and passcode for your library access.', loginIntro: 'Sign in to continue to the movie library.', username: 'Username', passcode: 'Passcode', password: 'Password', confirmPasscode: 'Confirm passcode',
    hidePassword: 'Hide password', showPassword: 'Show password', passcodesMismatch: 'Passcodes do not match.', accountCreated: 'Account created. Sign in to continue.', creating: 'Creating…', verifying: 'Verifying…', createMyAccount: 'Create my account', enterLibrary: 'Enter library',
    alreadyAccount: 'Already have an account?', newToFramebase: 'New to Framebase?', backToSignIn: 'Back to sign in', createAnAccount: 'Create an account', passcodeHelp: 'Passcodes are securely hashed and never stored as readable text.'
  },
  zh: {
    locale: 'zh-CN', brandSubtitle: '私人电影索引', switchLanguage: '切换到英文', switchText: 'EN', login: '登录',
    manage: '管理', yourFilms: '你的电影', posterGallery: '经典电影海报画廊', scrollLabel: '向下探索 Framebase', scroll: '向下探索',
    collectionEyebrow: '你的收藏，一目了然', collectionTitle: '每一部值得观看的电影。', collectionAccent: '都能轻松再次找到。', collectionBody: 'Framebase 将散落的电影文件与观影记忆，整理成一个可搜索的私人电影索引。',
    exampleIndex: '电影索引示例', searchLibrary: '搜索你的片库', threeTitles: '3 部电影', scienceFiction: '科幻', crime: '犯罪', thriller: '惊悚', watchlist: '待观看', watched: '已观看',
    featuresEyebrow: '为你的电影之夜而生', featuresTitle: '少一点搜索。', featuresAccent: '多一点观影。',
    featureOneTitle: '建立统一片库', featureOneBody: '集中保存片名、导演、类型、语言、时长，以及每个电影文件的位置。',
    featureTwoTitle: '记录每次观看', featureTwoBody: '随时查看已经看完的电影、仍在等待的片单，以及累计观影时间。',
    featureThreeTitle: '记住你的最爱', featureThreeBody: '添加个人评分与笔记，让真正打动你的电影永远不会淹没在列表中。',
    privateEyebrow: '隐私优先设计', ctaTitle: '你的电影正在等你。', ctaBody: '登录即可打开你的收藏，或者创建账户，开始建立新的片库。', openFramebase: '打开 Framebase', footer: '你的收藏。你的评分。你的下一部电影。', backToTop: '返回顶部',
    closeLogin: '关闭登录窗口', newMember: '新用户入口', securePortal: '安全用户入口', createAccount: '创建账户', welcomeBack: '欢迎回来',
    registerIntro: '选择用户名和口令，创建你的片库账户。', loginIntro: '登录以继续进入电影片库。', username: '用户名', passcode: '口令', password: '密码', confirmPasscode: '确认口令',
    hidePassword: '隐藏密码', showPassword: '显示密码', passcodesMismatch: '两次输入的口令不一致。', accountCreated: '账户创建成功，请登录继续。', creating: '正在创建…', verifying: '正在验证…', createMyAccount: '创建我的账户', enterLibrary: '进入片库',
    alreadyAccount: '已经有账户？', newToFramebase: '第一次使用 Framebase？', backToSignIn: '返回登录', createAnAccount: '创建账户', passcodeHelp: '口令会经过安全哈希处理，绝不会以可读文本保存。'
  }
}

const CHINESE_SERVER_ERRORS = {
  'Invalid username or password': '用户名或密码错误',
  'Username is already registered': '该用户名已被注册',
  'The authentication service is not available.': '身份验证服务暂时不可用。'
}

export default function LoginPage({ busy, error, language = 'en', onLanguageChange = () => {}, onClearError = () => {}, onLogin, onRegister }) {
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
      setFormError('passcodesMismatch')
      return
    }

    const created = await onRegister(cleanUsername, password)
    if (created) {
      setMode('login')
      setPassword('')
      setConfirmation('')
      setSuccess('accountCreated')
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
  const t = COPY[language]
  const visibleError = language === 'zh' ? (CHINESE_SERVER_ERRORS[error] || error) : error

  return (
    <main className="login-page" lang={t.locale}>
      <section className="login-story" id="top">
        <header className="login-topbar">
          <a className="brand login-brand" href="/" aria-label={language === 'zh' ? 'Framebase 首页' : 'Framebase home'}>
            <BrandMark />
            <span><strong>FRAMEBASE</strong><small>{t.brandSubtitle}</small></span>
          </a>
          <div className="login-top-actions">
            <button className="language-switch" type="button" onClick={() => onLanguageChange(language === 'en' ? 'zh' : 'en')} aria-label={t.switchLanguage}>
              <Languages size={16} /><span>{t.switchText}</span>
            </button>
            <button className="button button-primary login-nav-button" type="button" onClick={() => setPanelOpen(true)}>
              <LockKeyhole size={15} />{t.login}
            </button>
          </div>
        </header>
        <div className="login-stage">
          <div className="login-copy">
{/*           <span className="eyebrow">Private collection access</span> */}
            <h1><span className="login-title-line">{t.manage}</span><em className="login-title-line">{t.yourFilms}</em></h1>
{/*           <p>One secure doorway to your catalog, ratings, watch history, and every movie night ahead.</p> */}
          </div>

          <div className="login-poster-gallery" aria-label={t.posterGallery}>
            <figure className="classic-poster poster-metropolis">
              <img src="/posters/metropolis-1927.jpg" alt="Metropolis, 1927 classic film poster" width="960" height="1290" />
              <figcaption><strong>Metropolis</strong><span>Fritz Lang · 1927</span></figcaption>
            </figure>
            <figure className="classic-poster poster-caligari">
              <img src="/posters/caligari-1920.jpg" alt="The Cabinet of Dr. Caligari, 1920 classic film poster" width="960" height="1274" />
              <figcaption><strong>The Cabinet of Dr. Caligari</strong><span>Robert Wiene · 1920</span></figcaption>
            </figure>
            <figure className="classic-poster poster-general">
              <img src="/posters/the-general-1926.png" alt="The General, 1926 classic film poster" width="390" height="612" />
              <figcaption><strong>The General</strong><span>Buster Keaton · 1926</span></figcaption>
            </figure>
          </div>
        </div>
{/*         <div className="login-security-note"> */}
{/*           <ShieldCheck size={18} /> */}
{/*           <span><strong>Session protected</strong><small>Credentials are verified on the server</small></span> */}
{/*         </div> */}
        <a className="login-scroll-cue" href="#organize" aria-label={t.scrollLabel}>
          <span>{t.scroll}</span><ArrowDown size={16} />
        </a>
      </section>

      <section className="landing-section landing-intro" id="organize">
        <div className="landing-heading">
          <span className="eyebrow">{t.collectionEyebrow}</span>
          <h2>{t.collectionTitle}<br /><em>{t.collectionAccent}</em></h2>
          <p>{t.collectionBody}</p>
        </div>

        <div className="landing-index" aria-label={t.exampleIndex}>
          <div className="landing-index-toolbar"><Search size={16} /><span>{t.searchLibrary}</span><small>{t.threeTitles}</small></div>
          <div className="landing-index-row"><span className="landing-poster blue">A</span><div><strong>Arrival</strong><small>Denis Villeneuve · 2016</small></div><span>{t.scienceFiction}</span><em><Star size={13} />9.2</em></div>
          <div className="landing-index-row"><span className="landing-poster amber">H</span><div><strong>Heat</strong><small>Michael Mann · 1995</small></div><span>{t.crime}</span><em>{t.watchlist}</em></div>
          <div className="landing-index-row"><span className="landing-poster green">P</span><div><strong>Parasite</strong><small>Bong Joon Ho · 2019</small></div><span>{t.thriller}</span><em><Check size={13} />{t.watched}</em></div>
        </div>
      </section>

      <section className="landing-section landing-features" aria-labelledby="features-title">
        <div className="landing-heading compact">
          <span className="eyebrow">{t.featuresEyebrow}</span>
          <h2 id="features-title">{t.featuresTitle}<br /><em>{t.featuresAccent}</em></h2>
        </div>
        <div className="feature-list">
          <article><span className="feature-number">01</span><Film size={23} /><div><h3>{t.featureOneTitle}</h3><p>{t.featureOneBody}</p></div></article>
          <article><span className="feature-number">02</span><Clock3 size={23} /><div><h3>{t.featureTwoTitle}</h3><p>{t.featureTwoBody}</p></div></article>
          <article><span className="feature-number">03</span><Star size={23} /><div><h3>{t.featureThreeTitle}</h3><p>{t.featureThreeBody}</p></div></article>
        </div>
      </section>

      <section className="landing-cta">
        <div>
          <ShieldCheck size={28} />
          <span className="eyebrow">{t.privateEyebrow}</span>
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaBody}</p>
        </div>
        <button className="button button-primary landing-login-button" type="button" onClick={() => setPanelOpen(true)}>
          <LockKeyhole size={16} />{t.openFramebase}
        </button>
      </section>

      <footer className="landing-footer">
        <BrandMark /><strong>FRAMEBASE</strong><span>{t.footer}</span><a href="#top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{t.backToTop}</a>
      </footer>

      {panelOpen && <div className="login-modal-backdrop">
        <section className="login-panel" role="dialog" aria-modal="true" aria-labelledby="login-dialog-title">
          <button className="login-close" type="button" onClick={() => setPanelOpen(false)} aria-label={t.closeLogin}><X size={18} /></button>
          <div className="login-card">
            <div className="login-lock"><LockKeyhole size={22} /></div>
            <span className="eyebrow">{registering ? t.newMember : t.securePortal}</span>
            <h2 id="login-dialog-title">{registering ? t.createAccount : t.welcomeBack}</h2>
            <p className="login-intro">{registering ? t.registerIntro : t.loginIntro}</p>

            <form className="login-form" onSubmit={submit}>
              <label>
                <span>{t.username}</span>
                <div className="login-input"><KeyRound size={16} /><input aria-label={t.username} name="username" autoComplete="username" minLength={registering ? 3 : undefined} maxLength={50} pattern={registering ? '[A-Za-z0-9._-]+' : undefined} value={username} onChange={(event) => setUsername(event.target.value)} /></div>
              </label>
              <label>
                <span>{registering ? t.passcode : t.password}</span>
                <div className="login-input"><LockKeyhole size={16} /><input aria-label={registering ? t.passcode : t.password} name="password" type={showPassword ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} autoFocus /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? t.hidePassword : t.showPassword}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              </label>

              {registering && <label>
                <span>{t.confirmPasscode}</span>
                <div className="login-input"><ShieldCheck size={16} /><input aria-label={t.confirmPasscode} name="confirmation" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
              </label>}

              {(formError || visibleError) && <div className="login-error" role="alert">{formError ? t[formError] : visibleError}</div>}
              {success && <div className="login-success" role="status">{t[success]}</div>}

              <button className="button button-primary login-submit" type="submit" disabled={busy || !username.trim() || !password || (registering && !confirmation)}>{busy ? (registering ? t.creating : t.verifying) : (registering ? t.createMyAccount : t.enterLibrary)}</button>
            </form>

            <div className="login-switch">
              <span>{registering ? t.alreadyAccount : t.newToFramebase}</span>
              <button type="button" onClick={() => changeMode(registering ? 'login' : 'register')}>{registering ? t.backToSignIn : t.createAnAccount}</button>
            </div>
            <p className="login-help">{t.passcodeHelp}</p>
          </div>
        </section>
      </div>}
    </main>
  )
}
