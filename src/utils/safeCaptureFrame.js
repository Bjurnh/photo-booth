import { createCaptureError, CAPTURE_ERROR_CODES } from './errors'

/**
 * Validates a video element and grabs its current frame onto a canvas.
 * Never throws - always returns { canvas, error }, exactly one of which
 * is non-null. This is the single place capture-time validation happens,
 * so App.jsx and CameraCapture.jsx can rely on never touching a null
 * canvas.
 *
 * `mirror` should be true only for the built-in front-facing camera - an
 * external device (like a DJI in webcam mode) should not be flipped.
 */
export function safeCaptureFrame(video, mirror) {
  if (!video) {
    return { canvas: null, error: createCaptureError(CAPTURE_ERROR_CODES.INVALID_VIDEO, 'video element is null') }
  }

  // readyState >= 2 (HAVE_CURRENT_DATA) means there's an actual frame to draw.
  if (typeof video.readyState === 'number' && video.readyState < 2) {
    return {
      canvas: null,
      error: createCaptureError(CAPTURE_ERROR_CODES.INVALID_VIDEO, `video not ready (readyState=${video.readyState})`),
    }
  }

  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) {
    return {
      canvas: null,
      error: createCaptureError(CAPTURE_ERROR_CODES.INVALID_VIDEO, `invalid video dimensions (${width}x${height})`),
    }
  }

  let canvas
  try {
    canvas = document.createElement('canvas')
  } catch (err) {
    return { canvas: null, error: createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'could not create canvas', err) }
  }

  canvas.width = width
  canvas.height = height

  let ctx
  try {
    ctx = canvas.getContext('2d')
  } catch (err) {
    return { canvas: null, error: createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'getContext threw', err) }
  }
  if (!ctx) {
    return { canvas: null, error: createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'getContext returned null') }
  }

  try {
    if (mirror) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  } catch (err) {
    return { canvas: null, error: createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'drawImage threw', err) }
  }

  return { canvas, error: null }
}
