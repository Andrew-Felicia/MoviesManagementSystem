import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { Workbook } from '@oai/artifact-tool'

const root = new URL('./', import.meta.url)
const movies = JSON.parse(await fs.readFile(new URL('selected.json', root), 'utf8'))
for (const movie of movies) {
  const bytes = await fs.readFile(new URL(`posters/${movie.imdbId}.jpg`, root))
  assert(bytes.length <= 256 * 1024)
  movie.posterUrl = `data:image/jpeg;base64,${bytes.toString('base64')}`
}
const headers = ['title', 'releaseYear', 'director', 'genre', 'runtimeMinutes', 'language', 'watched', 'personalRating', 'filePath', 'notes', 'posterUrl', 'imdbId', 'imdbUrl', 'imdbRating', 'imdbVotes']
assert.equal(movies.length, 500)
assert.equal(new Set(movies.map(movie => movie.imdbId)).size, 500)
for (const movie of movies) {
  for (const [field, length] of Object.entries({ title: 200, director: 150, genre: 100, language: 100, filePath: 1000, notes: 2000, posterUrl: 350000 })) {
    assert(movie[field].length > 0 && movie[field].length <= length, `${movie.title}: ${field}`)
  }
  assert(movie.releaseYear >= 1888 && movie.releaseYear <= 2100)
  assert(movie.runtimeMinutes >= 1 && movie.runtimeMinutes <= 1000)
}

const workbook = Workbook.create()
const sheet = workbook.worksheets.add('Movies')
sheet.getRange('A1:O501').values = [headers, ...movies.map(movie => headers.map(header => movie[header]))]
sheet.getRange('A1:O501').format.font = { name: 'Arial', size: 10 }
sheet.getRange('A1:O1').format = { fill: '#173559', font: { bold: true, color: '#FFFFFF' }, rowHeight: 28 }
sheet.getRange('A2:O501').format.rowHeight = 25
sheet.getRange('A1:A501').format.columnWidth = 58
sheet.getRange('B1:B501').format.columnWidth = 15
sheet.getRange('C1:C501').format.columnWidth = 28
sheet.getRange('D1:D501').format.columnWidth = 30
sheet.getRange('E1:E501').format.columnWidth = 20
sheet.showGridLines = false
workbook.recalculate()
console.log((await workbook.inspect({ kind: 'table', range: 'Movies!A1:E4', tableMaxRows: 4, tableMaxCols: 5, maxChars: 1500 })).ndjson)
const preview = await workbook.render({ sheetName: 'Movies', range: 'A1:E7', scale: 1.5 })
await fs.writeFile(new URL('csv-preview.png', root), new Uint8Array(await preview.arrayBuffer()))

// The artifact runtime has no documented CSV exporter. Serialize its authored
// cell matrix as UTF-8 RFC 4180 CSV, retaining the app's import header names.
const escapeCell = value => /[",\r\n]/.test(String(value ?? '')) ? `"${String(value).replaceAll('"', '""')}"` : String(value ?? '')
const csv = '\uFEFF' + sheet.getRange('A1:O501').values.map(row => row.map(escapeCell).join(',')).join('\r\n') + '\r\n'
assert(Buffer.byteLength(csv) < 100 * 1024 * 1024)
await fs.writeFile(new URL('imdb-500-with-posters.csv', root), csv)
console.log(`Created 500 movies; ${Buffer.byteLength(csv)} bytes; every poster embedded as image data.`)
