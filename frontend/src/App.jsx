import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, BarChart3, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, Clapperboard, Clock3, Download, Film, KeyRound, Languages, Library, LogOut, Plus, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Star, Trash2, Undo2, Upload, Users, X } from 'lucide-react'
import { authApi } from './api/auth'
import { movieApi } from './api/movies'
import AdminUsersDialog from './components/AdminUsersDialog'
import BatchImportDialog from './components/BatchImportDialog'
import { BrandMark } from './components/Icons'
import LoginPage from './components/LoginPage'
import MovieForm from './components/MovieForm'
import MovieTable from './components/MovieTable'
import PasswordChangeDialog from './components/PasswordChangeDialog'
import { moviesToCsv } from './utils/movieCsv'

const APP_COPY = {
  en: {
    locale: 'en', brandSubtitle: 'Personal movie index', library: 'Library', overview: 'Overview', addMovie: 'Add movie', passcode: 'Passcode', changePasscode: 'Change passcode', signOut: 'Sign out', switchLanguage: 'Switch to Chinese', switchText: '中文',
    heroEyebrow: 'Your private screening room', heroTitle: 'Find the right film', heroAccent: 'without the scroll.', heroBody: 'A clean index of every title you own, what you have watched, and what deserves the next evening.', titlesIndexed: 'titles indexed',
    totalCollection: 'Total collection', titles: 'titles', watched: 'Watched', complete: 'complete', timeWatched: 'Time watched', hours: 'hours', averageRating: 'Average rating', outOfTen: 'out of 10', registeredUsers: 'Registered users', accounts: 'accounts', manageUsers: 'Manage users', passcodeReset: (username) => `Passcode reset for ${username}`,
    catalog: 'Catalog', movieLibrary: 'Movie library', shown: (filtered, total) => `${filtered} of ${total} titles matched`, pageRange: (start, end, total) => `Showing ${start}–${end} of ${total}`, pageStatus: (page, total) => `Page ${page} of ${total}`, previousPage: 'Previous page', nextPage: 'Next page', goToPage: (page) => `Go to page ${page}`, importCsv: 'Import CSV', exportCsv: 'Export CSV', watchAll: 'Watch all', unwatchAll: 'Unwatch all', deleteAll: 'Delete all', watchingAll: 'Updating…', deleteAllTitle: (count) => `Delete all ${count} movies?`, deleteAllBody: 'This permanently removes every movie entry in your library, including films hidden by filters. It does not delete movie files from your device.', deleteAllConfirm: 'Delete all movies', deletingAll: 'Deleting…', allMarkedWatched: (count) => `${count} ${count === 1 ? 'movie' : 'movies'} marked as watched`, allMarkedUnwatched: (count) => `${count} ${count === 1 ? 'movie' : 'movies'} moved to watchlist`, allDeleted: (count) => `${count} ${count === 1 ? 'movie' : 'movies'} deleted`, searchLibrary: 'Search library', searchPlaceholder: 'Search title, director, genre…', clearSearch: 'Clear search', filters: 'Filters', sortMovies: 'Sort movies', newest: 'Newest first', oldest: 'Oldest first', titleSort: 'Title A–Z', ratingSort: 'Highest rated', genre: 'Genre', status: 'Status', allGenres: 'All genres', allMovies: 'All movies', unwatched: 'Unwatched', clearFilters: 'Clear filters',
    loadErrorTitle: 'Could not load your library', serviceUnavailable: 'The movie service is not available. Start the backend and try again.', retry: 'Retry', loadingMovies: 'Loading movies', footer: 'Your collection. Your ratings. Your next movie.', footerNote: 'Local-first catalog · Built for movie nights',
    deleteTitle: (title) => `Remove “${title}”?`, deleteBody: 'This deletes the catalog entry. It does not delete the movie file from your device.', keepMovie: 'Keep movie', removing: 'Removing…', remove: 'Remove',
    movieUpdated: 'Movie updated', movieAdded: 'Movie added to your library', passcodeUpdated: 'Passcode updated', markedWatched: 'Marked as watched', movedWatchlist: 'Moved back to watchlist', movieRemoved: 'Movie removed', exported: (count) => `Exported ${count} ${count === 1 ? 'movie' : 'movies'} to CSV`, imported: (count, skipped) => `Imported ${count} ${count === 1 ? 'movie' : 'movies'}${skipped ? ` · skipped ${skipped} duplicates` : ''}`, templateDownloaded: 'CSV template downloaded', batchEndpointUnavailable: 'The running backend is out of date. Restart or redeploy it, then try the import again.'
  },
  zh: {
    locale: 'zh-CN', brandSubtitle: '私人电影索引', library: '片库', overview: '概览', addMovie: '添加电影', passcode: '口令', changePasscode: '修改口令', signOut: '退出登录', switchLanguage: '切换到英文', switchText: 'EN',
    heroEyebrow: '你的私人放映室', heroTitle: '找到今晚最合适的电影', heroAccent: '不再反复翻找。', heroBody: '清晰整理你拥有的每一部影片、观看记录，以及下一次电影之夜的候选片单。', titlesIndexed: '部电影已收录',
    totalCollection: '全部收藏', titles: '部', watched: '已观看', complete: '已完成', timeWatched: '观看时长', hours: '小时', averageRating: '平均评分', outOfTen: '满分 10 分', registeredUsers: '注册用户', accounts: '个账户', manageUsers: '管理用户', passcodeReset: (username) => `已重置 ${username} 的口令`,
    catalog: '电影目录', movieLibrary: '我的片库', shown: (filtered, total) => `匹配 ${filtered} / ${total} 部电影`, pageRange: (start, end, total) => `当前显示第 ${start}–${end} 部，共 ${total} 部`, pageStatus: (page, total) => `第 ${page} / ${total} 页`, previousPage: '上一页', nextPage: '下一页', goToPage: (page) => `前往第 ${page} 页`, importCsv: '导入 CSV', exportCsv: '导出 CSV', watchAll: '全部标记为已看', unwatchAll: '全部标记为未看', deleteAll: '全部删除', watchingAll: '正在更新…', deleteAllTitle: (count) => `删除全部 ${count} 部电影？`, deleteAllBody: '这会永久删除你片库中的全部电影记录，包括筛选后暂时隐藏的电影；不会删除设备中的电影文件。', deleteAllConfirm: '删除全部电影', deletingAll: '正在删除…', allMarkedWatched: (count) => `已将 ${count} 部电影标记为已看`, allMarkedUnwatched: (count) => `已将 ${count} 部电影标记为未看`, allDeleted: (count) => `已删除 ${count} 部电影`, searchLibrary: '搜索片库', searchPlaceholder: '搜索片名、导演或类型…', clearSearch: '清除搜索', filters: '筛选', sortMovies: '电影排序', newest: '最新上映', oldest: '最早上映', titleSort: '片名 A–Z', ratingSort: '评分最高', genre: '类型', status: '状态', allGenres: '全部类型', allMovies: '全部电影', unwatched: '未观看', clearFilters: '清除筛选',
    loadErrorTitle: '无法加载你的片库', serviceUnavailable: '电影服务暂时不可用。请启动后端后重试。', retry: '重试', loadingMovies: '正在加载电影', footer: '你的收藏。你的评分。你的下一部电影。', footerNote: '本地优先片库 · 为电影之夜打造',
    deleteTitle: (title) => `移除《${title}》？`, deleteBody: '这只会删除片库记录，不会删除设备中的电影文件。', keepMovie: '保留电影', removing: '正在移除…', remove: '移除',
    movieUpdated: '电影已更新', movieAdded: '电影已加入片库', passcodeUpdated: '口令已更新', markedWatched: '已标记为看过', movedWatchlist: '已移回待看片单', movieRemoved: '电影已移除', exported: (count) => `已导出 ${count} 部电影到 CSV`, imported: (count, skipped) => `已导入 ${count} 部电影${skipped ? ` · 跳过 ${skipped} 条重复记录` : ''}`, templateDownloaded: 'CSV 模板已下载', batchEndpointUnavailable: '当前运行的后端版本过旧。请重启或重新部署后端，然后再次导入。'
  }
}

const CINEMA_TICKER = ['CURATE', 'DISCOVER', 'WATCH', 'RATE', 'REPEAT']
const MOVIES_PER_PAGE = 12

function visiblePageNumbers(currentPage, pageCount) {
  return [...new Set([1, currentPage - 1, currentPage, currentPage + 1, pageCount])]
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((a, b) => a - b)
}

async function updateSavedBrowserCredential(username, passcode) {
  if (!username || !window.PasswordCredential || !navigator.credentials?.store) return
  try {
    await navigator.credentials.store(new window.PasswordCredential({ id: username, name: username, password: passcode }))
  } catch {
    // Credential storage is optional and can be declined or unavailable.
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

function DeleteAllDialog({ count, busy, copy, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-dialog confirm-all-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-all-title">
        <div className="confirm-icon"><Trash2 size={23} /></div>
        <h2 id="delete-all-title">{copy.deleteAllTitle(count)}</h2>
        <p>{copy.deleteAllBody}</p>
        <div className="confirm-actions">
          <button className="button button-quiet" type="button" onClick={onCancel} disabled={busy}>{copy.keepMovie}</button>
          <button className="button button-danger" type="button" onClick={onConfirm} disabled={busy}>{busy ? copy.deletingAll : copy.deleteAllConfirm}</button>
        </div>
      </section>
    </div>
  )
}

function LoadingRows({ label }) {
  return <div className="loading-panel" aria-label={label}><span /><span /><span /><span /></div>
}

function downloadCsv(csv, fileName) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchImporting, setBatchImporting] = useState(false)
  const [batchError, setBatchError] = useState('')
  const [batchAction, setBatchAction] = useState('')
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [registeredUsers, setRegisteredUsers] = useState(null)
  const [adminUsersOpen, setAdminUsersOpen] = useState(false)
  const [adminUsers, setAdminUsers] = useState([])
  const [adminUsersLoading, setAdminUsersLoading] = useState(false)
  const [adminUsersError, setAdminUsersError] = useState('')
  const [adminResetError, setAdminResetError] = useState('')
  const [adminResetting, setAdminResetting] = useState(false)
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
    let active = true
    if (currentUser?.role === 'ADMIN') {
      authApi.adminStats()
        .then((stats) => { if (active) setRegisteredUsers(stats.userCount) })
        .catch(() => { if (active) setRegisteredUsers(null) })
    } else {
      setRegisteredUsers(null)
    }
    return () => { active = false }
  }, [currentUser])
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

  const pageCount = Math.max(1, Math.ceil(filteredMovies.length / MOVIES_PER_PAGE))
  const pageStart = (currentPage - 1) * MOVIES_PER_PAGE
  const pageMovies = filteredMovies.slice(pageStart, pageStart + MOVIES_PER_PAGE)

  useEffect(() => setCurrentPage(1), [query, genre, status, sort])
  useEffect(() => setCurrentPage((page) => Math.min(page, pageCount)), [pageCount])

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
      setRegisteredUsers(null)
      setAdminUsersOpen(false)
      setAdminUsers([])
    } catch (requestError) {
      setToast(requestError.message)
    }
  }

  async function changePassword(currentPasscode, newPasscode) {
    setChangingPassword(true)
    setPasswordError('')
    try {
      await authApi.changePassword(currentPasscode, newPasscode)
      await updateSavedBrowserCredential(currentUser?.username, newPasscode)
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

  async function openAdminUsers() {
    setAdminUsersOpen(true)
    setAdminUsersLoading(true)
    setAdminUsersError('')
    setAdminResetError('')
    try {
      setAdminUsers(await authApi.adminUsers())
    } catch (requestError) {
      setAdminUsersError(requestError.message)
    } finally {
      setAdminUsersLoading(false)
    }
  }

  async function resetUserPassword(username, newPasscode) {
    setAdminResetting(true)
    setAdminResetError('')
    try {
      await authApi.resetUserPassword(username, newPasscode)
      setToast(copy.passcodeReset(username))
      return true
    } catch (requestError) {
      setAdminResetError(requestError.message)
      return false
    } finally {
      setAdminResetting(false)
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

  function exportMovies() {
    downloadCsv(moviesToCsv(movies), 'framebase-movies.csv')
    setToast(copy.exported(movies.length))
  }

  function downloadTemplate() {
    downloadCsv(moviesToCsv([]), 'framebase-import-template.csv')
    setToast(copy.templateDownloaded)
  }

  async function importMovies(batch) {
    setBatchImporting(true)
    setBatchError('')
    try {
      const result = await movieApi.createBatch(batch)
      setMovies((current) => [...current, ...result.movies])
      setBatchOpen(false)
      setToast(copy.imported(result.importedCount, result.skippedDuplicates))
    } catch (requestError) {
      const endpointUnavailable = requestError.status === 404 || requestError.status === 405
      setBatchError(endpointUnavailable
        ? copy.batchEndpointUnavailable
        : Object.values(requestError.fieldErrors || {})[0] || requestError.message)
    } finally {
      setBatchImporting(false)
    }
  }

  async function markAllWatched() {
    setBatchAction('watch')
    try {
      const result = await movieApi.markAllWatched()
      setMovies((current) => current.map((movie) => ({ ...movie, watched: true })))
      setToast(copy.allMarkedWatched(result.affectedCount))
    } catch (requestError) {
      setToast(requestError.message)
    } finally {
      setBatchAction('')
    }
  }

  async function markAllUnwatched() {
    setBatchAction('unwatch')
    try {
      const result = await movieApi.markAllUnwatched()
      setMovies((current) => current.map((movie) => ({ ...movie, watched: false })))
      setToast(copy.allMarkedUnwatched(result.affectedCount))
    } catch (requestError) {
      setToast(requestError.message)
    } finally {
      setBatchAction('')
    }
  }

  async function confirmDeleteAll() {
    setBatchAction('delete')
    try {
      const result = await movieApi.removeAll()
      setMovies([])
      setDeleteAllOpen(false)
      setToast(copy.allDeleted(result.affectedCount))
    } catch (requestError) {
      setToast(requestError.message)
    } finally {
      setBatchAction('')
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

  function goToPage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), pageCount))
    document.getElementById('catalog-results')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  function moveHeroSpotlight(event) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    event.currentTarget.style.setProperty('--spotlight-x', `${x}%`)
    event.currentTarget.style.setProperty('--spotlight-y', `${y}%`)
  }

  function resetHeroSpotlight(event) {
    event.currentTarget.style.removeProperty('--spotlight-x')
    event.currentTarget.style.removeProperty('--spotlight-y')
  }

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
          {currentUser.role === 'ADMIN' && <button className="admin-nav-button" type="button" onClick={openAdminUsers}><Users size={15} />{copy.manageUsers}</button>}
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
        <section className="hero-strip" id="catalog" onPointerMove={moveHeroSpotlight} onPointerLeave={resetHeroSpotlight}>
          <div className="hero-copy">
            <span className="eyebrow">{copy.heroEyebrow}</span>
            <h1><span>{copy.heroTitle}</span><em>{copy.heroAccent}</em></h1>
            <p>{copy.heroBody}</p>
          </div>
          <div className="hero-reel" aria-hidden="true"><Clapperboard size={44} /><span>{movies.length.toString().padStart(3, '0')}</span><small>{copy.titlesIndexed}</small></div>
        </section>

        <div className="cinema-ticker" aria-hidden="true">
          <div>
            {[...CINEMA_TICKER, ...CINEMA_TICKER].map((item, index) => <span key={`${item}-${index}`}>{item}<i>✦</i></span>)}
          </div>
        </div>

        <section className={`stats-grid ${currentUser.role === 'ADMIN' ? 'with-admin' : ''}`} id="stats">
          <article><span className="stat-icon blue"><Film size={18} /></span><div><small>{copy.totalCollection}</small><strong>{movies.length}</strong><em>{copy.titles}</em></div></article>
          <article><span className="stat-icon green"><Check size={18} /></span><div><small>{copy.watched}</small><strong>{stats.watched}</strong><em>{movies.length ? Math.round(stats.watched / movies.length * 100) : 0}% {copy.complete}</em></div></article>
          <article><span className="stat-icon amber"><Clock3 size={18} /></span><div><small>{copy.timeWatched}</small><strong>{Math.floor(stats.minutes / 60)}</strong><em>{copy.hours}</em></div></article>
          <article><span className="stat-icon red"><Star size={18} /></span><div><small>{copy.averageRating}</small><strong>{stats.average.toFixed(1)}</strong><em>{copy.outOfTen}</em></div></article>
          {currentUser.role === 'ADMIN' && <article className="admin-user-stat"><span className="stat-icon violet"><Users size={18} /></span><div><small>{copy.registeredUsers}</small><strong>{registeredUsers ?? '—'}</strong><em>{copy.accounts}</em></div></article>}
        </section>

        <section className="library-panel" id="catalog-results">
          <div className="panel-heading">
            <div><span className="eyebrow">{copy.catalog}</span><h2>{copy.movieLibrary}</h2><p>{copy.shown(filteredMovies.length, movies.length)}</p></div>
            <div className="panel-actions">
              <button className="button button-quiet panel-batch-action" type="button" onClick={() => { setBatchError(''); setBatchOpen(true) }}><Upload size={15} />{copy.importCsv}</button>
              <button className="button button-quiet panel-batch-action" type="button" onClick={exportMovies}><Download size={15} />{copy.exportCsv}</button>
              <button className="button button-quiet panel-batch-action" type="button" onClick={markAllWatched} disabled={Boolean(batchAction) || !movies.some((movie) => !movie.watched)}><CheckCheck size={15} />{batchAction === 'watch' ? copy.watchingAll : copy.watchAll}</button>
              <button className="button button-quiet panel-batch-action" type="button" onClick={markAllUnwatched} disabled={Boolean(batchAction) || !movies.some((movie) => movie.watched)}><Undo2 size={15} />{batchAction === 'unwatch' ? copy.watchingAll : copy.unwatchAll}</button>
              <button className="button button-danger panel-batch-action panel-delete-all" type="button" onClick={() => setDeleteAllOpen(true)} disabled={Boolean(batchAction) || movies.length === 0}><Trash2 size={15} />{copy.deleteAll}</button>
              <button className="button button-primary mobile-add" type="button" onClick={openNew}><Plus size={16} />{copy.addMovie}</button>
            </div>
          </div>

          <div className="toolbar">
            <label className="search-box"><Search size={17} /><input aria-label={copy.searchLibrary} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} />{query && <button onClick={() => setQuery('')} aria-label={copy.clearSearch}><X size={15} /></button>}</label>
            <button className={`filter-toggle ${showFilters ? 'active' : ''}`} type="button" onClick={() => setShowFilters((value) => !value)}><SlidersHorizontal size={16} />{copy.filters}<ChevronDown size={15} /></button>
            <label className="select-wrap"><span className="sr-only">{copy.sortMovies}</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">{copy.newest}</option><option value="oldest">{copy.oldest}</option><option value="title">{copy.titleSort}</option><option value="rating">{copy.ratingSort}</option></select><ChevronDown size={14} /></label>
          </div>

          {showFilters && <div className="filter-row"><label>{copy.genre}<select value={genre} onChange={(event) => setGenre(event.target.value)}>{genres.map((item) => <option key={item} value={item}>{item === 'All genres' ? copy.allGenres : item}</option>)}</select></label><label>{copy.status}<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="All movies">{copy.allMovies}</option><option value="Watched">{copy.watched}</option><option value="Unwatched">{copy.unwatched}</option></select></label>{hasFilters && <button type="button" onClick={() => { setQuery(''); setGenre('All genres'); setStatus('All movies') }}>{copy.clearFilters}</button>}</div>}

          {error && <div className="error-banner"><AlertCircle size={18} /><div><strong>{copy.loadErrorTitle}</strong><span>{copy.serviceUnavailable}</span></div><button type="button" onClick={loadMovies}><RefreshCw size={15} />{copy.retry}</button></div>}
          {loading ? <LoadingRows label={copy.loadingMovies} /> : !error && <>
            <MovieTable language={language} movies={pageMovies} onEdit={openEdit} onDelete={setDeleteMovie} onToggleWatched={toggleWatched} />
            {filteredMovies.length > MOVIES_PER_PAGE && <nav className="catalog-pagination" aria-label={copy.pageStatus(currentPage, pageCount)}>
              <span className="pagination-range">{copy.pageRange(pageStart + 1, Math.min(pageStart + MOVIES_PER_PAGE, filteredMovies.length), filteredMovies.length)}</span>
              <div className="pagination-controls">
                <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label={copy.previousPage}><ChevronLeft size={16} /></button>
                {visiblePageNumbers(currentPage, pageCount).map((page, index, pages) => <span className="pagination-item" key={page}>
                  {index > 0 && page - pages[index - 1] > 1 && <span className="pagination-ellipsis" aria-hidden="true">…</span>}
                  <button className={page === currentPage ? 'active' : ''} type="button" onClick={() => goToPage(page)} aria-current={page === currentPage ? 'page' : undefined} aria-label={copy.goToPage(page)}>{page}</button>
                </span>)}
                <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount} aria-label={copy.nextPage}><ChevronRight size={16} /></button>
              </div>
              <span className="pagination-status">{copy.pageStatus(currentPage, pageCount)}</span>
            </nav>}
          </>}
        </section>
      </main>

      <footer className="site-footer"><BrandMark /><span>FRAMEBASE</span><p>{copy.footer}</p><small>{copy.footerNote}</small></footer>

      {formOpen && <MovieForm language={language} movie={formMovie} saving={saving} serverErrors={serverErrors} onClose={() => setFormOpen(false)} onSave={saveMovie} />}
      {batchOpen && <BatchImportDialog language={language} busy={batchImporting} error={batchError} onClose={() => setBatchOpen(false)} onImport={importMovies} onDownloadTemplate={downloadTemplate} />}
      {passwordDialogOpen && <PasswordChangeDialog language={language} username={currentUser.username} busy={changingPassword} error={passwordError} onClose={() => setPasswordDialogOpen(false)} onSave={changePassword} />}
      {adminUsersOpen && <AdminUsersDialog language={language} users={adminUsers} loading={adminUsersLoading} error={adminUsersError} resetError={adminResetError} busy={adminResetting} onClose={() => setAdminUsersOpen(false)} onReset={resetUserPassword} />}
      {deleteMovie && <ConfirmDialog movie={deleteMovie} busy={deleting} copy={copy} onCancel={() => setDeleteMovie(null)} onConfirm={confirmDelete} />}
      {deleteAllOpen && <DeleteAllDialog count={movies.length} busy={batchAction === 'delete'} copy={copy} onCancel={() => setDeleteAllOpen(false)} onConfirm={confirmDeleteAll} />}
      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    </div>
  )
}
