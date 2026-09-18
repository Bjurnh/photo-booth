/**
 * Computes the source-crop and destination-placement rectangles for
 * drawing an image/canvas into a slot, without distorting it.
 *
 * 'cover'   - crops the source (centered) to fill the destination exactly,
 *             matching CSS object-fit: cover. This is the default for
 *             photo booth slots - a 4:3 camera image dropped into a
 *             portrait slot gets cropped, never stretched.
 * 'contain' - scales the whole source to fit within the destination,
 *             letterboxing rather than cropping.
 *
 * Returns the 9 arguments needed for
 * ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh).
 */
export function computeFitRect({ sourceWidth, sourceHeight, destWidth, destHeight, fit = 'cover' }) {
  if (!sourceWidth || !sourceHeight || !destWidth || !destHeight) {
    return null
  }

  const sourceAspect = sourceWidth / sourceHeight
  const destAspect = destWidth / destHeight

  if (fit === 'contain') {
    let dw = destWidth
    let dh = destWidth / sourceAspect
    if (dh > destHeight) {
      dh = destHeight
      dw = destHeight * sourceAspect
    }
    return {
      sx: 0,
      sy: 0,
      sw: sourceWidth,
      sh: sourceHeight,
      dx: (destWidth - dw) / 2,
      dy: (destHeight - dh) / 2,
      dw,
      dh,
    }
  }

  // 'cover' (default)
  let sw, sh, sx, sy
  if (sourceAspect > destAspect) {
    sh = sourceHeight
    sw = sourceHeight * destAspect
    sy = 0
    sx = (sourceWidth - sw) / 2
  } else {
    sw = sourceWidth
    sh = sourceWidth / destAspect
    sx = 0
    sy = (sourceHeight - sh) / 2
  }
  return { sx, sy, sw, sh, dx: 0, dy: 0, dw: destWidth, dh: destHeight }
}
