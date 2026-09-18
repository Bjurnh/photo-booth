/**
 * Races a promise against a timeout. If the promise doesn't settle within
 * `ms`, rejects with a synthetic { name: 'TimeoutError' } object (shaped
 * like a DOMException) so existing error-categorization code can handle
 * it the same way as a real getUserMedia error.
 *
 * This exists because some external UVC devices have been observed to
 * make getUserMedia() (or video.play()) hang indefinitely on iPadOS
 * Safari instead of resolving or rejecting - without a timeout, that
 * leaves the app stuck on a loading state with no way to recover short
 * of a full reload.
 */
export function withTimeout(promise, ms, label = 'operation') {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject({ name: 'TimeoutError', message: `${label} timed out after ${ms}ms` })
    }, ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
