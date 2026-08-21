import { Check, Clock3, Edit3, Eye, EyeOff, Film, Star, Trash2 } from 'lucide-react'

function PosterTile({ movie }) {
  const initials = movie.title.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  const hue = (movie.title.split('').reduce((total, char) => total + char.charCodeAt(0), 0) * 7) % 360
  return <div className="poster-tile" style={{ '--poster-hue': hue }} aria-hidden="true"><span>{initials}</span></div>
}

export default function MovieTable({ movies, onEdit, onDelete, onToggleWatched }) {
  if (movies.length === 0) {
    return (
      <div className="empty-state">
        <Film size={32} />
        <h3>No matching titles</h3>
        <p>Try clearing a filter or add a new movie to your library.</p>
      </div>
    )
  }

  return (
    <div className="catalog-wrap">
      <table className="movie-table">
        <thead>
          <tr>
            <th className="poster-column"><span className="sr-only">Cover</span></th>
            <th>Title</th>
            <th>Genre</th>
            <th>Runtime</th>
            <th>Status</th>
            <th>Rating</th>
            <th><span className="sr-only">Actions</span></th>
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
              <td><span className="muted-value"><Clock3 size={14} />{movie.runtimeMinutes} min</span></td>
              <td>
                <button className={`status-pill ${movie.watched ? 'is-watched' : ''}`} type="button" onClick={() => onToggleWatched(movie)} aria-label={`Mark ${movie.title} as ${movie.watched ? 'unwatched' : 'watched'}`}>
                  {movie.watched ? <Check size={13} /> : <EyeOff size={13} />}{movie.watched ? 'Watched' : 'Unwatched'}
                </button>
              </td>
              <td>{movie.personalRating == null ? <span className="no-rating">—</span> : <span className="rating"><Star size={14} fill="currentColor" />{movie.personalRating.toFixed(1)}</span>}</td>
              <td>
                <div className="row-actions">
                  <button type="button" onClick={() => onEdit(movie)} aria-label={`Edit ${movie.title}`}><Edit3 size={16} /></button>
                  <button className="danger-action" type="button" onClick={() => onDelete(movie)} aria-label={`Delete ${movie.title}`}><Trash2 size={16} /></button>
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
              <div className="movie-card-meta"><span>{movie.genre}</span><span>{movie.runtimeMinutes} min</span>{movie.personalRating != null && <span className="rating"><Star size={13} fill="currentColor" />{movie.personalRating.toFixed(1)}</span>}</div>
              <div className="movie-card-actions">
                <button onClick={() => onToggleWatched(movie)}>{movie.watched ? <Check size={14} /> : <Eye size={14} />}{movie.watched ? 'Watched' : 'Mark watched'}</button>
                <button onClick={() => onEdit(movie)}><Edit3 size={14} />Edit</button>
                <button className="danger-action" onClick={() => onDelete(movie)}><Trash2 size={14} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
