/**
 * Minimal structured logging - intentionally not a full logging framework
 * per project scope. Logs to console with a consistent shape so an
 * operator can filter the browser console during an event, or so logs
 * could later be piped somewhere else without changing call sites.
 *
 * Never pass image data, base64 strings, or other large/sensitive
 * payloads into `data` - this module actively strips known-risky keys
 * as a safety net, but callers should not rely on that.
 */

const REDACTED_KEYS = ['image', 'dataUrl', 'data_url', 'base64', 'password', 'token']

function redact(data) {
  if (!data || typeof data !== 'object') return data
  const clean = {}
  for (const [key, value] of Object.entries(data)) {
    if (REDACTED_KEYS.some((k) => key.toLowerCase().includes(k))) {
      clean[key] = '[redacted]'
    } else {
      clean[key] = value
    }
  }
  return clean
}

function logEvent(level, event, data) {
  const entry = {
    ts: new Date().toISOString(),
    event,
    ...redact(data),
  }
  const line = `[photobooth] ${event}`
  if (level === 'error') {
    console.error(line, entry)
  } else if (level === 'warn') {
    console.warn(line, entry)
  } else {
    console.log(line, entry)
  }
}

export const logger = {
  info: (event, data) => logEvent('info', event, data),
  warn: (event, data) => logEvent('warn', event, data),
  error: (event, data) => logEvent('error', event, data),
}
