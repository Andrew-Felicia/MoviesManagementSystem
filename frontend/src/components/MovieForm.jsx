import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import MoviePoster from './MoviePoster'
import { isValidPoster, MAX_POSTER_FILE_SIZE, readPosterFile } from '../utils/moviePoster'

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
  posterUrl: '',
}

const COPY = {
  en: {
    poster: 'Poster', posterUrl: 'Poster URL', posterUpload: 'Upload poster photo', posterHelp: 'Paste an HTTP(S) image URL or upload a PNG, JPEG, or WebP up to 256 KB. The image is saved in your database.', posterRemove: 'Remove poster', posterReading: 'Reading image…', posterUploaded: 'Uploaded image', posterInvalid: 'Use an HTTP(S) image URL or upload a PNG, JPEG, or WebP.', posterTooLarge: 'Choose an image no larger than 256 KB.', posterReadError: 'Could not read this image. Please choose it again.',
    entry: 'Library entry', editMovie: 'Edit movie', addMovie: 'Add a movie', close: 'Close form', title: 'Title', releaseYear: 'Release year', runtime: 'Runtime (minutes)', director: 'Director', genre: 'Genre', genreExample: 'e.g. Science Fiction', language: 'Language', rating: 'Personal rating', filePath: 'File path', notes: 'Notes', optional: 'optional', watched: 'Watched', watchedHelp: 'Mark this title as completed', cancel: 'Cancel', saving: 'Saving…', saveChanges: 'Save changes', addToLibrary: 'Add to library',
    titleRequired: 'Enter a title.', yearRange: 'Use a year from 1888 to 2100.', directorRequired: 'Enter a director.', genreRequired: 'Enter a genre.', runtimeRange: 'Use 1–1000 minutes.', languageRequired: 'Enter a language.', pathRequired: 'Enter where the movie is stored.', ratingRange: 'Use a rating from 0 to 10.'
  },
  zh: {
    poster: '海报', posterUrl: '海报网址', posterUpload: '上传海报图片', posterHelp: '填写 HTTP(S) 图片网址，或上传不超过 256 KB 的 PNG、JPEG 或 WebP 图片。图片会保存到你的数据库中。', posterRemove: '移除海报', posterReading: '正在读取图片…', posterUploaded: '已上传图片', posterInvalid: '请填写 HTTP(S) 图片网址，或上传 PNG、JPEG 或 WebP 图片。', posterTooLarge: '请选择不超过 256 KB 的图片。', posterReadError: '无法读取图片，请重新选择。',
    entry: '片库条目', editMovie: '编辑电影', addMovie: '添加电影', close: '关闭表单', title: '片名', releaseYear: '上映年份', runtime: '时长（分钟）', director: '导演', genre: '类型', genreExample: '例如：科幻', language: '语言', rating: '个人评分', filePath: '文件路径', notes: '笔记', optional: '选填', watched: '已观看', watchedHelp: '将这部电影标记为已完成', cancel: '取消', saving: '正在保存…', saveChanges: '保存修改', addToLibrary: '加入片库',
    titleRequired: '请输入片名。', yearRange: '年份必须在 1888 到 2100 之间。', directorRequired: '请输入导演。', genreRequired: '请输入类型。', runtimeRange: '时长必须在 1 到 1000 分钟之间。', languageRequired: '请输入语言。', pathRequired: '请输入电影存储位置。', ratingRange: '评分必须在 0 到 10 之间。'
  }
}

export default function MovieForm({ language = 'en', movie, saving, serverErrors, onClose, onSave }) {
  const copy = COPY[language]
  const initial = useMemo(() => movie ? { ...movie, personalRating: movie.personalRating ?? '' } : emptyMovie, [movie])
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [readingPoster, setReadingPoster] = useState(false)
  const posterRead = useRef(0)

  useEffect(() => setValues(initial), [initial])
  useEffect(() => () => { posterRead.current += 1 }, [])

  function setPoster(value) {
    posterRead.current += 1
    setReadingPoster(false)
    setValues((current) => ({ ...current, posterUrl: value }))
    setErrors((current) => ({ ...current, posterUrl: undefined }))
  }

  async function uploadPoster(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const attempt = ++posterRead.current
    setReadingPoster(false)
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrors((current) => ({ ...current, posterUrl: copy.posterInvalid }))
      return
    }
    if (file.size > MAX_POSTER_FILE_SIZE) {
      setErrors((current) => ({ ...current, posterUrl: copy.posterTooLarge }))
      return
    }
    setReadingPoster(true)
    try {
      const image = await readPosterFile(file)
      if (attempt === posterRead.current) setPoster(image)
    } catch {
      if (attempt === posterRead.current) setErrors((current) => ({ ...current, posterUrl: copy.posterReadError }))
    } finally {
      if (attempt === posterRead.current) setReadingPoster(false)
    }
  }

  function update(event) {
    const { name, value, type, checked } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  function validate() {
    const next = {}
    if (!values.title.trim()) next.title = copy.titleRequired
    if (Number(values.releaseYear) < 1888 || Number(values.releaseYear) > 2100) next.releaseYear = copy.yearRange
    if (!values.director.trim()) next.director = copy.directorRequired
    if (!values.genre.trim()) next.genre = copy.genreRequired
    if (Number(values.runtimeMinutes) < 1 || Number(values.runtimeMinutes) > 1000) next.runtimeMinutes = copy.runtimeRange
    if (!values.language.trim()) next.language = copy.languageRequired
    if (!values.filePath.trim()) next.filePath = copy.pathRequired
    if (values.personalRating !== '' && (Number(values.personalRating) < 0 || Number(values.personalRating) > 10)) next.personalRating = copy.ratingRange
    if (!isValidPoster(values.posterUrl?.trim())) next.posterUrl = copy.posterInvalid
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function submit(event) {
    event.preventDefault()
    if (readingPoster || !validate()) return
    onSave({
      ...values,
      releaseYear: Number(values.releaseYear),
      runtimeMinutes: Number(values.runtimeMinutes),
      personalRating: values.personalRating === '' ? null : Number(values.personalRating),
      notes: values.notes?.trim() || null,
      posterUrl: values.posterUrl?.trim() || null,
    })
  }

  const fieldError = (name) => errors[name] || serverErrors?.[name]

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="movie-modal" role="dialog" aria-modal="true" aria-labelledby="movie-form-title">
        <header className="modal-header">
          <div>
            <span className="eyebrow">{copy.entry}</span>
            <h2 id="movie-form-title">{movie ? copy.editMovie : copy.addMovie}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={copy.close}><X size={19} /></button>
        </header>

        <form onSubmit={submit} className="movie-form">
          <label className="field field-wide">
            <span>{copy.title}</span>
            <input name="title" value={values.title} onChange={update} maxLength="200" autoFocus />
            {fieldError('title') && <small>{fieldError('title')}</small>}
          </label>

          <label className="field">
            <span>{copy.releaseYear}</span>
            <input name="releaseYear" type="number" min="1888" max="2100" value={values.releaseYear} onChange={update} />
            {fieldError('releaseYear') && <small>{fieldError('releaseYear')}</small>}
          </label>

          <label className="field">
            <span>{copy.runtime}</span>
            <input name="runtimeMinutes" type="number" min="1" max="1000" value={values.runtimeMinutes} onChange={update} />
            {fieldError('runtimeMinutes') && <small>{fieldError('runtimeMinutes')}</small>}
          </label>

          <label className="field">
            <span>{copy.director}</span>
            <input name="director" value={values.director} onChange={update} maxLength="150" />
            {fieldError('director') && <small>{fieldError('director')}</small>}
          </label>

          <label className="field">
            <span>{copy.genre}</span>
            <input name="genre" value={values.genre} onChange={update} maxLength="100" placeholder={copy.genreExample} />
            {fieldError('genre') && <small>{fieldError('genre')}</small>}
          </label>

          <label className="field">
            <span>{copy.language}</span>
            <input name="language" value={values.language} onChange={update} maxLength="100" />
            {fieldError('language') && <small>{fieldError('language')}</small>}
          </label>

          <label className="field">
            <span>{copy.rating}</span>
            <input name="personalRating" type="number" min="0" max="10" step="0.1" value={values.personalRating} onChange={update} placeholder="0–10" />
            {fieldError('personalRating') && <small>{fieldError('personalRating')}</small>}
          </label>

          <label className="field field-wide">
            <span>{copy.filePath}</span>
            <input name="filePath" value={values.filePath} onChange={update} maxLength="1000" placeholder="/Volumes/Movies/title.mkv" />
            {fieldError('filePath') && <small>{fieldError('filePath')}</small>}
          </label>

          <label className="field field-wide">
            <span>{copy.notes} <em>{copy.optional}</em></span>
            <textarea name="notes" value={values.notes ?? ''} onChange={update} maxLength="2000" rows="3" />
            {fieldError('notes') && <small>{fieldError('notes')}</small>}
          </label>

          <fieldset className="poster-field field-wide">
            <legend>{copy.poster} <em>{copy.optional}</em></legend>
            <div className="poster-input-layout">
              <MoviePoster movie={values} eager />
              <div className="poster-input-controls">
                <label className="field"><span>{copy.posterUrl}</span><input name="posterUrl" value={values.posterUrl?.startsWith('data:') ? '' : values.posterUrl ?? ''} onChange={(event) => setPoster(event.target.value)} placeholder="https://example.com/poster.jpg" maxLength={2048} /></label>
                <label className="field poster-upload"><span>{copy.posterUpload}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadPoster} /></label>
                <p>{copy.posterHelp}</p>
                {values.posterUrl?.startsWith('data:') && <span>{copy.posterUploaded}</span>}
                {readingPoster && <span role="status">{copy.posterReading}</span>}
                {(values.posterUrl || readingPoster) && <button className="button button-quiet" type="button" onClick={() => setPoster('')}>{copy.posterRemove}</button>}
              </div>
            </div>
            {fieldError('posterUrl') && <small role="alert">{fieldError('posterUrl')}</small>}
          </fieldset>

          <label className="watch-check field-wide">
            <input name="watched" type="checkbox" checked={values.watched} onChange={update} />
            <span className="check-box"><Check size={14} /></span>
            <span><strong>{copy.watched}</strong><small>{copy.watchedHelp}</small></span>
          </label>

          <footer className="modal-actions field-wide">
            <button className="button button-quiet" type="button" onClick={onClose}>{copy.cancel}</button>
            <button className="button button-primary" type="submit" disabled={saving || readingPoster}>{saving ? copy.saving : movie ? copy.saveChanges : copy.addToLibrary}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
