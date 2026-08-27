import { useState } from 'react'
import { FileDown, FileSpreadsheet, Upload, X } from 'lucide-react'
import { MOVIE_CSV_HEADERS, parseMoviesCsv } from '../utils/movieCsv'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const COPY = {
  en: {
    close: 'Close batch import', eyebrow: 'Bulk library tools', title: 'Import movies from CSV', intro: 'Choose a UTF-8 CSV file. Every valid movie is imported together, and duplicate entries are skipped.', choose: 'Choose CSV file', replace: 'Choose another file', limit: 'CSV only · up to 5 MB · maximum 5,000 movies', ready: (count) => `${count} ${count === 1 ? 'movie' : 'movies'} ready to import`, columns: 'Required columns', template: 'Download CSV template', cancel: 'Cancel', importing: 'Importing…', import: (count) => `Import ${count} ${count === 1 ? 'movie' : 'movies'}`, tooLarge: 'The CSV file must not exceed 5 MB.', readError: (message) => `Could not read this CSV: ${message}`,
  },
  zh: {
    close: '关闭批量导入', eyebrow: '片库批量工具', title: '从 CSV 导入电影', intro: '请选择 UTF-8 CSV 文件。所有有效电影会一次性导入，重复记录将自动跳过。', choose: '选择 CSV 文件', replace: '选择其他文件', limit: '仅支持 CSV · 最大 5 MB · 最多 5,000 部电影', ready: (count) => `已有 ${count} 部电影可以导入`, columns: '必需字段', template: '下载 CSV 模板', cancel: '取消', importing: '正在导入…', import: (count) => `导入 ${count} 部电影`, tooLarge: 'CSV 文件不能超过 5 MB。', readError: (message) => `无法读取该 CSV：${message}`,
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('The browser could not read the selected file.'))
    reader.readAsText(file)
  })
}

export default function BatchImportDialog({ language = 'en', busy, error, onClose, onImport, onDownloadTemplate }) {
  const copy = COPY[language]
  const [fileName, setFileName] = useState('')
  const [movies, setMovies] = useState([])
  const [parseError, setParseError] = useState('')

  async function chooseFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setMovies([])
    setParseError('')
    if (file.size > MAX_FILE_SIZE) {
      setParseError(copy.tooLarge)
      return
    }

    try {
      setMovies(parseMoviesCsv(await readFile(file)))
    } catch (readError) {
      setParseError(copy.readError(readError.message))
    }
  }

  function submit(event) {
    event.preventDefault()
    if (movies.length) onImport(movies)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="batch-dialog" role="dialog" aria-modal="true" aria-labelledby="batch-dialog-title">
        <button className="login-close" type="button" onClick={onClose} aria-label={copy.close}><X size={18} /></button>
        <div className="login-lock"><Upload size={22} /></div>
        <span className="eyebrow">{copy.eyebrow}</span>
        <h2 id="batch-dialog-title">{copy.title}</h2>
        <p>{copy.intro}</p>

        <form onSubmit={submit}>
          <label className={`batch-dropzone ${movies.length ? 'has-file' : ''}`}>
            <input type="file" accept=".csv,text/csv" aria-label={copy.choose} onChange={chooseFile} />
            <FileSpreadsheet size={28} />
            <strong>{fileName || copy.choose}</strong>
            <span>{fileName ? copy.replace : copy.limit}</span>
          </label>

          {movies.length > 0 && <div className="batch-ready"><strong>{copy.ready(movies.length)}</strong><span>{movies.slice(0, 3).map((movie) => movie.title).join(' · ')}{movies.length > 3 ? ' …' : ''}</span></div>}
          {(parseError || error) && <div className="login-error" role="alert">{parseError || error}</div>}

          <div className="batch-columns"><strong>{copy.columns}</strong><code>{MOVIE_CSV_HEADERS.join(', ')}</code></div>
          <button className="batch-template" type="button" onClick={onDownloadTemplate}><FileDown size={15} />{copy.template}</button>

          <footer className="modal-actions">
            <button className="button button-quiet" type="button" onClick={onClose}>{copy.cancel}</button>
            <button className="button button-primary" type="submit" disabled={busy || movies.length === 0}>{busy ? copy.importing : copy.import(movies.length)}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
