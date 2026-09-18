import { describe, it, expect, vi, afterEach } from 'vitest'
import { compositeImage, composeLayout } from './canvasComposite'
import { CAPTURE_ERROR_CODES } from './errors'

function makeFakeCanvas(ctx) {
  return { width: 0, height: 0, getContext: vi.fn(() => ctx) }
}

function makeFakeCtx({ throwOnDrawImage = false } = {}) {
  return {
    set filter(_v) {},
    get filter() {
      return 'none'
    },
    fillStyle: '#fff',
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(() => {
      if (throwOnDrawImage) throw new Error('drawImage boom')
    }),
  }
}

describe('compositeImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws a CANVAS_ERROR (not a bare exception) for a null sourceCanvas, and never calls document', () => {
    const createElement = vi.fn()
    vi.stubGlobal('document', { createElement })
    let caught = null
    try {
      compositeImage({ sourceCanvas: null, filterCss: 'none', templateImage: null })
    } catch (err) {
      caught = err
    }
    expect(caught).not.toBeNull()
    expect(caught.code).toBe(CAPTURE_ERROR_CODES.CANVAS_ERROR)
    expect(createElement).not.toHaveBeenCalled()
  })

  it('throws a CANVAS_ERROR for a sourceCanvas with zero dimensions', () => {
    vi.stubGlobal('document', { createElement: vi.fn(() => makeFakeCanvas(makeFakeCtx())) })
    let caught = null
    try {
      compositeImage({ sourceCanvas: { width: 0, height: 0 }, filterCss: 'none', templateImage: null })
    } catch (err) {
      caught = err
    }
    expect(caught.code).toBe(CAPTURE_ERROR_CODES.CANVAS_ERROR)
  })

  it('throws IMAGE_PROCESSING_ERROR when drawImage fails partway through', () => {
    vi.stubGlobal('document', { createElement: vi.fn(() => makeFakeCanvas(makeFakeCtx({ throwOnDrawImage: true }))) })
    const sourceCanvas = { width: 800, height: 600 }
    let caught = null
    try {
      compositeImage({ sourceCanvas, filterCss: 'none', templateImage: null })
    } catch (err) {
      caught = err
    }
    expect(caught.code).toBe(CAPTURE_ERROR_CODES.IMAGE_PROCESSING_ERROR)
  })

  it('succeeds for a valid sourceCanvas with no template', () => {
    vi.stubGlobal('document', { createElement: vi.fn(() => makeFakeCanvas(makeFakeCtx())) })
    const sourceCanvas = { width: 800, height: 600 }
    const result = compositeImage({ sourceCanvas, filterCss: 'none', templateImage: null })
    expect(result.width).toBe(800)
    expect(result.height).toBe(600)
  })

  it('draws the template image on top when one is provided', () => {
    const ctx = makeFakeCtx()
    vi.stubGlobal('document', { createElement: vi.fn(() => makeFakeCanvas(ctx)) })
    const sourceCanvas = { width: 800, height: 600 }
    const templateImage = {}
    compositeImage({ sourceCanvas, filterCss: 'none', templateImage })
    // Called once for the source photo, once for the template overlay.
    expect(ctx.drawImage).toHaveBeenCalledTimes(2)
  })
})

describe('composeLayout', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const singleLayout = {
    id: 'single',
    width: 400,
    height: 600,
    background: '#fff',
    slots: [{ x: 0, y: 0, width: 400, height: 600, fit: 'cover' }],
  }

  const twoSlotLayout = {
    id: 'two',
    width: 400,
    height: 600,
    background: '#fff',
    slots: [
      { x: 0, y: 0, width: 400, height: 300, fit: 'cover' },
      { x: 0, y: 300, width: 400, height: 300, fit: 'cover' },
    ],
  }

  function makeFakeImage(w = 800, h = 600) {
    return { width: w, height: h, naturalWidth: w, naturalHeight: h }
  }

  it('rejects an invalid layout definition rather than producing corrupted output', () => {
    vi.stubGlobal('document', { createElement: vi.fn(() => makeFakeCanvas(makeFakeCtx())) })
    let caught = null
    try {
      composeLayout({ layout: { id: 'bad', width: 0, height: 0, slots: [] }, images: [], templateImage: null })
    } catch (err) {
      caught = err
    }
    expect(caught).not.toBeNull()
    expect(caught.code).toBe(CAPTURE_ERROR_CODES.CANVAS_ERROR)
  })

  it('rejects when the images array length does not match the slot count', () => {
    vi.stubGlobal('document', { createElement: vi.fn(() => makeFakeCanvas(makeFakeCtx())) })
    let caught = null
    try {
      composeLayout({ layout: twoSlotLayout, images: [makeFakeImage()], templateImage: null })
    } catch (err) {
      caught = err
    }
    expect(caught).not.toBeNull()
    expect(caught.code).toBe(CAPTURE_ERROR_CODES.CANVAS_ERROR)
  })

  it('composes a single-slot layout successfully (equivalent to the existing single-photo flow)', () => {
    vi.stubGlobal('document', { createElement: vi.fn(() => makeFakeCanvas(makeFakeCtx())) })
    const result = composeLayout({ layout: singleLayout, images: [makeFakeImage()], templateImage: null })
    expect(result.width).toBe(400)
    expect(result.height).toBe(600)
  })

  it('composes a multi-slot layout, drawing once per slot plus the template overlay', () => {
    const ctx = makeFakeCtx()
    vi.stubGlobal('document', { createElement: vi.fn(() => makeFakeCanvas(ctx)) })
    composeLayout({
      layout: twoSlotLayout,
      images: [makeFakeImage(), makeFakeImage()],
      templateImage: makeFakeImage(),
    })
    // 2 slots + 1 template overlay = 3 drawImage calls
    expect(ctx.drawImage).toHaveBeenCalledTimes(3)
  })

  it('throws IMAGE_PROCESSING_ERROR when a slot draw fails partway through', () => {
    vi.stubGlobal('document', { createElement: vi.fn(() => makeFakeCanvas(makeFakeCtx({ throwOnDrawImage: true }))) })
    let caught = null
    try {
      composeLayout({ layout: singleLayout, images: [makeFakeImage()], templateImage: null })
    } catch (err) {
      caught = err
    }
    expect(caught.code).toBe(CAPTURE_ERROR_CODES.IMAGE_PROCESSING_ERROR)
  })
})
