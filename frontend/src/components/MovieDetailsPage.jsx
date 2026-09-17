import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Check, Clock3, EyeOff, RefreshCw, Star } from 'lucide-react'
import { movieApi } from '../api/movies'
import { PosterTile } from './MovieTable'

const COPY = {
  en: {
    details: 'Movie details', back: 'Back to library', loading: 'Loading movie details…',
    unavailable: 'Movie unavailable', unavailableHelp: 'This movie was removed or is not in your library.',
    error: 'Could not load movie details', errorHelp: 'Please try again in a moment.', retry: 'Retry',
    director: 'Director', year: 'Release year', genre: 'Genre', runtime: 'Runtime', language: 'Language',
    status: 'Watch status', watched: 'Watched', unwatched: 'Unwatched', rating: 'Personal rating',
    unrated: 'Not rated yet', minutes: 'min', notes: 'Notes', noNotes: 'No notes added yet.',
    filePath: 'File location', created: 'Added to library', missing: 'Not provided', locale: 'en',
  },
  zh: {
    details: '电影详情', back: '返回片库', loading: '正在加载电影详情…',
    unavailable: '电影不可用', unavailableHelp: '这部电影已被移除，或不在你的片库中。',
    error: '无法加载电影详情', errorHelp: '请稍后重试。', retry: '重试',
    director: '导演', year: '上映年份', genre: '类型', runtime: '时长', language: '语言',
    status: '观看状态', watched: '已观看', unwatched: '未观看', rating: '个人评分',
    unrated: '暂无评分', minutes: '分钟', notes: '笔记', noNotes: '尚未添加笔记。',
    filePath: '文件位置', created: '加入片库时间', missing: '未提供', locale: 'zh-CN',
  },
}

export default function MovieDetailsPage({ movieId, language = 'en', onSessionExpired }) {
  const copy = COPY[language]
  const [movie, setMovie] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
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
  }, [movieId, attempt, onSessionExpired])

  useEffect(() => { heading.current?.focus() }, [loading])

  const createdAt = movie?.createdAt ? new Date(movie.createdAt) : null
  const createdLabel = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleString(copy.locale, { dateStyle: 'medium', timeStyle: 'short' })
    : copy.missing

  return (
    <section className="movie-details-page" aria-label={copy.details}>
      <a className="button button-quiet details-back" href="#catalog-results"><ArrowLeft size={16} />{copy.back}</a>
      {loading ? <div className="details-message" role="status"><h1 ref={heading} tabIndex={-1}>{copy.loading}</h1></div>
        : error ? <div className="details-message" role="alert">
          <AlertCircle size={28} />
          <h1 ref={heading} tabIndex={-1}>{copy[error]}</h1>
          <p>{error === 'unavailable' ? copy.unavailableHelp : copy.errorHelp}</p>
          {error !== 'unavailable' && <button className="button button-primary" type="button" onClick={() => setAttempt((value) => value + 1)}><RefreshCw size={15} />{copy.retry}</button>}
        </div> : movie && <article className="movie-details-content">
          <header className="movie-details-hero">
            <div className="movie-details-poster"><PosterTile movie={movie} /></div>
            <div className="movie-details-heading">
              <span className="eyebrow">{copy.details}</span>
              <h1 ref={heading} tabIndex={-1}>{movie.title}</h1>
              <p>{movie.releaseYear} · {movie.director}</p>
              <div className="movie-details-badges">
                <span className="genre-tag">{movie.genre}</span>
                <span className="muted-value"><Clock3 size={15} />{movie.runtimeMinutes} {copy.minutes}</span>
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
          <section className="movie-details-notes"><h2>{copy.notes}</h2><p>{movie.notes?.trim() ? movie.notes : copy.noNotes}</p></section>
          <section className="movie-details-file"><h2>{copy.filePath}</h2><code>{movie.filePath || copy.missing}</code></section>
        </article>}
    </section>
  )
}
