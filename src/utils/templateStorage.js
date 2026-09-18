const STORAGE_KEY = 'photobooth.templates'

/** Reads saved templates (as {id, name, url, layoutId} with url being a data URL). */
export function loadStoredTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Persists templates. Expects [{id, name, url, layoutId}] where url is a data URL. */
export function saveStoredTemplates(templates) {
  try {
    const toStore = templates.map(({ id, name, url, layoutId }) => ({ id, name, url, layoutId: layoutId || null }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch {
    // Storage full or unavailable - templates just won't persist this session
  }
}

/** Converts a File into a data URL (rather than an object URL) so it can be persisted. */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Loads an HTMLImageElement from a data URL (for canvas compositing). */
export function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
