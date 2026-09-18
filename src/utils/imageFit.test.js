import { describe, it, expect } from 'vitest'
import { computeFitRect } from './imageFit'

describe('computeFitRect', () => {
  it('cover: crops a wider source to fill a narrower destination without distortion', () => {
    // 1600x900 (16:9) source into a 1000x1000 (1:1) destination
    const rect = computeFitRect({ sourceWidth: 1600, sourceHeight: 900, destWidth: 1000, destHeight: 1000, fit: 'cover' })
    expect(rect.dw).toBe(1000)
    expect(rect.dh).toBe(1000)
    // Source crop should be square (900x900), centered horizontally
    expect(rect.sh).toBe(900)
    expect(rect.sw).toBe(900)
    expect(rect.sx).toBeGreaterThan(0) // cropped off both sides, not stretched
  })

  it('cover: crops a taller source to fill a wider destination', () => {
    const rect = computeFitRect({ sourceWidth: 900, sourceHeight: 1600, destWidth: 1000, destHeight: 500, fit: 'cover' })
    expect(rect.dw).toBe(1000)
    expect(rect.dh).toBe(500)
    expect(rect.sy).toBeGreaterThan(0)
  })

  it('contain: letterboxes rather than cropping', () => {
    const rect = computeFitRect({ sourceWidth: 1600, sourceHeight: 900, destWidth: 1000, destHeight: 1000, fit: 'contain' })
    // Whole source used, no cropping
    expect(rect.sw).toBe(1600)
    expect(rect.sh).toBe(900)
    // Result centered and within destination bounds
    expect(rect.dw).toBeLessThanOrEqual(1000)
    expect(rect.dh).toBeLessThanOrEqual(1000)
  })

  it('never produces zero or negative destination dimensions for valid input', () => {
    const rect = computeFitRect({ sourceWidth: 640, sourceHeight: 480, destWidth: 200, destHeight: 800, fit: 'cover' })
    expect(rect.dw).toBeGreaterThan(0)
    expect(rect.dh).toBeGreaterThan(0)
    expect(rect.sw).toBeGreaterThan(0)
    expect(rect.sh).toBeGreaterThan(0)
  })

  it('returns null for missing/zero dimensions rather than producing NaN', () => {
    expect(computeFitRect({ sourceWidth: 0, sourceHeight: 100, destWidth: 100, destHeight: 100 })).toBeNull()
    expect(computeFitRect({ sourceWidth: 100, sourceHeight: 100, destWidth: 0, destHeight: 100 })).toBeNull()
  })

  it('defaults to cover when fit is unspecified', () => {
    const rect = computeFitRect({ sourceWidth: 1600, sourceHeight: 900, destWidth: 1000, destHeight: 1000 })
    expect(rect.dw).toBe(1000)
    expect(rect.dh).toBe(1000)
  })
})
