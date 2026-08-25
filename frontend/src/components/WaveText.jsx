export default function WaveText({ text }) {
  return (
    <span className="wave-text" aria-label={text}>
      {Array.from(text).map((character, index) => (
        <span
          className="wave-character"
          style={{ '--wave-index': index }}
          aria-hidden="true"
          key={`${character}-${index}`}
        >
          {character === ' ' ? '\u00A0' : character}
        </span>
      ))}
    </span>
  )
}
