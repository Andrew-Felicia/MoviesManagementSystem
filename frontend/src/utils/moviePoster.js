export const MAX_POSTER_FILE_SIZE = 256 * 1024
export const MAX_POSTER_LENGTH = 350000

export function isValidPoster(value) {
  return !value || (value.length <= MAX_POSTER_LENGTH && /^(?:https?:\/\/[^\s]+|data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2})$/i.test(value))
}

export function readPosterFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}
