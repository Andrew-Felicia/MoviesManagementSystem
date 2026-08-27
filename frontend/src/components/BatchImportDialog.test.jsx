import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import BatchImportDialog from './BatchImportDialog'
import { moviesToCsv } from '../utils/movieCsv'

const movie = { title: 'Arrival', releaseYear: 2016, director: 'Denis Villeneuve', genre: 'Science Fiction', runtimeMinutes: 116, language: 'English', watched: true, personalRating: 9.2, filePath: '/movies/arrival.mkv', notes: null }

describe('BatchImportDialog', () => {
  it('parses a selected CSV and submits all movies', async () => {
    const onImport = vi.fn()
    render(<BatchImportDialog busy={false} error="" onClose={vi.fn()} onImport={onImport} onDownloadTemplate={vi.fn()} />)
    const file = new File([moviesToCsv([movie])], 'library.csv', { type: 'text/csv' })

    await userEvent.upload(screen.getByLabelText('Choose CSV file'), file)
    expect(await screen.findByText('1 movie ready to import')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Import 1 movie' }))

    expect(onImport).toHaveBeenCalledWith([movie])
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
    render(<BatchImportDialog language="zh" busy error="" onClose={onClose} onImport={vi.fn()} onDownloadTemplate={onDownloadTemplate} />)

    await userEvent.click(screen.getByRole('button', { name: '下载 CSV 模板' }))
    await userEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onDownloadTemplate).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: '正在导入…' })).toBeDisabled()
  })
})
