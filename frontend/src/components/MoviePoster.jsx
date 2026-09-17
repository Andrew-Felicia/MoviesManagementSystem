import { useState } from 'react'
import { isValidPoster } from '../utils/moviePoster'

export default function MoviePoster({ movie, eager = false }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const title = movie.title || ''
  const initials = title.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  const hue = (title.split('').reduce((total, char) => total + char.charCodeAt(0), 0) * 7) % 360
  const showImage = movie.posterUrl && isValidPoster(movie.posterUrl) && failedUrl !== movie.posterUrl
  return <div className={`poster-tile ${showImage ? 'has-image' : ''}`} style={{ '--poster-hue': hue }} aria-hidden="true">
    {showImage ? <img src={movie.posterUrl} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer" onError={() => setFailedUrl(movie.posterUrl)} /> : <span>{initials}</span>}
  </div>
}
