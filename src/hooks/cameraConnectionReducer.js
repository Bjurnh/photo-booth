/**
 * Pure state machine for camera connection status. Kept separate from
 * useCamera.js so the disconnect/reconnect transitions are unit-testable
 * without a real camera or DOM.
 *
 * States:
 *   idle          - not started yet
 *   connecting    - getUserMedia in flight (initial or after a device change)
 *   ready         - stream is live
 *   disconnected  - stream ended unexpectedly (track ended / device removed)
 *   reconnecting  - a manual reconnect attempt is in flight
 *   error         - permission/unavailable error, not a mid-session disconnect
 */
export const CAMERA_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  READY: 'ready',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
}

export const initialCameraState = {
  status: CAMERA_STATES.IDLE,
  error: null,
}

export function cameraConnectionReducer(state, action) {
  switch (action.type) {
    case 'CONNECT_START':
      // Allowed from any state - starting fresh (new deviceId, retry, etc).
      return { status: CAMERA_STATES.CONNECTING, error: null }

    case 'CONNECT_SUCCESS':
      if (state.status !== CAMERA_STATES.CONNECTING && state.status !== CAMERA_STATES.RECONNECTING) {
        return state // ignore stale success from a superseded attempt
      }
      return { status: CAMERA_STATES.READY, error: null }

    case 'CONNECT_FAILURE':
      if (state.status !== CAMERA_STATES.CONNECTING && state.status !== CAMERA_STATES.RECONNECTING) {
        return state
      }
      return { status: CAMERA_STATES.ERROR, error: action.error || null }

    case 'DEVICE_LOST':
      // Only a live stream can be "lost" - ignore if we weren't ready
      // (e.g. duplicate track-ended events firing).
      if (state.status !== CAMERA_STATES.READY) {
        return state
      }
      return { status: CAMERA_STATES.DISCONNECTED, error: action.error || null }

    case 'RECONNECT_ATTEMPT':
      // Guard against overlapping/duplicate reconnect attempts - this is
      // the check that prevents an infinite reconnect loop from firing
      // multiple concurrent getUserMedia calls.
      if (state.status !== CAMERA_STATES.DISCONNECTED) {
        return state
      }
      return { status: CAMERA_STATES.RECONNECTING, error: null }

    case 'RESET':
      return initialCameraState

    default:
      return state
  }
}
