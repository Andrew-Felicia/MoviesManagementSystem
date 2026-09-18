import { useState } from 'react'
import { FileDown, FileSpreadsheet, Upload, X } from 'lucide-react'
import { REQUIRED_MOVIE_CSV_HEADERS, parseMoviesCsv } from '../utils/movieCsv'

const MAX_FILE_SIZE = 100 * 1024 * 1024

const COPY = {
  en: {
    reading: 'Reading CSV…', parsing: 'Checking movies and posters…', preparing: 'Preparing upload…', uploading: 'Uploading movies and posters…', saving: 'Upload complete. Saving movies and posters…', keepOpen: 'Keep this window open until the import finishes.',
    posterColumn: 'Optional: posterUrl', posterHelp: 'The optional posterUrl column accepts embedded PNG, JPEG, or WebP image data. Image URLs are downloaded and saved in your database on import. Exports include the images themselves.',
    close: 'Close batch import', eyebrow: 'Bulk library tools', title: 'Import movies from CSV', intro: 'Choose a UTF-8 CSV file. Every valid movie is imported together, and duplicate entries are skipped.', choose: 'Choose CSV file', replace: 'Choose another file', limit: 'CSV only · up to 100 MB · maximum 5,000 movies', ready: (count) => `${count} ${count === 1 ? 'movie' : 'movies'} ready to import`, columns: 'Required columns', template: 'Download CSV template', cancel: 'Cancel', importing: 'Importing…', import: (count) => `Import ${count} ${count === 1 ? 'movie' : 'movies'}`, tooLarge: 'The CSV file must not exceed 100 MB.', readError: (message) => `Could not read this CSV: ${message}`,
  },
  zh: {
    reading: '正在读取 CSV…', parsing: '正在检查电影和海报…', preparing: '正在准备上传…', uploading: '正在上传电影和海报…', saving: '上传完成，正在保存电影和海报…', keepOpen: '请保持此窗口打开，直到导入完成。',
    posterColumn: '选填：posterUrl', posterHelp: '选填 posterUrl 列可包含 PNG、JPEG 或 WebP 图片数据。导入图片网址时，系统会下载海报并存入数据库；导出的 CSV 包含图片本身。',
    close: '关闭批量导入', eyebrow: '片库批量工具', title: '从 CSV 导入电影', intro: '请选择 UTF-8 CSV 文件。所有有效电影会一次性导入，重复记录将自动跳过。', choose: '选择 CSV 文件', replace: '选择其他文件', limit: '仅支持 CSV · 最大 100 MB · 最多 5,000 部电影', ready: (count) => `已有 ${count} 部电影可以导入`, columns: '必需字段', template: '下载 CSV 模板', cancel: '取消', importing: '正在导入…', import: (count) => `导入 ${count} 部电影`, tooLarge: 'CSV 文件不能超过 100 MB。', readError: (message) => `无法读取该 CSV：${message}`,
  }
}

function readFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('The browser could not read the selected file.'))
    reader.onprogress = (event) => onProgress({ stage: 'reading', percent: event.lengthComputable ? Math.round(event.loaded / event.total * 100) : undefined })
    reader.readAsText(file)
  })
}

export default function BatchImportDialog({ language = 'en', busy, progress, error, onClose, onImport, onDownloadTemplate }) {
  const copy = COPY[language]
  const [fileName, setFileName] = useState('')
  const [movies, setMovies] = useState([])
  const [parseError, setParseError] = useState('')
  const [fileProgress, setFileProgress] = useState(null)
  const activeProgress = busy ? progress || { stage: 'preparing' } : fileProgress
  const locked = busy || Boolean(fileProgress)

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
      setFileProgress({ stage: 'reading', percent: 0 })
      const csv = await readFile(file, setFileProgress)
      setFileProgress({ stage: 'parsing' })
      // Let the browser paint the validation stage before parsing a large CSV.
      await new Promise((resolve) => setTimeout(resolve, 0))
      setMovies(parseMoviesCsv(csv))
    } catch (readError) {
      setParseError(copy.readError(readError.message))
    } finally {
      setFileProgress(null)
    }
  }

  function submit(event) {
    event.preventDefault()
    if (movies.length && !locked) onImport(movies)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="batch-dialog" role="dialog" aria-modal="true" aria-labelledby="batch-dialog-title">
        <button className="login-close" type="button" disabled={locked} onClick={onClose} aria-label={copy.close}><X size={18} /></button>
        <div className="login-lock"><Upload size={22} /></div>
        <span className="eyebrow">{copy.eyebrow}</span>
        <h2 id="batch-dialog-title">{copy.title}</h2>
        <p>{copy.intro}</p>

        <form onSubmit={submit}>
          <label className={`batch-dropzone ${movies.length ? 'has-file' : ''}`}>
            <input type="file" accept=".csv,text/csv" aria-label={copy.choose} disabled={locked} onChange={chooseFile} />
            <FileSpreadsheet size={28} />
            <strong>{fileName || copy.choose}</strong>
            <span>{fileName ? copy.replace : copy.limit}</span>
          </label>

          {movies.length > 0 && <div className="batch-ready"><strong>{copy.ready(movies.length)}</strong><span>{movies.slice(0, 3).map((movie) => movie.title).join(' · ')}{movies.length > 3 ? ' …' : ''}</span></div>}
          {(parseError || error) && <div className="login-error" role="alert">{parseError || error}</div>}

          {activeProgress && <div className="batch-progress" role="status" aria-live="polite">
            <div className="batch-progress-heading"><strong>{copy[activeProgress.stage]}</strong>{activeProgress.percent != null && <span>{activeProgress.percent}%</span>}</div>
            <progress max="100" value={activeProgress.percent} aria-label={copy[activeProgress.stage]} />
            <small>{copy.keepOpen}</small>
          </div>}

          <div className="batch-columns"><strong>{copy.columns}</strong><code>{REQUIRED_MOVIE_CSV_HEADERS.join(', ')}</code><strong>{copy.posterColumn}</strong><p>{copy.posterHelp}</p></div>
          <button className="batch-template" type="button" onClick={onDownloadTemplate}><FileDown size={15} />{copy.template}</button>

          <footer className="modal-actions">
            <button className="button button-quiet" type="button" disabled={locked} onClick={onClose}>{copy.cancel}</button>
            <button className="button button-primary" type="submit" disabled={locked || movies.length === 0}>{busy ? copy.importing : copy.import(movies.length)}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
