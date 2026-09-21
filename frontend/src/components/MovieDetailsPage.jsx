import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Check, ChevronLeft, ChevronRight, Clock3, ExternalLink, Eye, EyeOff, Pencil, Play, RefreshCw, Star } from 'lucide-react'
import { movieApi } from '../api/movies'
import MoviePoster from './MoviePoster'

const COPY = {
  en: {
    details: 'Movie details', back: 'Back to library', loading: 'Loading movie details…',
    unavailable: 'Movie unavailable', unavailableHelp: 'This movie was removed or is not in your library.',
    error: 'Could not load movie details', errorHelp: 'Please try again in a moment.', retry: 'Retry',
    director: 'Director', year: 'Release year', genre: 'Genre', runtime: 'Runtime', language: 'Language',
    status: 'Watch status', watched: 'Watched', unwatched: 'Unwatched', rating: 'Personal rating',
    unrated: 'Not rated yet', minutes: 'min', synopsis: 'Synopsis', noSynopsis: 'No synopsis added yet.', cast: 'Cast', noCast: 'No cast added yet.', notes: 'Notes', noNotes: 'No notes added yet.',
    edit: 'Edit movie', markWatched: 'Mark watched', markUnwatched: 'Move to watchlist', updating: 'Updating…', imdb: 'View on IMDb', trailer: 'Watch trailer', previous: 'Previous movie', next: 'Next movie',
    filePath: 'File location', created: 'Added to library', missing: 'Not provided', locale: 'en',
  },
  zh: {
    details: '电影详情', back: '返回片库', loading: '正在加载电影详情…',
    unavailable: '电影不可用', unavailableHelp: '这部电影已被移除，或不在你的片库中。',
    error: '无法加载电影详情', errorHelp: '请稍后重试。', retry: '重试',
    director: '导演', year: '上映年份', genre: '类型', runtime: '时长', language: '语言',
    status: '观看状态', watched: '已观看', unwatched: '未观看', rating: '个人评分',
    unrated: '暂无评分', minutes: '分钟', synopsis: '剧情简介', noSynopsis: '尚未添加剧情简介。', cast: '演员', noCast: '尚未添加演员信息。', notes: '笔记', noNotes: '尚未添加笔记。',
    edit: '编辑电影', markWatched: '标记为已看', markUnwatched: '移回待看片单', updating: '正在更新…', imdb: '在 IMDb 查看', trailer: '观看预告片', previous: '上一部电影', next: '下一部电影',
    filePath: '文件位置', created: '加入片库时间', missing: '未提供', locale: 'zh-CN',
  },
}

export default function MovieDetailsPage({ movieId, language = 'en', revision = 0, previousMovie, nextMovie, onEdit, onToggleWatched, onSessionExpired }) {
  const copy = COPY[language]
  const [movie, setMovie] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const heading = useRef(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setMovie(null)
    movieApi.get(movieId)
      .then((result) => { if (active) setMovie(result) })
      .catch((requestError) => {
        if (!active) return
        if (requestError.status === 401) onSessionExpired()
        else setError(requestError.status === 404 || requestError.status === 403 ? 'unavailable' : 'error')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [movieId, attempt, revision, onSessionExpired])

  useEffect(() => { heading.current?.focus() }, [loading])

  const createdAt = movie?.createdAt ? new Date(movie.createdAt) : null
  const createdLabel = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleString(copy.locale, { dateStyle: 'medium', timeStyle: 'short' })
    : copy.missing
  const castMembers = movie?.castMembers?.split(',').map((name) => name.trim()).filter(Boolean) || []

  async function toggleWatched() {
    if (!movie || !onToggleWatched) return
    setUpdatingStatus(true)
    try {
      const saved = await onToggleWatched(movie)
      if (saved) setMovie(saved)
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <section className="movie-details-page" aria-label={copy.details}>
      <div className="details-toolbar">
        <a className="button button-quiet details-back" href="#catalog-results"><ArrowLeft size={16} />{copy.back}</a>
        <nav className="details-neighbors" aria-label={language === 'zh' ? '电影导航' : 'Movie navigation'}>
          {previousMovie && <a className="button button-quiet" href={`#movies/${previousMovie.id}`} aria-label={`${copy.previous}: ${previousMovie.title}`}><ChevronLeft size={16} /><span>{previousMovie.title}</span></a>}
          {nextMovie && <a className="button button-quiet" href={`#movies/${nextMovie.id}`} aria-label={`${copy.next}: ${nextMovie.title}`}><span>{nextMovie.title}</span><ChevronRight size={16} /></a>}
        </nav>
      </div>
      {loading ? <div className="details-message" role="status"><h1 ref={heading} tabIndex={-1}>{copy.loading}</h1></div>
        : error ? <div className="details-message" role="alert">
          <AlertCircle size={28} />
          <h1 ref={heading} tabIndex={-1}>{copy[error]}</h1>
          <p>{error === 'unavailable' ? copy.unavailableHelp : copy.errorHelp}</p>
          {error !== 'unavailable' && <button className="button button-primary" type="button" onClick={() => setAttempt((value) => value + 1)}><RefreshCw size={15} />{copy.retry}</button>}
        </div> : movie && <article className="movie-details-content">
          <header className="movie-details-hero">
            <div className="movie-details-poster"><MoviePoster movie={movie} eager /></div>
            <div className="movie-details-heading">
              <span className="eyebrow">{copy.details}</span>
              <h1 ref={heading} tabIndex={-1}>{movie.title}</h1>
              <p>{movie.releaseYear} · {movie.director}</p>
              <div className="movie-details-badges">
                <span className="genre-tag">{movie.genre}</span>
                <span className="muted-value"><Clock3 size={15} />{movie.runtimeMinutes} {copy.minutes}</span>
              </div>
              <div className="movie-details-actions">
                {onEdit && <button className="button button-primary" type="button" onClick={() => onEdit(movie)}><Pencil size={15} />{copy.edit}</button>}
                {onToggleWatched && <button className="button button-quiet" type="button" disabled={updatingStatus} onClick={toggleWatched}>{movie.watched ? <EyeOff size={15} /> : <Eye size={15} />}{updatingStatus ? copy.updating : movie.watched ? copy.markUnwatched : copy.markWatched}</button>}
              </div>
            </div>
          </header>
          <dl className="movie-details-facts">
            <div><dt>{copy.director}</dt><dd>{movie.director}</dd></div>
            <div><dt>{copy.year}</dt><dd>{movie.releaseYear}</dd></div>
            <div><dt>{copy.genre}</dt><dd>{movie.genre}</dd></div>
            <div><dt>{copy.runtime}</dt><dd>{movie.runtimeMinutes} {copy.minutes}</dd></div>
            <div><dt>{copy.language}</dt><dd>{movie.language}</dd></div>
            <div><dt>{copy.status}</dt><dd><span className={`status-pill ${movie.watched ? 'is-watched' : ''}`}>{movie.watched ? <Check size={13} /> : <EyeOff size={13} />}{movie.watched ? copy.watched : copy.unwatched}</span></dd></div>
            <div><dt>{copy.rating}</dt><dd>{movie.personalRating == null ? copy.unrated : <span className="rating"><Star size={16} fill="currentColor" />{movie.personalRating.toFixed(1)} / 10</span>}</dd></div>
            <div><dt>{copy.created}</dt><dd>{createdLabel}</dd></div>
          </dl>
          <section className="movie-details-story">
            <div className="movie-details-synopsis"><h2>{copy.synopsis}</h2><p>{movie.synopsis?.trim() || copy.noSynopsis}</p></div>
            <div className="movie-details-cast"><h2>{copy.cast}</h2>{castMembers.length ? <div>{castMembers.map((name, index) => <span key={`${name}-${index}`}>{name}</span>)}</div> : <p>{copy.noCast}</p>}</div>
          </section>
          {(movie.imdbUrl || movie.trailerUrl) && <section className="movie-details-links">
            {movie.imdbUrl && <a className="button button-quiet" href={movie.imdbUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />{copy.imdb}</a>}
            {movie.trailerUrl && <a className="button button-quiet" href={movie.trailerUrl} target="_blank" rel="noreferrer"><Play size={15} />{copy.trailer}</a>}
          </section>}
          <section className="movie-details-notes"><h2>{copy.notes}</h2><p>{movie.notes?.trim() ? movie.notes : copy.noNotes}</p></section>
          <section className="movie-details-file"><h2>{copy.filePath}</h2><code>{movie.filePath || copy.missing}</code></section>
        </article>}
    </section>
  )
}
