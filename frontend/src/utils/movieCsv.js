export const MOVIE_CSV_HEADERS = [
  'title',
  'releaseYear',
  'director',
  'genre',
  'runtimeMinutes',
  'language',
  'watched',
  'personalRating',
  'filePath',
  'notes',
]

const MAX_BATCH_SIZE = 5000

function escapeCell(value) {
  if (value == null) return ''
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function moviesToCsv(movies) {
  const rows = movies.map((movie) => MOVIE_CSV_HEADERS
    .map((header) => escapeCell(movie[header]))
    .join(','))
  return `\uFEFF${MOVIE_CSV_HEADERS.join(',')}\r\n${rows.join('\r\n')}${rows.length ? '\r\n' : ''}`
}

function parseRows(csv) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]
    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
    } else if (character === '"' && field === '') {
      quoted = true
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field)
      if (row.some((cell) => cell.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else if (character !== '\r') {
      field += character
    }
  }

  if (quoted) throw new Error('The CSV contains an unfinished quoted value.')
  row.push(field)
  if (row.some((cell) => cell.trim() !== '')) rows.push(row)
  return rows
}

function parseInteger(value, field, rowNumber) {
  const clean = value.trim()
  if (!/^-?\d+$/.test(clean)) throw new Error(`Row ${rowNumber}: ${field} must be a whole number.`)
  return Number(clean)
}

function parseBoolean(value, rowNumber) {
  const clean = value.trim().toLowerCase()
  if (['true', 'yes', '1'].includes(clean)) return true
  if (['false', 'no', '0'].includes(clean)) return false
  throw new Error(`Row ${rowNumber}: watched must be true or false.`)
}

export function parseMoviesCsv(csv) {
  const rows = parseRows(csv.replace(/^\uFEFF/, ''))
  if (rows.length < 2) throw new Error('The CSV must contain a header and at least one movie.')

  const header = rows[0].map((cell) => cell.trim())
  const missing = MOVIE_CSV_HEADERS.filter((name) => !header.includes(name))
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(', ')}`)

  const dataRows = rows.slice(1)
  if (dataRows.length > MAX_BATCH_SIZE) throw new Error(`A CSV import cannot exceed ${MAX_BATCH_SIZE} movies.`)

  return dataRows.map((cells, index) => {
    const rowNumber = index + 2
    const value = (name) => cells[header.indexOf(name)] ?? ''
    const rating = value('personalRating').trim()
    if (rating !== '' && Number.isNaN(Number(rating))) {
      throw new Error(`Row ${rowNumber}: personalRating must be a number or blank.`)
    }

    return {
      title: value('title').trim(),
      releaseYear: parseInteger(value('releaseYear'), 'releaseYear', rowNumber),
      director: value('director').trim(),
      genre: value('genre').trim(),
      runtimeMinutes: parseInteger(value('runtimeMinutes'), 'runtimeMinutes', rowNumber),
      language: value('language').trim(),
      watched: parseBoolean(value('watched'), rowNumber),
      personalRating: rating === '' ? null : Number(rating),
      filePath: value('filePath').trim(),
      notes: value('notes').trim() || null,
    }
  })
}
