import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, BarChart3, Check, ChevronDown, Clapperboard, Clock3, Film, Library, Plus, RefreshCw, Search, SlidersHorizontal, Star, X } from 'lucide-react'
import { movieApi } from './api/movies'
import { BrandMark } from './components/Icons'
import MovieForm from './components/MovieForm'
import MovieTable from './components/MovieTable'

function ConfirmDialog({ movie, busy, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
        <div className="confirm-icon"><AlertCircle size={23} /></div>
        <h2 id="delete-title">Remove “{movie.title}”?</h2>
        <p>This deletes the catalog entry. It does not delete the movie file from your device.</p>
        <div className="confirm-actions">
          <button className="button button-quiet" type="button" onClick={onCancel}>Keep movie</button>
          <button className="button button-danger" type="button" onClick={onConfirm} disabled={busy}>{busy ? 'Removing…' : 'Remove'}</button>
        </div>
      </section>
    </div>
  )
}

function LoadingRows() {
  return <div className="loading-panel" aria-label="Loading movies"><span /><span /><span /><span /></div>
}

export default function App() {
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

  const loadMovies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await movieApi.list()
      setMovies(data)
    } catch {
      setError('The movie service is not available. Start the backend and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMovies() }, [loadMovies])
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
      setToast(formMovie ? 'Movie updated' : 'Movie added to your library')
    } catch (requestError) {
      setServerErrors(requestError.fieldErrors || {})
      if (!Object.keys(requestError.fieldErrors || {}).length) setToast(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleWatched(movie) {
    try {
      const saved = await movieApi.update(movie.id, { ...movie, watched: !movie.watched, createdAt: undefined, id: undefined })
      setMovies((current) => current.map((item) => item.id === saved.id ? saved : item))
      setToast(saved.watched ? 'Marked as watched' : 'Moved back to watchlist')
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
      setToast('Movie removed')
    } catch (requestError) {
      setToast(requestError.message)
    } finally {
      setDeleting(false)
    }
  }

  const hasFilters = query || genre !== 'All genres' || status !== 'All movies'

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#catalog" aria-label="Framebase home"><BrandMark /><span><strong>FRAMEBASE</strong><small>Personal movie index</small></span></a>
        <nav className="primary-nav" aria-label="Primary navigation">
          <a className="active" href="#catalog"><Library size={15} />Library</a>
          <a href="#stats"><BarChart3 size={15} />Overview</a>
        </nav>
        <button className="button button-primary top-add" type="button" onClick={openNew}><Plus size={16} />Add movie</button>
        <button className="mobile-menu" type="button" onClick={openNew} aria-label="Add movie"><Plus size={21} /></button>
      </header>

      <main>
        <section className="hero-strip" id="catalog">
          <div>
            <span className="eyebrow">Your private screening room</span>
            <h1>Find the right film<br /><em>without the scroll.</em></h1>
            <p>A clean index of every title you own, what you have watched, and what deserves the next evening.</p>
          </div>
          <div className="hero-reel" aria-hidden="true"><Clapperboard size={44} /><span>{movies.length.toString().padStart(3, '0')}</span><small>titles indexed</small></div>
        </section>

        <section className="stats-grid" id="stats">
          <article><span className="stat-icon blue"><Film size={18} /></span><div><small>Total collection</small><strong>{movies.length}</strong><em>titles</em></div></article>
          <article><span className="stat-icon green"><Check size={18} /></span><div><small>Watched</small><strong>{stats.watched}</strong><em>{movies.length ? Math.round(stats.watched / movies.length * 100) : 0}% complete</em></div></article>
          <article><span className="stat-icon amber"><Clock3 size={18} /></span><div><small>Time watched</small><strong>{Math.floor(stats.minutes / 60)}</strong><em>hours</em></div></article>
          <article><span className="stat-icon red"><Star size={18} /></span><div><small>Average rating</small><strong>{stats.average.toFixed(1)}</strong><em>out of 10</em></div></article>
        </section>

        <section className="library-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Catalog</span><h2>Movie library</h2><p>{filteredMovies.length} of {movies.length} titles shown</p></div>
            <button className="button button-primary mobile-add" type="button" onClick={openNew}><Plus size={16} />Add movie</button>
          </div>

          <div className="toolbar">
            <label className="search-box"><Search size={17} /><input aria-label="Search library" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, director, genre…" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}</label>
            <button className={`filter-toggle ${showFilters ? 'active' : ''}`} type="button" onClick={() => setShowFilters((value) => !value)}><SlidersHorizontal size={16} />Filters<ChevronDown size={15} /></button>
            <label className="select-wrap"><span className="sr-only">Sort movies</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option><option value="rating">Highest rated</option></select><ChevronDown size={14} /></label>
          </div>

          {showFilters && <div className="filter-row"><label>Genre<select value={genre} onChange={(event) => setGenre(event.target.value)}>{genres.map((item) => <option key={item}>{item}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>All movies</option><option>Watched</option><option>Unwatched</option></select></label>{hasFilters && <button type="button" onClick={() => { setQuery(''); setGenre('All genres'); setStatus('All movies') }}>Clear filters</button>}</div>}

          {error && <div className="error-banner"><AlertCircle size={18} /><div><strong>Could not load your library</strong><span>{error}</span></div><button type="button" onClick={loadMovies}><RefreshCw size={15} />Retry</button></div>}
          {loading ? <LoadingRows /> : !error && <MovieTable movies={filteredMovies} onEdit={openEdit} onDelete={setDeleteMovie} onToggleWatched={toggleWatched} />}
        </section>
      </main>

      <footer className="site-footer"><BrandMark /><span>FRAMEBASE</span><p>Your collection. Your ratings. Your next movie.</p><small>Local-first catalog · Built for movie nights</small></footer>

      {formOpen && <MovieForm movie={formMovie} saving={saving} serverErrors={serverErrors} onClose={() => setFormOpen(false)} onSave={saveMovie} />}
      {deleteMovie && <ConfirmDialog movie={deleteMovie} busy={deleting} onCancel={() => setDeleteMovie(null)} onConfirm={confirmDelete} />}
      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    </div>
  )
}
