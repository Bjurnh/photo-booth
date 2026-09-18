import { describe, it, expect } from 'vitest'
import { withTimeout } from './withTimeout'

describe('withTimeout', () => {
  it('resolves normally when the promise settles before the timeout', async () => {
    const fast = new Promise((resolve) => setTimeout(() => resolve('done'), 10))
    const result = await withTimeout(fast, 200, 'test-op')
    expect(result).toBe('done')
  })

  it('rejects with a TimeoutError when the promise never settles in time', async () => {
    const hangs = new Promise(() => {}) // never resolves/rejects - simulates the real bug
    let caught = null
    try {
      await withTimeout(hangs, 20, 'test-op')
    } catch (err) {
      caught = err
    }
    expect(caught).not.toBeNull()
    expect(caught.name).toBe('TimeoutError')
    expect(caught.message).toContain('test-op')
  })

  it('propagates the original rejection if the promise rejects before the timeout', async () => {
    const fails = new Promise((_, reject) => setTimeout(() => reject(new Error('real failure')), 10))
    let caught = null
    try {
      await withTimeout(fails, 200, 'test-op')
    } catch (err) {
      caught = err
    }
    expect(caught.message).toBe('real failure')
  })
})
