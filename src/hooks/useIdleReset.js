import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Resets the booth to Home after `timeoutMs` of no touch/click/keyboard
 * activity, so one guest walking away doesn't leave the booth stuck on
 * their photo for the next person. Shows a warning countdown for the
 * last `warnMs` so an engaged guest can dismiss it and keep going.
 */
export function useIdleReset({ enabled, timeoutMs = 45000, warnMs = 10000, onIdle }) {
  const [warning, setWarning] = useState(false)
  const idleTimer = useRef(null)
  const warnTimer = useRef(null)

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (warnTimer.current) clearTimeout(warnTimer.current)
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    setWarning(false)
    if (!enabled) return
    warnTimer.current = setTimeout(() => setWarning(true), timeoutMs - warnMs)
    idleTimer.current = setTimeout(() => {
      setWarning(false)
      onIdle()
    }, timeoutMs)
  }, [enabled, timeoutMs, warnMs, onIdle, clearTimers])

  useEffect(() => {
    if (!enabled) {
      clearTimers()
      setWarning(false)
      return
    }
    reset()
    const events = ['pointerdown', 'touchstart', 'keydown']
    events.forEach((ev) => window.addEventListener(ev, reset))
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, reset))
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return { warning, dismissWarning: reset }
}
