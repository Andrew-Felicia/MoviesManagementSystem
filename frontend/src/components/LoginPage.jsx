import { useRef, useState } from 'react'
import { ArrowDown, Eye, EyeOff, KeyRound, Languages, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { BrandMark } from './Icons'

const BOOK_POSTER_MODULES = import.meta.glob('../assets/posters/books/*.{avif,jpeg,jpg,png,webp}', {
  eager: true,
  import: 'default',
  query: '?url'
})

const COPY = {
  en: {
    locale: 'en', brandSubtitle: 'Personal movie index', switchLanguage: 'Switch to Chinese', switchText: '中文', login: 'Login',
    archiveCode: 'Private archive / 2026', archiveStatus: 'Archive online', curated: 'Curated by you', localFirst: 'Personal · searchable · private', selectedFilms: 'Selected films', indexMode: 'Index mode', personalCatalog: 'Personal catalog', accessReady: 'Access node ready', secureSession: 'Encrypted session handshake',
    manage: 'Manage', yourFilms: 'Your films', posterGallery: 'Classic cinema poster gallery', scrollLabel: 'Scroll to explore Framebase', scroll: 'Scroll to explore',
    collectionEyebrow: 'Your collection, in focus', collectionTitle: 'Everything worth watching.', collectionAccent: 'Easy to find again.', collectionBody: 'Framebase turns a scattered list of files and memories into one searchable, personal film index.',
    bookLabel: 'Interactive movie poster book', bookInstructions: 'Swipe left or right across the book to turn a page. Use the left and right arrow keys for keyboard navigation.', bookProgress: (current, total) => `Spread ${current} of ${total}`,
    showcaseEyebrow: 'From the IMDb archive', showcaseTitle: 'Eight films.', showcaseAccent: 'Infinite inspiration.', showcaseBody: 'A rotating wall of landmark films to spark the next addition to your personal index.', openImdb: (title) => `Open ${title} on IMDb`,
    posterReelLabel: 'Animated movie poster reel',
    privateEyebrow: 'Private by design', ctaTitle: 'Your films are waiting.', ctaBody: 'Sign in to open your collection, or create an account to start a new one.', openFramebase: 'Open Framebase', footer: 'Your collection. Your ratings. Your next movie.', backToTop: 'Back to top',
    closeLogin: 'Close login', newMember: 'New member access', securePortal: 'Secure member portal', createAccount: 'Create account', welcomeBack: 'Welcome back',
    registerIntro: 'Choose a username and passcode for your library access.', loginIntro: 'Sign in to continue to the movie library.', username: 'Username', passcode: 'Passcode', password: 'Password', confirmPasscode: 'Confirm passcode',
    hidePassword: 'Hide password', showPassword: 'Show password', passcodesMismatch: 'Passcodes do not match.', accountCreated: 'Account created. Sign in to continue.', creating: 'Creating…', verifying: 'Verifying…', createMyAccount: 'Create my account', enterLibrary: 'Enter library',
    alreadyAccount: 'Already have an account?', newToFramebase: 'New to Framebase?', backToSignIn: 'Back to sign in', createAnAccount: 'Create an account', passcodeHelp: 'Passcodes are securely hashed and never stored as readable text.'
  },
  zh: {
    locale: 'zh-CN', brandSubtitle: '私人电影索引', switchLanguage: '切换到英文', switchText: 'EN', login: '登录',
    archiveCode: '私人片库 / 2026', archiveStatus: '片库在线', curated: '由你策展', localFirst: '私人 · 可搜索 · 重视隐私', selectedFilms: '精选电影', indexMode: '索引模式', personalCatalog: '私人目录', accessReady: '访问节点已就绪', secureSession: '加密会话握手',
    manage: '管理', yourFilms: '你的电影', posterGallery: '经典电影海报画廊', scrollLabel: '向下探索 Framebase', scroll: '向下探索',
    collectionEyebrow: '你的收藏，一目了然', collectionTitle: '每一部值得观看的电影。', collectionAccent: '都能轻松再次找到。', collectionBody: 'Framebase 将散落的电影文件与观影记忆，整理成一个可搜索的私人电影索引。',
    bookLabel: '可翻页电影海报书', bookInstructions: '在书上向左或向右滑动即可翻页，也可使用左右方向键。', bookProgress: (current, total) => `第 ${current} 组，共 ${total} 组`,
    showcaseEyebrow: '来自 IMDb 电影档案', showcaseTitle: '八部电影。', showcaseAccent: '无限灵感。', showcaseBody: '一面持续流动的经典电影墙，为你的私人索引带来下一次收藏灵感。', openImdb: (title) => `在 IMDb 查看《${title}》`,
    posterReelLabel: '电影海报动画长卷',
    privateEyebrow: '隐私优先设计', ctaTitle: '你的电影正在等你。', ctaBody: '登录即可打开你的收藏，或者创建账户，开始建立新的片库。', openFramebase: '打开 Framebase', footer: '你的收藏。你的评分。你的下一部电影。', backToTop: '返回顶部',
    closeLogin: '关闭登录窗口', newMember: '新用户入口', securePortal: '安全用户入口', createAccount: '创建账户', welcomeBack: '欢迎回来',
    registerIntro: '选择用户名和口令，创建你的片库账户。', loginIntro: '登录以继续进入电影片库。', username: '用户名', passcode: '口令', password: '密码', confirmPasscode: '确认口令',
    hidePassword: '隐藏密码', showPassword: '显示密码', passcodesMismatch: '两次输入的口令不一致。', accountCreated: '账户创建成功，请登录继续。', creating: '正在创建…', verifying: '正在验证…', createMyAccount: '创建我的账户', enterLibrary: '进入片库',
    alreadyAccount: '已经有账户？', newToFramebase: '第一次使用 Framebase？', backToSignIn: '返回登录', createAnAccount: '创建账户', passcodeHelp: '口令会经过安全哈希处理，绝不会以可读文本保存。'
  }
}

const SHOWCASE_MOVIES = [
  { title: 'Pulp Fiction', year: 1994, director: 'Quentin Tarantino', imdbUrl: 'https://www.imdb.com/title/tt0110912/', posterUrl: '/posters/reel/tt0110912.jpg' },
  { title: 'Fight Club', year: 1999, director: 'David Fincher', imdbUrl: 'https://www.imdb.com/title/tt0137523/', posterUrl: '/posters/reel/tt0137523.jpg' },
  { title: 'The Matrix', year: 1999, director: 'Lana Wachowski', imdbUrl: 'https://www.imdb.com/title/tt0133093/', posterUrl: '/posters/reel/tt0133093.jpg' },
  { title: 'The Return of the King', year: 2003, director: 'Peter Jackson', imdbUrl: 'https://www.imdb.com/title/tt0167260/', posterUrl: '/posters/reel/tt0167260.jpg' },
  { title: 'Whiplash', year: 2014, director: 'Damien Chazelle', imdbUrl: 'https://www.imdb.com/title/tt2582802/', posterUrl: '/posters/reel/tt2582802.jpg' },
  { title: 'Blade Runner 2049', year: 2017, director: 'Denis Villeneuve', imdbUrl: 'https://www.imdb.com/title/tt1856101/', posterUrl: '/posters/reel/tt1856101.jpg' },
  { title: 'The Dark Knight', year: 2008, director: 'Christopher Nolan', imdbUrl: 'https://www.imdb.com/title/tt0468569/', posterUrl: '/posters/reel/tt0468569.jpg' },
  { title: 'Mad Max: Fury Road', year: 2015, director: 'George Miller', imdbUrl: 'https://www.imdb.com/title/tt1392190/', posterUrl: '/posters/reel/tt1392190.jpg' },
]

const REEL_POSTER_ROWS = [
  ['tt0111161', 'tt0068646', 'tt0468569', 'tt0071562', 'tt0050083', 'tt0167260', 'tt0110912', 'tt0108052', 'tt1375666', 'tt0137523', 'tt0120737', 'tt0109830', 'tt0167261', 'tt0133093', 'tt0099685'],
  ['tt0080684', 'tt0073486', 'tt8503618', 'tt0816692', 'tt0120815', 'tt0120689', 'tt0114369', 'tt0102926', 'tt0038650', 'tt7286456', 'tt2582802', 'tt1675434', 'tt0482571', 'tt0407887', 'tt0253474'],
  ['tt0172495', 'tt0120586', 'tt0114814', 'tt0110357', 'tt0103064', 'tt0088763', 'tt0054215', 'tt0034583', 'tt0027977', 'tt0021749', 'tt6148156', 'tt5074352', 'tt4633694', 'tt4154796', 'tt4154756'],
  ['tt2380307', 'tt1853728', 'tt1345836', 'tt1187043', 'tt0910970', 'tt0405094', 'tt0209144', 'tt0087843', 'tt0082971', 'tt0081505', 'tt0078788', 'tt0057012', 'tt0051201', 'tt0050825', 'tt0047396'],
].map((row) => row.map((imdbId) => `/posters/reel/${imdbId}.jpg`))

const DISCOVERED_BOOK_POSTERS = Object.entries(BOOK_POSTER_MODULES)
  .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }))
  .map(([, posterUrl]) => posterUrl)
const BOOK_POSTERS = DISCOVERED_BOOK_POSTERS.length % 2 === 0 ? DISCOVERED_BOOK_POSTERS : [...DISCOVERED_BOOK_POSTERS, null]
const BOOK_SPREAD_COUNT = Math.ceil(BOOK_POSTERS.length / 2)
const BOOK_LEAVES = Array.from({ length: BOOK_SPREAD_COUNT - 1 }, (_, index) => ({
  front: BOOK_POSTERS[index * 2 + 1],
  back: BOOK_POSTERS[index * 2 + 2]
}))

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
  const [bookSpread, setBookSpread] = useState(0)
  const [bookDragOffset, setBookDragOffset] = useState(0)
  const bookPointer = useRef(null)

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

  function turnBook(direction) {
    const nextSpread = bookSpread + direction
    if (nextSpread < 0 || nextSpread >= BOOK_SPREAD_COUNT) return
    setBookSpread(nextSpread)
  }

  function startBookTurn(event) {
    if (event.button !== undefined && event.button !== 0) return
    const pageWidth = Math.max(event.currentTarget.getBoundingClientRect().width / 2, 280)
    bookPointer.current = { pointerId: event.pointerId, startX: event.clientX, deltaX: 0, pageWidth }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function moveBookTurn(event) {
    if (!bookPointer.current || bookPointer.current.pointerId !== event.pointerId) return
    let deltaX = event.clientX - bookPointer.current.startX
    if ((bookSpread === 0 && deltaX > 0) || (bookSpread === BOOK_SPREAD_COUNT - 1 && deltaX < 0)) deltaX = 0
    deltaX = Math.max(-bookPointer.current.pageWidth, Math.min(bookPointer.current.pageWidth, deltaX))
    bookPointer.current.deltaX = deltaX
    setBookDragOffset(deltaX)
  }

  function finishBookTurn(event) {
    if (!bookPointer.current || bookPointer.current.pointerId !== event.pointerId) return
    const { deltaX, pageWidth } = bookPointer.current
    bookPointer.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setBookDragOffset(0)

    if (Math.abs(deltaX) > Math.max(58, pageWidth * .16)) {
      turnBook(deltaX < 0 ? 1 : -1)
    }
  }

  function cancelBookTurn() {
    bookPointer.current = null
    setBookDragOffset(0)
  }

  const registering = mode === 'register'
  const t = COPY[language]
  const visibleError = language === 'zh' ? (CHINESE_SERVER_ERRORS[error] || error) : error
  const dragPageWidth = bookPointer.current?.pageWidth || 280

  return (
    <main className="login-page" lang={t.locale}>
      <section className="login-story" id="top">
        <header className="login-topbar">
          <a className="brand login-brand" href="/" aria-label={language === 'zh' ? 'Framebase 首页' : 'Framebase home'}>
            <span className="login-brand-symbol"><BrandMark /></span>
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
            <h1><span className="login-title-line">{t.manage}</span><em className="login-title-line">{t.yourFilms}</em></h1>
          </div>

          <div className="login-artboard">
            <span className="artboard-label">FRAMEBASE®</span>
            <span className="artboard-index">001—003</span>
            <div className="login-poster-gallery" aria-label={t.posterGallery}>
              <figure className="classic-poster poster-shawshank">
                <img src="/posters/reel/tt0111161.jpg" alt="The Shawshank Redemption, 1994 IMDb poster" width="300" height="444" />
                <figcaption><strong>The Shawshank Redemption</strong><span>Frank Darabont · 1994</span></figcaption>
              </figure>
              <figure className="classic-poster poster-interstellar">
                <img src="/posters/reel/tt0816692.jpg" alt="Interstellar, 2014 IMDb poster" width="300" height="444" />
                <figcaption><strong>Interstellar</strong><span>Christopher Nolan · 2014</span></figcaption>
              </figure>
              <figure className="classic-poster poster-godfather">
                <img src="/posters/reel/tt0068646.jpg" alt="The Godfather, 1972 IMDb poster" width="300" height="444" />
                <figcaption><strong>The Godfather</strong><span>Francis Ford Coppola · 1972</span></figcaption>
              </figure>
            </div>
            <div className="artboard-count"><strong>03</strong><span>{t.selectedFilms}</span></div>
            <div className="artboard-mode"><span>{t.indexMode}</span><strong>{t.personalCatalog}</strong></div>
            <span className="artboard-caption">FILM / MEMORY / INDEX</span>
          </div>
        </div>
        <div className="login-marquee" aria-hidden="true"><span>WATCH / RATE / REMEMBER / WATCH / RATE / REMEMBER / WATCH / RATE / REMEMBER / WATCH / RATE / REMEMBER / WATCH / RATE / REMEMBER / WATCH / RATE / REMEMBER /</span></div>
        <a className="login-scroll-cue" href="#organize" aria-label={t.scrollLabel}>
          <span>{t.scroll}</span><ArrowDown size={16} />
        </a>
      </section>

      <section className="landing-section landing-book" id="organize" aria-label={t.bookLabel}>
        <span className="landing-section-number book-section-number" aria-hidden="true">02</span>
        <div
          className="poster-book"
          role="group"
          aria-label={t.bookLabel}
          tabIndex={0}
          data-dragging={bookDragOffset !== 0}
          onPointerDown={startBookTurn}
          onPointerMove={moveBookTurn}
          onPointerUp={finishBookTurn}
          onPointerCancel={cancelBookTurn}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); turnBook(-1) }
            if (event.key === 'ArrowRight') { event.preventDefault(); turnBook(1) }
          }}
        >
          <span className="sr-only">{t.bookInstructions}</span>
          <span className="sr-only" aria-live="polite">{t.bookProgress(bookSpread + 1, BOOK_SPREAD_COUNT)}</span>
          <div className="book-shell">
            <div className="book-base book-base-left" aria-hidden={bookSpread !== 0}>
              {bookSpread < 3 && <img src={BOOK_POSTERS[0]} alt="Movie poster page 1" width="300" height="444" draggable={false} decoding="async" />}
            </div>
            <div className="book-base book-base-right" aria-hidden={bookSpread !== BOOK_SPREAD_COUNT - 1}>
              {bookSpread > BOOK_SPREAD_COUNT - 4 && BOOK_POSTERS[BOOK_POSTERS.length - 1] && <img src={BOOK_POSTERS[BOOK_POSTERS.length - 1]} alt={`Movie poster page ${BOOK_POSTERS.length}`} width="300" height="444" draggable={false} decoding="async" />}
            </div>
            {BOOK_LEAVES.map((leaf, index) => {
              if (index < bookSpread - 2 || index > bookSpread + 2) return null
              const turned = index < bookSpread
              const activeNext = bookDragOffset < 0 && index === bookSpread
              const activePrevious = bookDragOffset > 0 && index === bookSpread - 1
              const active = activeNext || activePrevious
              let angle = turned ? -180 : 0
              if (activeNext) angle = Math.max(-178, (bookDragOffset / dragPageWidth) * 180)
              if (activePrevious) angle = Math.min(-2, -180 + (bookDragOffset / dragPageWidth) * 180)
              const curl = active ? Math.sin(Math.abs(angle) * Math.PI / 180) : 0
              const zIndex = active ? BOOK_LEAVES.length * 3 : (turned ? index + 1 : BOOK_LEAVES.length * 2 - index)

              return <article
                className={`book-leaf${active ? ' is-active' : ''}`}
                data-turned={turned}
                key={`${leaf.front}-${leaf.back}`}
                style={{ '--leaf-angle': `${angle}deg`, '--curl-opacity': .14 + curl * .62, zIndex }}
              >
                <figure className="book-face book-face-front" aria-hidden={bookSpread !== index}>
                  <img src={leaf.front} alt={`Movie poster page ${index * 2 + 2}`} width="300" height="444" draggable={false} decoding="async" />
                </figure>
                <figure className="book-face book-face-back" aria-hidden={bookSpread !== index + 1}>
                  <img src={leaf.back} alt={`Movie poster page ${index * 2 + 3}`} width="300" height="444" draggable={false} decoding="async" />
                </figure>
              </article>
            })}
          </div>
        </div>
      </section>

      <section className="cinema-showcase" aria-labelledby="showcase-title">
        <header className="showcase-heading">
          <div><span className="showcase-index">03 / IMDb SELECTS</span><span className="eyebrow">{t.showcaseEyebrow}</span><h2 id="showcase-title">{t.showcaseTitle}<br /><em>{t.showcaseAccent}</em></h2></div>
          <p>{t.showcaseBody}</p>
        </header>
        <div className="poster-showcase-grid">
          {SHOWCASE_MOVIES.map((movie, index) => <a className="showcase-poster" href={movie.imdbUrl} target="_blank" rel="noreferrer" aria-label={t.openImdb(movie.title)} key={movie.imdbUrl} style={{ '--poster-index': index }}>
            <figure><img src={movie.posterUrl} alt={`${movie.title} IMDb poster`} width="300" height="444" loading="eager" decoding="async" /><span>{String(index + 1).padStart(2, '0')}</span></figure>
            <div><strong>{movie.title}</strong><small>{movie.director} · {movie.year}</small></div>
          </a>)}
        </div>
        <div className="showcase-marquee" aria-hidden="true"><span>CINEMA / MEMORY / INDEX / CINEMA / MEMORY / INDEX / CINEMA / MEMORY / INDEX / CINEMA / MEMORY / INDEX /</span></div>
      </section>

      <section className="closing-reel" aria-label={t.posterReelLabel}>
        {REEL_POSTER_ROWS.map((posters, row) => <div className={`closing-filmstrip closing-filmstrip-${row + 1}`} aria-hidden="true" key={row}>
          <div>{[...posters, ...posters].map((posterUrl, index) => <figure key={`${posterUrl}-${index}`}><img src={posterUrl} alt="" width="300" height="444" loading="lazy" /></figure>)}</div>
        </div>)}
      </section>

      <section className="landing-cta">
        <div>
          <ShieldCheck size={28} />
          <span className="eyebrow">{t.privateEyebrow}</span>
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaBody}</p>
          <div className="cta-system-tags" aria-hidden="true"><span>SESSION / 01</span><span>PRIVATE INDEX</span><span>READY</span></div>
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
          <div className="login-panel-art" aria-hidden="true">
            <span>FRAMEBASE / ACCESS</span>
            <div className="login-panel-grid" />
            <div className="login-panel-mark"><BrandMark /><strong>FB</strong></div>
            <div className="login-panel-art-footer"><small>PRIVATE<br />MOVIE<br />INDEX</small><b>51.5072° N<br />0.1276° W</b></div>
          </div>
          <div className="login-card">
            <div className="login-card-status"><span><i />{t.accessReady}</span><small>{t.secureSession}</small></div>
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
