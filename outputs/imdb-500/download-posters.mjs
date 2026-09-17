import fs from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('./', import.meta.url)
const movies = JSON.parse(await fs.readFile(new URL('selected.json', root), 'utf8'))
await fs.mkdir(new URL('posters/', root), { recursive: true })
let next = 0
let completed = 0
const failures = []
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < movies.length) {
    const movie = movies[next++]
    const target = new URL(`posters/${movie.imdbId}.jpg`, root)
    let error
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        let bytes
        try { bytes = await fs.readFile(target) } catch {
          const response = await fetch(movie.posterUrl, { signal: AbortSignal.timeout(20000) })
          assert.equal(response.status, 200)
          bytes = Buffer.from(await response.arrayBuffer())
        }
        assert(bytes.length <= 256 * 1024 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255, `Invalid JPEG: ${movie.imdbId}`)
        await fs.writeFile(target, bytes)
        completed++
        if (completed % 50 === 0) console.log(`Downloaded ${completed}/500 posters`)
        error = null
        break
      } catch (failure) { error = failure }
    }
    if (error) failures.push({ imdbId: movie.imdbId, error: String(error) })
  }
}))
assert.equal(failures.length, 0, JSON.stringify(failures))
console.log(`Verified ${completed} local JPEG files.`)
