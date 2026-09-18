/**
 * Categorized error codes for the capture pipeline. Keeping these as a
 * fixed set (rather than raw error strings) lets the UI show a safe,
 * consistent message while logs/dev tools still get the technical detail.
 */
export const CAPTURE_ERROR_CODES = {
  CAMERA_PERMISSION: 'CAMERA_PERMISSION',
  CAMERA_UNAVAILABLE: 'CAMERA_UNAVAILABLE',
  CAMERA_DISCONNECTED: 'CAMERA_DISCONNECTED',
  INVALID_VIDEO: 'INVALID_VIDEO',
  CANVAS_ERROR: 'CANVAS_ERROR',
  IMAGE_PROCESSING_ERROR: 'IMAGE_PROCESSING_ERROR',
  UNKNOWN_CAPTURE_ERROR: 'UNKNOWN_CAPTURE_ERROR',
}

const USER_MESSAGES = {
  [CAPTURE_ERROR_CODES.CAMERA_PERMISSION]: 'Camera access was denied. Please allow camera permission for this site.',
  [CAPTURE_ERROR_CODES.CAMERA_UNAVAILABLE]: "Couldn't reach the camera. It may be in use by another app or unplugged.",
  [CAPTURE_ERROR_CODES.CAMERA_DISCONNECTED]: 'The camera was disconnected. Reconnect it and try again.',
  [CAPTURE_ERROR_CODES.INVALID_VIDEO]: 'The camera feed isn\'t ready yet. Please wait a moment and try again.',
  [CAPTURE_ERROR_CODES.CANVAS_ERROR]: "Couldn't process that photo. Please try again.",
  [CAPTURE_ERROR_CODES.IMAGE_PROCESSING_ERROR]: "Something went wrong finishing that photo. Please try again.",
  [CAPTURE_ERROR_CODES.UNKNOWN_CAPTURE_ERROR]: 'Something unexpected happened. Please try again.',
}

/** Creates a consistent, categorized capture error object. */
export function createCaptureError(code, technicalMessage, cause) {
  return {
    code: CAPTURE_ERROR_CODES[code] ? code : CAPTURE_ERROR_CODES.UNKNOWN_CAPTURE_ERROR,
    technicalMessage: technicalMessage || null,
    cause: cause || null,
  }
}

/** Returns a safe, non-technical message for the booth UI. Never includes stack traces. */
export function getUserFacingMessage(captureError) {
  if (!captureError) return USER_MESSAGES[CAPTURE_ERROR_CODES.UNKNOWN_CAPTURE_ERROR]
  return USER_MESSAGES[captureError.code] || USER_MESSAGES[CAPTURE_ERROR_CODES.UNKNOWN_CAPTURE_ERROR]
}

/** Maps a raw getUserMedia DOMException/name into one of our categories. */
export function categorizeGetUserMediaError(err) {
  const name = err?.name || ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return createCaptureError(CAPTURE_ERROR_CODES.CAMERA_PERMISSION, err?.message, err)
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return createCaptureError(CAPTURE_ERROR_CODES.CAMERA_UNAVAILABLE, err?.message, err)
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return createCaptureError(CAPTURE_ERROR_CODES.CAMERA_UNAVAILABLE, err?.message, err)
  }
  if (name === 'TimeoutError') {
    // Synthetic - not a real DOMException name from getUserMedia itself,
    // used when the call hangs indefinitely instead of resolving/rejecting
    // (observed with some external UVC devices on iPadOS Safari).
    return createCaptureError(CAPTURE_ERROR_CODES.CAMERA_UNAVAILABLE, err?.message || 'camera start timed out', err)
  }
  return createCaptureError(CAPTURE_ERROR_CODES.UNKNOWN_CAPTURE_ERROR, err?.message, err)
}
