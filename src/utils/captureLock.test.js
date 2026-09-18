import { describe, it, expect } from 'vitest'
import { createCaptureLock } from './captureLock'

describe('createCaptureLock', () => {
  it('allows the first acquire and blocks a second while still locked', () => {
    const lock = createCaptureLock()
    expect(lock.acquire()).toBe(true)
    expect(lock.isLocked()).toBe(true)
    // Simulates a rapid double-tap / duplicate event while a capture is in flight.
    expect(lock.acquire()).toBe(false)
  })

  it('allows acquiring again after release', () => {
    const lock = createCaptureLock()
    lock.acquire()
    lock.release()
    expect(lock.isLocked()).toBe(false)
    expect(lock.acquire()).toBe(true)
  })

  it('release is safe to call even when not locked', () => {
    const lock = createCaptureLock()
    expect(() => lock.release()).not.toThrow()
    expect(lock.isLocked()).toBe(false)
  })

  it('simulates a full capture cycle including a failure, and confirms the lock is always released', async () => {
    const lock = createCaptureLock()
    expect(lock.acquire()).toBe(true)
    try {
      throw new Error('capture failed')
    } catch {
      // real call sites release in a finally block - verify that pattern
    } finally {
      lock.release()
    }
    expect(lock.isLocked()).toBe(false)
    expect(lock.acquire()).toBe(true)
  })
})
