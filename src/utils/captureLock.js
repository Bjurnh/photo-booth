/**
 * A plain (non-React) lock for guarding "only one capture in flight at a
 * time." React state updates are batched/async, which is exactly the gap
 * that allowed a double capture (the shutter re-enabled while the previous
 * capture was still being processed). A plain mutable ref checked
 * synchronously closes that gap regardless of render timing.
 */
export function createCaptureLock() {
  let locked = false
  return {
    /** Returns true and locks if it was free; returns false if already locked. */
    acquire() {
      if (locked) return false
      locked = true
      return true
    },
    /** Always safe to call, including when not locked. */
    release() {
      locked = false
    },
    isLocked() {
      return locked
    },
  }
}
