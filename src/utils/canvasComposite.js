import { createCaptureError, CAPTURE_ERROR_CODES } from './errors'
import { validateLayout } from '../layouts/layoutDefinitions'
import { computeFitRect } from './imageFit'

/**
 * Composites a captured photo canvas with a CSS filter and an optional
 * transparent template PNG overlay, returning a new canvas.
 *
 * Throws a categorized capture error (see errors.js) rather than a bare
 * Error/DOMException, so callers can show a safe user-facing message.
 */
export function compositeImage({ sourceCanvas, filterCss, templateImage }) {
  if (!sourceCanvas || !sourceCanvas.width || !sourceCanvas.height) {
    throw createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'compositeImage received an invalid sourceCanvas')
  }

  let canvas
  let ctx
  try {
    canvas = document.createElement('canvas')
    canvas.width = sourceCanvas.width
    canvas.height = sourceCanvas.height
    ctx = canvas.getContext('2d')
  } catch (err) {
    throw createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'could not create composite canvas/context', err)
  }
  if (!ctx) {
    throw createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'composite getContext returned null')
  }

  try {
    ctx.filter = filterCss && filterCss !== 'none' ? filterCss : 'none'
    ctx.drawImage(sourceCanvas, 0, 0)
    ctx.filter = 'none'

    if (templateImage) {
      // Stretch the template to fill the frame; templates should be authored
      // at the same aspect ratio as the capture for best results.
      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height)
    }
  } catch (err) {
    throw createCaptureError(CAPTURE_ERROR_CODES.IMAGE_PROCESSING_ERROR, 'drawImage failed during composite', err)
  }

  return canvas
}

/** Loads a File (from an <input type="file">) into an HTMLImageElement. */
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = reject
    img.src = url
  })
}

/**
 * Draws a source canvas through a CSS filter onto a new canvas. Kept
 * separate from composeLayout() - filters are a per-captured-photo
 * concern, not layout geometry, per the capture/layout/composition
 * separation.
 */
export function applyCssFilter(sourceCanvas, filterCss) {
  if (!sourceCanvas || !sourceCanvas.width || !sourceCanvas.height) {
    throw createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'applyCssFilter received an invalid sourceCanvas')
  }
  if (!filterCss || filterCss === 'none') return sourceCanvas

  let canvas
  let ctx
  try {
    canvas = document.createElement('canvas')
    canvas.width = sourceCanvas.width
    canvas.height = sourceCanvas.height
    ctx = canvas.getContext('2d')
  } catch (err) {
    throw createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'could not create filter canvas/context', err)
  }
  if (!ctx) {
    throw createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'filter canvas getContext returned null')
  }

  try {
    ctx.filter = filterCss
    ctx.drawImage(sourceCanvas, 0, 0)
    ctx.filter = 'none'
  } catch (err) {
    throw createCaptureError(CAPTURE_ERROR_CODES.IMAGE_PROCESSING_ERROR, 'drawImage failed while applying filter', err)
  }

  return canvas
}

/**
 * Composes one or more captured images into a layout's slots, with an
 * optional template drawn on top (matching the existing template
 * behavior - full-canvas overlay, unrelated to slot geometry).
 *
 * `images` must have exactly one entry per layout slot, in slot order.
 * Each entry is anything drawImage accepts (HTMLCanvasElement, HTMLImageElement).
 *
 * This is additive - the original single-image compositeImage() above is
 * unchanged and still works for any existing caller.
 */
export function composeLayout({ layout, images, templateImage }) {
  const { valid, errors } = validateLayout(layout)
  if (!valid) {
    throw createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, `invalid layout: ${errors.join('; ')}`)
  }
  if (!Array.isArray(images) || images.length !== layout.slots.length) {
    throw createCaptureError(
      CAPTURE_ERROR_CODES.CANVAS_ERROR,
      `expected ${layout.slots.length} image(s) for layout "${layout.id}", got ${images?.length ?? 0}`
    )
  }

  let canvas
  let ctx
  try {
    canvas = document.createElement('canvas')
    canvas.width = layout.width
    canvas.height = layout.height
    ctx = canvas.getContext('2d')
  } catch (err) {
    throw createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'could not create layout canvas/context', err)
  }
  if (!ctx) {
    throw createCaptureError(CAPTURE_ERROR_CODES.CANVAS_ERROR, 'layout canvas getContext returned null')
  }

  try {
    // Background
    ctx.fillStyle = layout.background || '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Each slot
    layout.slots.forEach((slot, i) => {
      const image = images[i]
      const sourceWidth = image.videoWidth || image.naturalWidth || image.width
      const sourceHeight = image.videoHeight || image.naturalHeight || image.height
      const rect = computeFitRect({
        sourceWidth,
        sourceHeight,
        destWidth: slot.width,
        destHeight: slot.height,
        fit: slot.fit || 'cover',
      })
      if (!rect) return // slot skipped if the source image has no readable dimensions

      ctx.save()
      if (slot.rotation) {
        const cx = slot.x + slot.width / 2
        const cy = slot.y + slot.height / 2
        ctx.translate(cx, cy)
        ctx.rotate((slot.rotation * Math.PI) / 180)
        ctx.translate(-cx, -cy)
      }
      ctx.drawImage(
        image,
        rect.sx,
        rect.sy,
        rect.sw,
        rect.sh,
        slot.x + rect.dx,
        slot.y + rect.dy,
        rect.dw,
        rect.dh
      )
      ctx.restore()
    })

    // Template overlay on top, matching existing template behavior -
    // stretched to fill the full canvas. Templates are visual design
    // (frame/background art), separate from layout geometry (slots).
    if (templateImage) {
      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height)
    }
  } catch (err) {
    throw createCaptureError(CAPTURE_ERROR_CODES.IMAGE_PROCESSING_ERROR, 'drawImage failed during layout composition', err)
  }

  return canvas
}
