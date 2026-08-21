import { useEffect, useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'

const emptyMovie = {
  title: '',
  releaseYear: new Date().getFullYear(),
  director: '',
  genre: '',
  runtimeMinutes: 90,
  language: 'English',
  watched: false,
  personalRating: '',
  filePath: '',
  notes: '',
}

export default function MovieForm({ movie, saving, serverErrors, onClose, onSave }) {
  const initial = useMemo(() => movie ? { ...movie, personalRating: movie.personalRating ?? '' } : emptyMovie, [movie])
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})

  useEffect(() => setValues(initial), [initial])

  function update(event) {
    const { name, value, type, checked } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  function validate() {
    const next = {}
    if (!values.title.trim()) next.title = 'Enter a title.'
    if (Number(values.releaseYear) < 1888 || Number(values.releaseYear) > 2100) next.releaseYear = 'Use a year from 1888 to 2100.'
    if (!values.director.trim()) next.director = 'Enter a director.'
    if (!values.genre.trim()) next.genre = 'Enter a genre.'
    if (Number(values.runtimeMinutes) < 1 || Number(values.runtimeMinutes) > 1000) next.runtimeMinutes = 'Use 1–1000 minutes.'
    if (!values.language.trim()) next.language = 'Enter a language.'
    if (!values.filePath.trim()) next.filePath = 'Enter where the movie is stored.'
    if (values.personalRating !== '' && (Number(values.personalRating) < 0 || Number(values.personalRating) > 10)) next.personalRating = 'Use a rating from 0 to 10.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function submit(event) {
    event.preventDefault()
    if (!validate()) return
    onSave({
      ...values,
      releaseYear: Number(values.releaseYear),
      runtimeMinutes: Number(values.runtimeMinutes),
      personalRating: values.personalRating === '' ? null : Number(values.personalRating),
      notes: values.notes.trim() || null,
    })
  }

  const fieldError = (name) => errors[name] || serverErrors?.[name]

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="movie-modal" role="dialog" aria-modal="true" aria-labelledby="movie-form-title">
        <header className="modal-header">
          <div>
            <span className="eyebrow">Library entry</span>
            <h2 id="movie-form-title">{movie ? 'Edit movie' : 'Add a movie'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close form"><X size={19} /></button>
        </header>

        <form onSubmit={submit} className="movie-form">
          <label className="field field-wide">
            <span>Title</span>
            <input name="title" value={values.title} onChange={update} maxLength="200" autoFocus />
            {fieldError('title') && <small>{fieldError('title')}</small>}
          </label>

          <label className="field">
            <span>Release year</span>
            <input name="releaseYear" type="number" min="1888" max="2100" value={values.releaseYear} onChange={update} />
            {fieldError('releaseYear') && <small>{fieldError('releaseYear')}</small>}
          </label>

          <label className="field">
            <span>Runtime (minutes)</span>
            <input name="runtimeMinutes" type="number" min="1" max="1000" value={values.runtimeMinutes} onChange={update} />
            {fieldError('runtimeMinutes') && <small>{fieldError('runtimeMinutes')}</small>}
          </label>

          <label className="field">
            <span>Director</span>
            <input name="director" value={values.director} onChange={update} maxLength="150" />
            {fieldError('director') && <small>{fieldError('director')}</small>}
          </label>

          <label className="field">
            <span>Genre</span>
            <input name="genre" value={values.genre} onChange={update} maxLength="100" placeholder="e.g. Science Fiction" />
            {fieldError('genre') && <small>{fieldError('genre')}</small>}
          </label>

          <label className="field">
            <span>Language</span>
            <input name="language" value={values.language} onChange={update} maxLength="100" />
            {fieldError('language') && <small>{fieldError('language')}</small>}
          </label>

          <label className="field">
            <span>Personal rating</span>
            <input name="personalRating" type="number" min="0" max="10" step="0.1" value={values.personalRating} onChange={update} placeholder="0–10" />
            {fieldError('personalRating') && <small>{fieldError('personalRating')}</small>}
          </label>

          <label className="field field-wide">
            <span>File path</span>
            <input name="filePath" value={values.filePath} onChange={update} maxLength="1000" placeholder="/Volumes/Movies/title.mkv" />
            {fieldError('filePath') && <small>{fieldError('filePath')}</small>}
          </label>

          <label className="field field-wide">
            <span>Notes <em>optional</em></span>
            <textarea name="notes" value={values.notes ?? ''} onChange={update} maxLength="2000" rows="3" />
            {fieldError('notes') && <small>{fieldError('notes')}</small>}
          </label>

          <label className="watch-check field-wide">
            <input name="watched" type="checkbox" checked={values.watched} onChange={update} />
            <span className="check-box"><Check size={14} /></span>
            <span><strong>Watched</strong><small>Mark this title as completed</small></span>
          </label>

          <footer className="modal-actions field-wide">
            <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : movie ? 'Save changes' : 'Add to library'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
