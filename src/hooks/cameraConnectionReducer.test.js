import { describe, it, expect } from 'vitest'
import { cameraConnectionReducer, initialCameraState, CAMERA_STATES } from './cameraConnectionReducer'

describe('cameraConnectionReducer', () => {
  it('goes from idle to connecting to ready on a normal successful start', () => {
    let state = initialCameraState
    state = cameraConnectionReducer(state, { type: 'CONNECT_START' })
    expect(state.status).toBe(CAMERA_STATES.CONNECTING)
    state = cameraConnectionReducer(state, { type: 'CONNECT_SUCCESS' })
    expect(state.status).toBe(CAMERA_STATES.READY)
    expect(state.error).toBeNull()
  })

  it('goes to error state with the error attached on a failed start', () => {
    let state = initialCameraState
    state = cameraConnectionReducer(state, { type: 'CONNECT_START' })
    const error = { code: 'CAMERA_PERMISSION' }
    state = cameraConnectionReducer(state, { type: 'CONNECT_FAILURE', error })
    expect(state.status).toBe(CAMERA_STATES.ERROR)
    expect(state.error).toBe(error)
  })

  it('transitions ready -> disconnected on DEVICE_LOST (camera unplugged mid-session)', () => {
    let state = { status: CAMERA_STATES.READY, error: null }
    state = cameraConnectionReducer(state, { type: 'DEVICE_LOST', error: { code: 'CAMERA_DISCONNECTED' } })
    expect(state.status).toBe(CAMERA_STATES.DISCONNECTED)
  })

  it('ignores DEVICE_LOST if not currently ready (e.g. duplicate track-ended events)', () => {
    let state = { status: CAMERA_STATES.CONNECTING, error: null }
    const next = cameraConnectionReducer(state, { type: 'DEVICE_LOST', error: {} })
    expect(next).toBe(state) // unchanged
  })

  it('full reconnect cycle: disconnected -> reconnecting -> ready', () => {
    let state = { status: CAMERA_STATES.DISCONNECTED, error: { code: 'CAMERA_DISCONNECTED' } }
    state = cameraConnectionReducer(state, { type: 'RECONNECT_ATTEMPT' })
    expect(state.status).toBe(CAMERA_STATES.RECONNECTING)
    state = cameraConnectionReducer(state, { type: 'CONNECT_SUCCESS' })
    expect(state.status).toBe(CAMERA_STATES.READY)
  })

  it('failed reconnect goes to error (not back to disconnected), surfacing a Retry rather than looping', () => {
    let state = { status: CAMERA_STATES.DISCONNECTED, error: null }
    state = cameraConnectionReducer(state, { type: 'RECONNECT_ATTEMPT' })
    state = cameraConnectionReducer(state, { type: 'CONNECT_FAILURE', error: { code: 'CAMERA_UNAVAILABLE' } })
    expect(state.status).toBe(CAMERA_STATES.ERROR)
  })

  it('ignores a duplicate RECONNECT_ATTEMPT while already reconnecting - the key guard against an infinite reconnect loop', () => {
    let state = { status: CAMERA_STATES.DISCONNECTED, error: null }
    state = cameraConnectionReducer(state, { type: 'RECONNECT_ATTEMPT' })
    expect(state.status).toBe(CAMERA_STATES.RECONNECTING)

    // A second reconnect attempt fired (e.g. duplicate button tap or a
    // second devicechange event) while one is already in flight.
    const next = cameraConnectionReducer(state, { type: 'RECONNECT_ATTEMPT' })
    expect(next).toBe(state) // no-op, not a new attempt
  })

  it('ignores a stale CONNECT_SUCCESS/CONNECT_FAILURE that does not match an in-flight attempt', () => {
    const readyState = { status: CAMERA_STATES.READY, error: null }
    const afterSuccess = cameraConnectionReducer(readyState, { type: 'CONNECT_SUCCESS' })
    expect(afterSuccess).toBe(readyState) // already ready, ignore stray success

    const afterFailure = cameraConnectionReducer(readyState, { type: 'CONNECT_FAILURE', error: {} })
    expect(afterFailure).toBe(readyState) // already ready, ignore stray failure
  })
})
