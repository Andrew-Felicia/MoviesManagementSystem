import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import BatchImportDialog from './BatchImportDialog'
import { moviesToCsv } from '../utils/movieCsv'

const movie = { title: 'Arrival', releaseYear: 2016, director: 'Denis Villeneuve', genre: 'Science Fiction', runtimeMinutes: 116, language: 'English', watched: true, personalRating: 9.2, filePath: '/movies/arrival.mkv', notes: null, synopsis: null, castMembers: null, imdbUrl: null, trailerUrl: null }

describe('BatchImportDialog', () => {
  it('parses a selected CSV and submits all movies', async () => {
    const onImport = vi.fn()
    render(<BatchImportDialog busy={false} error="" onClose={vi.fn()} onImport={onImport} onDownloadTemplate={vi.fn()} />)
    const withPoster = { ...movie, posterUrl: 'https://example.com/arrival.jpg' }
    const file = new File([moviesToCsv([withPoster])], 'library.csv', { type: 'text/csv' })

    await userEvent.upload(screen.getByLabelText('Choose CSV file'), file)
    expect(await screen.findByText('1 movie ready to import')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Import 1 movie' }))

    expect(onImport).toHaveBeenCalledWith([withPoster])
  })

  it('shows malformed file and backend errors without importing', async () => {
    const onImport = vi.fn()
    render(<BatchImportDialog busy={false} error="Server rejected batch" onClose={vi.fn()} onImport={onImport} onDownloadTemplate={vi.fn()} />)
    const file = new File(['title\nArrival'], 'broken.csv', { type: 'text/csv' })

    await userEvent.upload(screen.getByLabelText('Choose CSV file'), file)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read this CSV')
    expect(screen.getByRole('button', { name: 'Import 0 movies' })).toBeDisabled()
    expect(onImport).not.toHaveBeenCalled()
  })

  it('supports Chinese labels, template download, closing, and busy state', async () => {
    const onClose = vi.fn()
    const onDownloadTemplate = vi.fn()
    const { rerender } = render(<BatchImportDialog language="zh" busy error="" onClose={onClose} onImport={vi.fn()} onDownloadTemplate={onDownloadTemplate} />)

    await userEvent.click(screen.getByRole('button', { name: '下载 CSV 模板' }))
    expect(screen.getByRole('button', { name: '取消' })).toBeDisabled()
    expect(onDownloadTemplate).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: '正在导入…' })).toBeDisabled()
    rerender(<BatchImportDialog language="zh" busy={false} error="" onClose={onClose} onImport={vi.fn()} onDownloadTemplate={onDownloadTemplate} />)
    await userEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows real upload percentages and an indeterminate saving stage in both languages', () => {
    const props = { busy: true, error: '', onClose: vi.fn(), onImport: vi.fn(), onDownloadTemplate: vi.fn() }
    const { rerender } = render(<BatchImportDialog {...props} progress={{ stage: 'uploading', percent: 42 }} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '42')
    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.getByLabelText('Choose CSV file')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Close batch import' })).toBeDisabled()
    rerender(<BatchImportDialog {...props} language="zh" progress={{ stage: 'saving' }} />)
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('value')
    expect(screen.getByText('上传完成，正在保存电影和海报…')).toBeInTheDocument()
    rerender(<BatchImportDialog {...props} busy={false} error="Download failed" />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close batch import' })).toBeEnabled()
  })

  it('reports file reading progress and recovers from a read error', async () => {
    let reader
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function () { reader = this })
    render(<BatchImportDialog busy={false} error="" onClose={vi.fn()} onImport={vi.fn()} onDownloadTemplate={vi.fn()} />)
    await userEvent.upload(screen.getByLabelText('Choose CSV file'), new File(['test'], 'movies.csv', { type: 'text/csv' }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0')
    act(() => reader.onprogress({ lengthComputable: true, loaded: 3, total: 4 }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '75')
    act(() => reader.onprogress({ lengthComputable: false }))
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('value')
    await act(async () => reader.onerror())
    expect(screen.getByRole('alert')).toHaveTextContent('Could not read this CSV')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('accepts files above the previous 5 MB limit and rejects files above 100 MB', async () => {
    render(<BatchImportDialog busy={false} error="" onClose={vi.fn()} onImport={vi.fn()} onDownloadTemplate={vi.fn()} />)
    const file = new File([moviesToCsv([movie])], 'movies.csv', { type: 'text/csv' })
    Object.defineProperty(file, 'size', { value: 21 * 1024 * 1024 })
    await userEvent.upload(screen.getByLabelText('Choose CSV file'), file)
    expect(await screen.findByText('1 movie ready to import')).toBeInTheDocument()
    const oversized = new File(['test'], 'large.csv', { type: 'text/csv' })
    Object.defineProperty(oversized, 'size', { value: 100 * 1024 * 1024 + 1 })
    await userEvent.upload(screen.getByLabelText('Choose CSV file'), oversized)
    expect(screen.getByRole('alert')).toHaveTextContent('must not exceed 100 MB')
  })
})
