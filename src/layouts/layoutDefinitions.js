/**
 * A layout is pure data describing the geometry of a photo booth output:
 * canvas size, and one or more photo "slots" (position, size, fit,
 * rotation). Layouts do NOT know about the camera, capture flow, or
 * templates - see canvasComposite.js for how a layout + captured images
 * + an optional template are turned into a final image.
 *
 * All dimensions are in pixels at a consistent 300dpi-equivalent scale,
 * matching common photo-print sizes (e.g. 1200x1800 = 4x6in).
 */

/**
 * Validates a layout definition. Returns { valid, errors }. Never throws -
 * callers (composeLayout, tests) decide what to do with an invalid layout.
 */
export function validateLayout(layout) {
  const errors = []

  if (!layout || typeof layout !== 'object') {
    return { valid: false, errors: ['layout is not an object'] }
  }
  if (!layout.id || typeof layout.id !== 'string') {
    errors.push('layout.id must be a non-empty string')
  }
  if (!Number.isFinite(layout.width) || layout.width <= 0) {
    errors.push('layout.width must be a positive number')
  }
  if (!Number.isFinite(layout.height) || layout.height <= 0) {
    errors.push('layout.height must be a positive number')
  }
  if (!Array.isArray(layout.slots) || layout.slots.length === 0) {
    errors.push('layout.slots must be a non-empty array')
  } else {
    layout.slots.forEach((slot, i) => {
      if (!Number.isFinite(slot.x) || slot.x < 0) errors.push(`slot ${i}: x must be >= 0`)
      if (!Number.isFinite(slot.y) || slot.y < 0) errors.push(`slot ${i}: y must be >= 0`)
      if (!Number.isFinite(slot.width) || slot.width <= 0) errors.push(`slot ${i}: width must be positive`)
      if (!Number.isFinite(slot.height) || slot.height <= 0) errors.push(`slot ${i}: height must be positive`)
      if (Number.isFinite(layout.width) && Number.isFinite(slot.x) && Number.isFinite(slot.width)) {
        if (slot.x + slot.width > layout.width) errors.push(`slot ${i}: extends past canvas width`)
      }
      if (Number.isFinite(layout.height) && Number.isFinite(slot.y) && Number.isFinite(slot.height)) {
        if (slot.y + slot.height > layout.height) errors.push(`slot ${i}: extends past canvas height`)
      }
    })
  }

  return { valid: errors.length === 0, errors }
}

// --- Initial layouts -------------------------------------------------

const SINGLE_PHOTO = {
  id: 'single',
  name: 'Single Photo',
  width: 1200,
  height: 1800,
  background: '#ffffff',
  slots: [{ x: 0, y: 0, width: 1200, height: 1800, fit: 'cover', rotation: 0 }],
}

const STRIP_2X6 = {
  id: 'strip-2x6',
  name: '2x6 Photo Strip',
  width: 600,
  height: 1800,
  background: '#ffffff',
  slots: [
    { x: 30, y: 40, width: 540, height: 415, fit: 'cover', rotation: 0 },
    { x: 30, y: 475, width: 540, height: 415, fit: 'cover', rotation: 0 },
    { x: 30, y: 910, width: 540, height: 415, fit: 'cover', rotation: 0 },
    { x: 30, y: 1345, width: 540, height: 415, fit: 'cover', rotation: 0 },
  ],
}

const GRID_2X2 = {
  id: 'grid-2x2',
  name: '2x2 Grid',
  width: 1200,
  height: 1800,
  background: '#ffffff',
  slots: [
    { x: 40, y: 40, width: 550, height: 850, fit: 'cover', rotation: 0 },
    { x: 610, y: 40, width: 550, height: 850, fit: 'cover', rotation: 0 },
    { x: 40, y: 910, width: 550, height: 850, fit: 'cover', rotation: 0 },
    { x: 610, y: 910, width: 550, height: 850, fit: 'cover', rotation: 0 },
  ],
}

const VERTICAL_3 = {
  id: 'vertical-3',
  name: 'Vertical 3-Photo',
  width: 1200,
  height: 1800,
  background: '#ffffff',
  slots: [
    { x: 40, y: 40, width: 1120, height: 560, fit: 'cover', rotation: 0 },
    { x: 40, y: 620, width: 1120, height: 560, fit: 'cover', rotation: 0 },
    { x: 40, y: 1200, width: 1120, height: 560, fit: 'cover', rotation: 0 },
  ],
}

export const LAYOUTS = [SINGLE_PHOTO, STRIP_2X6, GRID_2X2, VERTICAL_3]

export function getLayoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || SINGLE_PHOTO
}
