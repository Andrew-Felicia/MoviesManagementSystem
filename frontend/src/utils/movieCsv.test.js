import { describe, expect, it } from 'vitest'
import { MOVIE_CSV_HEADERS, moviesToCsv, parseMoviesCsv } from './movieCsv'

const movie = {
  title: 'Paris, Texas', releaseYear: 1984, director: 'Wim Wenders', genre: 'Drama',
  runtimeMinutes: 145, language: 'English', watched: true, personalRating: 9.4,
  filePath: '/movies/paris-texas.mkv', notes: 'Quiet, "beautiful" film.\nWatch again.',
}

describe('movie CSV utilities', () => {
  it('exports all supported fields with RFC-style escaping and a UTF-8 marker', () => {
    const csv = moviesToCsv([movie])

    expect(csv.startsWith(`\uFEFF${MOVIE_CSV_HEADERS.join(',')}`)).toBe(true)
    expect(csv).toContain('"Paris, Texas"')
    expect(csv).toContain('"Quiet, ""beautiful"" film.\nWatch again."')
  })

  it('round-trips exported movies and preserves blank optional fields', () => {
    const second = { ...movie, title: 'Arrival', watched: false, personalRating: null, notes: null }

    expect(parseMoviesCsv(moviesToCsv([movie, second]))).toEqual([movie, second])
  })

  it('accepts reordered columns, CRLF lines, and common boolean values', () => {
    const csv = '\uFEFFwatched,title,releaseYear,director,genre,runtimeMinutes,language,personalRating,filePath,notes\r\n' +
      'yes,Arrival,2016,Denis Villeneuve,Science Fiction,116,English,,/movies/arrival.mkv,\r\n'

    expect(parseMoviesCsv(csv)[0]).toMatchObject({ title: 'Arrival', watched: true, personalRating: null })
  })

  it('rejects missing columns, empty files, malformed quotes, and too many rows', () => {
    expect(() => parseMoviesCsv('')).toThrow('header and at least one movie')
    expect(() => parseMoviesCsv('title,releaseYear\nArrival,2016')).toThrow('Missing CSV columns')
    expect(() => parseMoviesCsv(`${MOVIE_CSV_HEADERS.join(',')}\n"unfinished`)).toThrow('unfinished quoted value')

    const row = 'Movie,2000,Director,Drama,90,English,false,,/movie.mkv,'
    expect(() => parseMoviesCsv(`${MOVIE_CSV_HEADERS.join(',')}\n${Array(5001).fill(row).join('\n')}`)).toThrow('cannot exceed 5000')
  })

  it('reports the source row for invalid numbers, ratings, and watched values', () => {
    const row = (year, runtime, watched, rating = '') => `Movie,${year},Director,Drama,${runtime},English,${watched},${rating},/movie.mkv,`
    const header = MOVIE_CSV_HEADERS.join(',')

    expect(() => parseMoviesCsv(`${header}\n${row('year', 90, false)}`)).toThrow('Row 2: releaseYear')
    expect(() => parseMoviesCsv(`${header}\n${row(2000, 'long', false)}`)).toThrow('Row 2: runtimeMinutes')
    expect(() => parseMoviesCsv(`${header}\n${row(2000, 90, 'maybe')}`)).toThrow('Row 2: watched')
    expect(() => parseMoviesCsv(`${header}\n${row(2000, 90, false, 'great')}`)).toThrow('Row 2: personalRating')
  })

  it('accepts numeric boolean values', () => {
    const header = MOVIE_CSV_HEADERS.join(',')
    const base = 'Movie,2000,Director,Drama,90,English'
    expect(parseMoviesCsv(`${header}\n${base},1,,/one.mkv,`)[0].watched).toBe(true)
    expect(parseMoviesCsv(`${header}\n${base},0,,/zero.mkv,`)[0].watched).toBe(false)
    expect(parseMoviesCsv(`${header}\n${base},no,,/no.mkv,`)[0].watched).toBe(false)
  })
})
