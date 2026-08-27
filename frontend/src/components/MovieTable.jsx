import { Check, Clock3, Edit3, Eye, EyeOff, Film, Star, Trash2 } from 'lucide-react'

const COPY = {
  en: { noTitles: 'No matching titles', emptyHelp: 'Try clearing a filter or add a new movie to your library.', cover: 'Cover', title: 'Title', genre: 'Genre', runtime: 'Runtime', status: 'Status', rating: 'Rating', actions: 'Actions', minutes: 'min', watched: 'Watched', unwatched: 'Unwatched', markWatched: 'Mark watched', markAs: (title, watched) => `Mark ${title} as ${watched ? 'watched' : 'unwatched'}`, edit: (title) => `Edit ${title}`, delete: (title) => `Delete ${title}`, editShort: 'Edit' },
  zh: { noTitles: '没有匹配的电影', emptyHelp: '尝试清除筛选条件，或向片库添加一部新电影。', cover: '封面', title: '片名', genre: '类型', runtime: '时长', status: '状态', rating: '评分', actions: '操作', minutes: '分钟', watched: '已观看', unwatched: '未观看', markWatched: '标记为看过', markAs: (title, watched) => `将《${title}》标记为${watched ? '已观看' : '未观看'}`, edit: (title) => `编辑《${title}》`, delete: (title) => `删除《${title}》`, editShort: '编辑' }
}

function PosterTile({ movie }) {
  const initials = movie.title.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  const hue = (movie.title.split('').reduce((total, char) => total + char.charCodeAt(0), 0) * 7) % 360
  return <div className="poster-tile" style={{ '--poster-hue': hue }} aria-hidden="true"><span>{initials}</span></div>
}

export default function MovieTable({ language = 'en', movies, onEdit, onDelete, onToggleWatched }) {
  const copy = COPY[language]
  if (movies.length === 0) {
    return (
      <div className="empty-state">
        <Film size={32} />
        <h3>{copy.noTitles}</h3>
        <p>{copy.emptyHelp}</p>
      </div>
    )
  }

  return (
    <div className="catalog-wrap">
      <table className="movie-table">
        <thead>
          <tr>
            <th className="poster-column"><span className="sr-only">{copy.cover}</span></th>
            <th>{copy.title}</th>
            <th>{copy.genre}</th>
            <th>{copy.runtime}</th>
            <th>{copy.status}</th>
            <th>{copy.rating}</th>
            <th><span className="sr-only">{copy.actions}</span></th>
          </tr>
        </thead>
        <tbody>
          {movies.map((movie) => (
            <tr key={movie.id}>
              <td><PosterTile movie={movie} /></td>
              <td>
                <div className="title-cell"><strong>{movie.title}</strong><span>{movie.releaseYear} · {movie.director}</span></div>
              </td>
              <td><span className="genre-tag">{movie.genre}</span></td>
              <td><span className="muted-value"><Clock3 size={14} />{movie.runtimeMinutes} {copy.minutes}</span></td>
              <td>
                <button className={`status-pill ${movie.watched ? 'is-watched' : ''}`} type="button" onClick={() => onToggleWatched(movie)} aria-label={copy.markAs(movie.title, !movie.watched)}>
                  {movie.watched ? <Check size={13} /> : <EyeOff size={13} />}{movie.watched ? copy.watched : copy.unwatched}
                </button>
              </td>
              <td>{movie.personalRating == null ? <span className="no-rating">—</span> : <span className="rating"><Star size={14} fill="currentColor" />{movie.personalRating.toFixed(1)}</span>}</td>
              <td>
                <div className="row-actions">
                  <button type="button" onClick={() => onEdit(movie)} aria-label={copy.edit(movie.title)}><Edit3 size={16} /></button>
                  <button className="danger-action" type="button" onClick={() => onDelete(movie)} aria-label={copy.delete(movie.title)}><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="movie-cards">
        {movies.map((movie) => (
          <article className="movie-card" key={movie.id}>
            <PosterTile movie={movie} />
            <div className="movie-card-main">
              <div className="movie-card-title"><div><h3>{movie.title}</h3><p>{movie.releaseYear} · {movie.director}</p></div></div>
              <div className="movie-card-meta"><span>{movie.genre}</span><span>{movie.runtimeMinutes} {copy.minutes}</span>{movie.personalRating != null && <span className="rating"><Star size={13} fill="currentColor" />{movie.personalRating.toFixed(1)}</span>}</div>
              <div className="movie-card-actions">
                <button onClick={() => onToggleWatched(movie)}>{movie.watched ? <Check size={14} /> : <Eye size={14} />}{movie.watched ? copy.watched : copy.markWatched}</button>
                <button onClick={() => onEdit(movie)}><Edit3 size={14} />{copy.editShort}</button>
                <button className="danger-action" onClick={() => onDelete(movie)} aria-label={copy.delete(movie.title)}><Trash2 size={14} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
