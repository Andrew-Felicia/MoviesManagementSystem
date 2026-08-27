import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, BarChart3, Check, ChevronDown, Clapperboard, Clock3, Film, KeyRound, Languages, Library, LogOut, Plus, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Star, X } from 'lucide-react'
import { authApi } from './api/auth'
import { movieApi } from './api/movies'
import { BrandMark } from './components/Icons'
import LoginPage from './components/LoginPage'
import MovieForm from './components/MovieForm'
import MovieTable from './components/MovieTable'
import PasswordChangeDialog from './components/PasswordChangeDialog'

const APP_COPY = {
  en: {
    locale: 'en', brandSubtitle: 'Personal movie index', library: 'Library', overview: 'Overview', addMovie: 'Add movie', passcode: 'Passcode', changePasscode: 'Change passcode', signOut: 'Sign out', switchLanguage: 'Switch to Chinese', switchText: '中文',
    heroEyebrow: 'Your private screening room', heroTitle: 'Find the right film', heroAccent: 'without the scroll.', heroBody: 'A clean index of every title you own, what you have watched, and what deserves the next evening.', titlesIndexed: 'titles indexed',
    totalCollection: 'Total collection', titles: 'titles', watched: 'Watched', complete: 'complete', timeWatched: 'Time watched', hours: 'hours', averageRating: 'Average rating', outOfTen: 'out of 10',
    catalog: 'Catalog', movieLibrary: 'Movie library', shown: (filtered, total) => `${filtered} of ${total} titles shown`, searchLibrary: 'Search library', searchPlaceholder: 'Search title, director, genre…', clearSearch: 'Clear search', filters: 'Filters', sortMovies: 'Sort movies', newest: 'Newest first', oldest: 'Oldest first', titleSort: 'Title A–Z', ratingSort: 'Highest rated', genre: 'Genre', status: 'Status', allGenres: 'All genres', allMovies: 'All movies', unwatched: 'Unwatched', clearFilters: 'Clear filters',
    loadErrorTitle: 'Could not load your library', serviceUnavailable: 'The movie service is not available. Start the backend and try again.', retry: 'Retry', loadingMovies: 'Loading movies', footer: 'Your collection. Your ratings. Your next movie.', footerNote: 'Local-first catalog · Built for movie nights',
    deleteTitle: (title) => `Remove “${title}”?`, deleteBody: 'This deletes the catalog entry. It does not delete the movie file from your device.', keepMovie: 'Keep movie', removing: 'Removing…', remove: 'Remove',
    movieUpdated: 'Movie updated', movieAdded: 'Movie added to your library', passcodeUpdated: 'Passcode updated', markedWatched: 'Marked as watched', movedWatchlist: 'Moved back to watchlist', movieRemoved: 'Movie removed'
  },
  zh: {
    locale: 'zh-CN', brandSubtitle: '私人电影索引', library: '片库', overview: '概览', addMovie: '添加电影', passcode: '口令', changePasscode: '修改口令', signOut: '退出登录', switchLanguage: '切换到英文', switchText: 'EN',
    heroEyebrow: '你的私人放映室', heroTitle: '找到今晚最合适的电影', heroAccent: '不再反复翻找。', heroBody: '清晰整理你拥有的每一部影片、观看记录，以及下一次电影之夜的候选片单。', titlesIndexed: '部电影已收录',
    totalCollection: '全部收藏', titles: '部', watched: '已观看', complete: '已完成', timeWatched: '观看时长', hours: '小时', averageRating: '平均评分', outOfTen: '满分 10 分',
    catalog: '电影目录', movieLibrary: '我的片库', shown: (filtered, total) => `已显示 ${filtered} / ${total} 部电影`, searchLibrary: '搜索片库', searchPlaceholder: '搜索片名、导演或类型…', clearSearch: '清除搜索', filters: '筛选', sortMovies: '电影排序', newest: '最新上映', oldest: '最早上映', titleSort: '片名 A–Z', ratingSort: '评分最高', genre: '类型', status: '状态', allGenres: '全部类型', allMovies: '全部电影', unwatched: '未观看', clearFilters: '清除筛选',
    loadErrorTitle: '无法加载你的片库', serviceUnavailable: '电影服务暂时不可用。请启动后端后重试。', retry: '重试', loadingMovies: '正在加载电影', footer: '你的收藏。你的评分。你的下一部电影。', footerNote: '本地优先片库 · 为电影之夜打造',
    deleteTitle: (title) => `移除《${title}》？`, deleteBody: '这只会删除片库记录，不会删除设备中的电影文件。', keepMovie: '保留电影', removing: '正在移除…', remove: '移除',
    movieUpdated: '电影已更新', movieAdded: '电影已加入片库', passcodeUpdated: '口令已更新', markedWatched: '已标记为看过', movedWatchlist: '已移回待看片单', movieRemoved: '电影已移除'
  }
}

function ConfirmDialog({ movie, busy, copy, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
        <div className="confirm-icon"><AlertCircle size={23} /></div>
        <h2 id="delete-title">{copy.deleteTitle(movie.title)}</h2>
        <p>{copy.deleteBody}</p>
        <div className="confirm-actions">
          <button className="button button-quiet" type="button" onClick={onCancel}>{copy.keepMovie}</button>
          <button className="button button-danger" type="button" onClick={onConfirm} disabled={busy}>{busy ? copy.removing : copy.remove}</button>
        </div>
      </section>
    </div>
  )
}

function LoadingRows({ label }) {
  return <div className="loading-panel" aria-label={label}><span /><span /><span /><span /></div>
}

export default function App() {
  const [language, setLanguage] = useState('en')
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('All genres')
  const [status, setStatus] = useState('All movies')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [formMovie, setFormMovie] = useState(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverErrors, setServerErrors] = useState({})
  const [deleteMovie, setDeleteMovie] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const copy = APP_COPY[language]

  const loadMovies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await movieApi.list()
      setMovies(data)
    } catch (requestError) {
      if (requestError.status === 401) {
        setCurrentUser(null)
        return
      }
      setError('service-unavailable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    authApi.me()
      .then(setCurrentUser)
      .catch((requestError) => {
        if (requestError.status !== 401) setLoginError('The authentication service is not available.')
      })
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (currentUser) loadMovies()
    else if (!authLoading) {
      setMovies([])
      setLoading(false)
    }
  }, [authLoading, currentUser, loadMovies])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const genres = useMemo(() => ['All genres', ...new Set(movies.map((movie) => movie.genre).filter(Boolean).sort())], [movies])

  const filteredMovies = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return movies
      .filter((movie) => !normalized || [movie.title, movie.director, movie.genre, movie.language].some((value) => value?.toLowerCase().includes(normalized)))
      .filter((movie) => genre === 'All genres' || movie.genre === genre)
      .filter((movie) => status === 'All movies' || (status === 'Watched' ? movie.watched : !movie.watched))
      .sort((a, b) => {
        if (sort === 'title') return a.title.localeCompare(b.title)
        if (sort === 'rating') return (b.personalRating ?? -1) - (a.personalRating ?? -1)
        if (sort === 'oldest') return a.releaseYear - b.releaseYear
        return b.releaseYear - a.releaseYear
      })
  }, [movies, query, genre, status, sort])

  const stats = useMemo(() => {
    const watched = movies.filter((movie) => movie.watched).length
    const minutes = movies.filter((movie) => movie.watched).reduce((total, movie) => total + movie.runtimeMinutes, 0)
    const rated = movies.filter((movie) => movie.personalRating != null)
    const average = rated.length ? rated.reduce((total, movie) => total + movie.personalRating, 0) / rated.length : 0
    return { watched, minutes, average }
  }, [movies])

  function openNew() {
    setFormMovie(undefined)
    setServerErrors({})
    setFormOpen(true)
  }

  function openEdit(movie) {
    setFormMovie(movie)
    setServerErrors({})
    setFormOpen(true)
  }

  async function saveMovie(values) {
    setSaving(true)
    setServerErrors({})
    try {
      const saved = formMovie ? await movieApi.update(formMovie.id, values) : await movieApi.create(values)
      setMovies((current) => formMovie ? current.map((movie) => movie.id === saved.id ? saved : movie) : [...current, saved])
      setFormOpen(false)
      setToast(formMovie ? copy.movieUpdated : copy.movieAdded)
    } catch (requestError) {
      setServerErrors(requestError.fieldErrors || {})
      if (!Object.keys(requestError.fieldErrors || {}).length) setToast(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function login(username, password) {
    setSigningIn(true)
    setLoginError('')
    try {
      setCurrentUser(await authApi.login(username, password))
    } catch (requestError) {
      setLoginError(requestError.message)
    } finally {
      setSigningIn(false)
    }
  }

  async function register(username, passcode) {
    setSigningIn(true)
    setLoginError('')
    try {
      await authApi.register(username, passcode)
      return true
    } catch (requestError) {
      setLoginError(requestError.message)
      return false
    } finally {
      setSigningIn(false)
    }
  }

  async function logout() {
    try {
      await authApi.logout()
      setCurrentUser(null)
      setMovies([])
    } catch (requestError) {
      setToast(requestError.message)
    }
  }

  async function changePassword(currentPasscode, newPasscode) {
    setChangingPassword(true)
    setPasswordError('')
    try {
      await authApi.changePassword(currentPasscode, newPasscode)
      setPasswordDialogOpen(false)
      setToast(copy.passcodeUpdated)
      return true
    } catch (requestError) {
      setPasswordError(requestError.message)
      return false
    } finally {
      setChangingPassword(false)
    }
  }

  async function toggleWatched(movie) {
    try {
      const saved = await movieApi.update(movie.id, { ...movie, watched: !movie.watched, createdAt: undefined, id: undefined })
      setMovies((current) => current.map((item) => item.id === saved.id ? saved : item))
      setToast(saved.watched ? copy.markedWatched : copy.movedWatchlist)
    } catch (requestError) {
      setToast(requestError.message)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await movieApi.remove(deleteMovie.id)
      setMovies((current) => current.filter((movie) => movie.id !== deleteMovie.id))
      setDeleteMovie(null)
      setToast(copy.movieRemoved)
    } catch (requestError) {
      setToast(requestError.message)
    } finally {
      setDeleting(false)
    }
  }

  const hasFilters = query || genre !== 'All genres' || status !== 'All movies'

  if (authLoading) {
    return <div className="auth-splash"><BrandMark /><span>FRAMEBASE</span><small>Checking your session…</small></div>
  }

  if (!currentUser) {
    return <LoginPage busy={signingIn} error={loginError} language={language} onLanguageChange={setLanguage} onClearError={() => setLoginError('')} onLogin={login} onRegister={register} />
  }

  return (
    <div className="app-shell" lang={copy.locale}>
      <header className="topbar">
        <a className="brand" href="#catalog" aria-label={language === 'zh' ? 'Framebase 首页' : 'Framebase home'}><BrandMark /><span><strong>FRAMEBASE</strong><small>{copy.brandSubtitle}</small></span></a>
        <nav className="primary-nav" aria-label={language === 'zh' ? '主导航' : 'Primary navigation'}>
          <a className="active" href="#catalog"><Library size={15} />{copy.library}</a>
          <a href="#stats"><BarChart3 size={15} />{copy.overview}</a>
        </nav>
        <button className="button button-primary top-add" type="button" onClick={openNew}><Plus size={16} />{copy.addMovie}</button>
        <div className="account-chip"><span><ShieldCheck size={14} /></span><div><strong>{currentUser.username}</strong><small>{currentUser.role}</small></div></div>
        <button className="language-switch app-language-switch" type="button" onClick={() => setLanguage((current) => current === 'en' ? 'zh' : 'en')} aria-label={copy.switchLanguage}><Languages size={15} /><span>{copy.switchText}</span></button>
        <button className="passcode-button" type="button" onClick={() => { setPasswordError(''); setPasswordDialogOpen(true) }} aria-label={copy.changePasscode}><KeyRound size={16} /><span>{copy.passcode}</span></button>
        <button className="logout-button" type="button" onClick={logout} aria-label={copy.signOut}><LogOut size={17} /><span>{copy.signOut}</span></button>
        <button className="mobile-menu" type="button" onClick={openNew} aria-label={copy.addMovie}><Plus size={21} /></button>
        <button className="mobile-logout" type="button" onClick={logout} aria-label={copy.signOut}><LogOut size={19} /></button>
      </header>

      <main>
        <section className="hero-strip" id="catalog">
          <div>
            <span className="eyebrow">{copy.heroEyebrow}</span>
            <h1>{copy.heroTitle}<br /><em>{copy.heroAccent}</em></h1>
            <p>{copy.heroBody}</p>
          </div>
          <div className="hero-reel" aria-hidden="true"><Clapperboard size={44} /><span>{movies.length.toString().padStart(3, '0')}</span><small>{copy.titlesIndexed}</small></div>
        </section>

        <section className="stats-grid" id="stats">
          <article><span className="stat-icon blue"><Film size={18} /></span><div><small>{copy.totalCollection}</small><strong>{movies.length}</strong><em>{copy.titles}</em></div></article>
          <article><span className="stat-icon green"><Check size={18} /></span><div><small>{copy.watched}</small><strong>{stats.watched}</strong><em>{movies.length ? Math.round(stats.watched / movies.length * 100) : 0}% {copy.complete}</em></div></article>
          <article><span className="stat-icon amber"><Clock3 size={18} /></span><div><small>{copy.timeWatched}</small><strong>{Math.floor(stats.minutes / 60)}</strong><em>{copy.hours}</em></div></article>
          <article><span className="stat-icon red"><Star size={18} /></span><div><small>{copy.averageRating}</small><strong>{stats.average.toFixed(1)}</strong><em>{copy.outOfTen}</em></div></article>
        </section>

        <section className="library-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">{copy.catalog}</span><h2>{copy.movieLibrary}</h2><p>{copy.shown(filteredMovies.length, movies.length)}</p></div>
            <button className="button button-primary mobile-add" type="button" onClick={openNew}><Plus size={16} />{copy.addMovie}</button>
          </div>

          <div className="toolbar">
            <label className="search-box"><Search size={17} /><input aria-label={copy.searchLibrary} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} />{query && <button onClick={() => setQuery('')} aria-label={copy.clearSearch}><X size={15} /></button>}</label>
            <button className={`filter-toggle ${showFilters ? 'active' : ''}`} type="button" onClick={() => setShowFilters((value) => !value)}><SlidersHorizontal size={16} />{copy.filters}<ChevronDown size={15} /></button>
            <label className="select-wrap"><span className="sr-only">{copy.sortMovies}</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">{copy.newest}</option><option value="oldest">{copy.oldest}</option><option value="title">{copy.titleSort}</option><option value="rating">{copy.ratingSort}</option></select><ChevronDown size={14} /></label>
          </div>

          {showFilters && <div className="filter-row"><label>{copy.genre}<select value={genre} onChange={(event) => setGenre(event.target.value)}>{genres.map((item) => <option key={item} value={item}>{item === 'All genres' ? copy.allGenres : item}</option>)}</select></label><label>{copy.status}<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="All movies">{copy.allMovies}</option><option value="Watched">{copy.watched}</option><option value="Unwatched">{copy.unwatched}</option></select></label>{hasFilters && <button type="button" onClick={() => { setQuery(''); setGenre('All genres'); setStatus('All movies') }}>{copy.clearFilters}</button>}</div>}

          {error && <div className="error-banner"><AlertCircle size={18} /><div><strong>{copy.loadErrorTitle}</strong><span>{copy.serviceUnavailable}</span></div><button type="button" onClick={loadMovies}><RefreshCw size={15} />{copy.retry}</button></div>}
          {loading ? <LoadingRows label={copy.loadingMovies} /> : !error && <MovieTable language={language} movies={filteredMovies} onEdit={openEdit} onDelete={setDeleteMovie} onToggleWatched={toggleWatched} />}
        </section>
      </main>

      <footer className="site-footer"><BrandMark /><span>FRAMEBASE</span><p>{copy.footer}</p><small>{copy.footerNote}</small></footer>

      {formOpen && <MovieForm language={language} movie={formMovie} saving={saving} serverErrors={serverErrors} onClose={() => setFormOpen(false)} onSave={saveMovie} />}
      {passwordDialogOpen && <PasswordChangeDialog language={language} busy={changingPassword} error={passwordError} onClose={() => setPasswordDialogOpen(false)} onSave={changePassword} />}
      {deleteMovie && <ConfirmDialog movie={deleteMovie} busy={deleting} copy={copy} onCancel={() => setDeleteMovie(null)} onConfirm={confirmDelete} />}
      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    </div>
  )
}
