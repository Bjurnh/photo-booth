import { describe, it, expect } from 'vitest'
import { LAYOUTS, getLayoutById, validateLayout } from './layoutDefinitions'

describe('LAYOUTS (built-in layout set)', () => {
  it('every layout has a valid, unique, non-empty id', () => {
    const ids = LAYOUTS.map((l) => l.id)
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every layout has valid positive dimensions', () => {
    for (const layout of LAYOUTS) {
      expect(layout.width).toBeGreaterThan(0)
      expect(layout.height).toBeGreaterThan(0)
    }
  })

  it('every slot has valid coordinates and positive size', () => {
    for (const layout of LAYOUTS) {
      for (const slot of layout.slots) {
        expect(slot.x).toBeGreaterThanOrEqual(0)
        expect(slot.y).toBeGreaterThanOrEqual(0)
        expect(slot.width).toBeGreaterThan(0)
        expect(slot.height).toBeGreaterThan(0)
      }
    }
  })

  it('every slot stays within canvas bounds', () => {
    for (const layout of LAYOUTS) {
      for (const slot of layout.slots) {
        expect(slot.x + slot.width).toBeLessThanOrEqual(layout.width)
        expect(slot.y + slot.height).toBeLessThanOrEqual(layout.height)
      }
    }
  })

  it('has the expected slot count per layout', () => {
    const bySlotCount = Object.fromEntries(LAYOUTS.map((l) => [l.id, l.slots.length]))
    expect(bySlotCount['single']).toBe(1)
    expect(bySlotCount['strip-2x6']).toBe(4)
    expect(bySlotCount['grid-2x2']).toBe(4)
    expect(bySlotCount['vertical-3']).toBe(3)
  })

  it('every layout passes its own validation', () => {
    for (const layout of LAYOUTS) {
      const { valid, errors } = validateLayout(layout)
      expect(valid, `layout "${layout.id}" should be valid: ${errors.join(', ')}`).toBe(true)
    }
  })
})

describe('getLayoutById', () => {
  it('returns the matching layout', () => {
    expect(getLayoutById('grid-2x2').id).toBe('grid-2x2')
  })

  it('falls back to the single-photo layout for an unknown id', () => {
    expect(getLayoutById('does-not-exist').id).toBe('single')
    expect(getLayoutById(undefined).id).toBe('single')
  })
})

describe('validateLayout (rejecting invalid definitions)', () => {
  it('rejects a null/non-object layout', () => {
    expect(validateLayout(null).valid).toBe(false)
    expect(validateLayout(undefined).valid).toBe(false)
    expect(validateLayout('not a layout').valid).toBe(false)
  })

  it('rejects a layout missing an id', () => {
    const result = validateLayout({ width: 100, height: 100, slots: [{ x: 0, y: 0, width: 100, height: 100 }] })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('id'))).toBe(true)
  })

  it('rejects zero or negative dimensions', () => {
    expect(validateLayout({ id: 'x', width: 0, height: 100, slots: [] }).valid).toBe(false)
    expect(validateLayout({ id: 'x', width: 100, height: -5, slots: [] }).valid).toBe(false)
  })

  it('rejects an empty slots array', () => {
    const result = validateLayout({ id: 'x', width: 100, height: 100, slots: [] })
    expect(result.valid).toBe(false)
  })

  it('rejects a slot that extends past the canvas bounds', () => {
    const result = validateLayout({
      id: 'x',
      width: 100,
      height: 100,
      slots: [{ x: 50, y: 0, width: 80, height: 50 }], // 50+80=130 > 100
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('past canvas'))).toBe(true)
  })

  it('rejects a slot with zero/negative width or height', () => {
    const result = validateLayout({
      id: 'x',
      width: 100,
      height: 100,
      slots: [{ x: 0, y: 0, width: 0, height: 50 }],
    })
    expect(result.valid).toBe(false)
  })

  it('accepts a well-formed single-slot layout', () => {
    const result = validateLayout({
      id: 'ok',
      width: 100,
      height: 100,
      slots: [{ x: 0, y: 0, width: 100, height: 100 }],
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })
})
