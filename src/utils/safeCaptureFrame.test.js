import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { safeCaptureFrame } from './safeCaptureFrame'
import { CAPTURE_ERROR_CODES } from './errors'

function makeFakeCanvas({ ctx = makeFakeCtx() } = {}) {
  return {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
  }
}

function makeFakeCtx({ throwOnDrawImage = false } = {}) {
  return {
    translate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(() => {
      if (throwOnDrawImage) throw new Error('drawImage boom')
    }),
  }
}

describe('safeCaptureFrame', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => makeFakeCanvas()),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns an INVALID_VIDEO error when video is null (never touches canvas methods)', () => {
    const result = safeCaptureFrame(null, false)
    expect(result.canvas).toBeNull()
    expect(result.error.code).toBe(CAPTURE_ERROR_CODES.INVALID_VIDEO)
  })

  it('returns an INVALID_VIDEO error when the video is not ready (low readyState)', () => {
    const video = { readyState: 0, videoWidth: 1280, videoHeight: 960 }
    const result = safeCaptureFrame(video, false)
    expect(result.canvas).toBeNull()
    expect(result.error.code).toBe(CAPTURE_ERROR_CODES.INVALID_VIDEO)
  })

  it('returns an INVALID_VIDEO error when dimensions are 0 (e.g. stream not actually flowing)', () => {
    const video = { readyState: 4, videoWidth: 0, videoHeight: 0 }
    const result = safeCaptureFrame(video, false)
    expect(result.canvas).toBeNull()
    expect(result.error.code).toBe(CAPTURE_ERROR_CODES.INVALID_VIDEO)
  })

  it('returns a CANVAS_ERROR when getContext returns null', () => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => makeFakeCanvas({ ctx: null })),
    })
    const video = { readyState: 4, videoWidth: 1280, videoHeight: 960 }
    const result = safeCaptureFrame(video, false)
    expect(result.canvas).toBeNull()
    expect(result.error.code).toBe(CAPTURE_ERROR_CODES.CANVAS_ERROR)
  })

  it('returns a CANVAS_ERROR when drawImage throws mid-capture', () => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => makeFakeCanvas({ ctx: makeFakeCtx({ throwOnDrawImage: true }) })),
    })
    const video = { readyState: 4, videoWidth: 1280, videoHeight: 960 }
    const result = safeCaptureFrame(video, false)
    expect(result.canvas).toBeNull()
    expect(result.error.code).toBe(CAPTURE_ERROR_CODES.CANVAS_ERROR)
  })

  it('succeeds and returns a canvas with no error for a valid, ready video', () => {
    const video = { readyState: 4, videoWidth: 1280, videoHeight: 960 }
    const result = safeCaptureFrame(video, false)
    expect(result.error).toBeNull()
    expect(result.canvas).not.toBeNull()
    expect(result.canvas.width).toBe(1280)
    expect(result.canvas.height).toBe(960)
  })

  it('applies mirror transform only when mirror=true', () => {
    const ctx = makeFakeCtx()
    vi.stubGlobal('document', { createElement: vi.fn(() => makeFakeCanvas({ ctx })) })
    const video = { readyState: 4, videoWidth: 1280, videoHeight: 960 }

    safeCaptureFrame(video, true)
    expect(ctx.translate).toHaveBeenCalled()
    expect(ctx.scale).toHaveBeenCalled()
  })
})
