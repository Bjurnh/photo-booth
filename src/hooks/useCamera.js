import { useEffect, useRef, useState, useCallback, useReducer } from 'react'
import { cameraConnectionReducer, initialCameraState, CAMERA_STATES } from './cameraConnectionReducer'
import { categorizeGetUserMediaError } from '../utils/errors'
import { safeCaptureFrame } from '../utils/safeCaptureFrame'
import { logger } from '../utils/logger'
import { withTimeout } from '../utils/withTimeout'

const CAMERA_START_TIMEOUT_MS = 10000

/**
 * Starts a device camera into a <video> ref and exposes a way to
 * grab a still frame as an HTMLCanvasElement. Pass `deviceId` to target
 * a specific camera (e.g. a DJI unit in USB webcam mode) instead of the
 * browser's default.
 *
 * Tracks connection state via a small reducer (see cameraConnectionReducer.js)
 * so mid-session disconnects (camera unplugged, track ended) are detected
 * and exposed distinctly from an initial permission/availability error.
 */
export function useCamera(deviceId) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const mountedRef = useRef(true)
  const latestRequestRef = useRef(0)
  const [state, dispatch] = useReducer(cameraConnectionReducer, initialCameraState)
  const [devices, setDevices] = useState([])

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      setDevices(all.filter((d) => d.kind === 'videoinput'))
      return all
    } catch (err) {
      // Device list is a nice-to-have for the picker UI, not required to
      // capture, so a failure here doesn't block anything - just log it.
      logger.warn('device_list_failed', { message: err?.message })
      return null
    }
  }, [])

  function cleanupStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.onended = null
        t.stop()
      })
      streamRef.current = null
    }
  }

  const attemptConnect = useCallback(
    async ({ isReconnect } = {}) => {
      const requestId = ++latestRequestRef.current
      dispatch({ type: isReconnect ? 'RECONNECT_ATTEMPT' : 'CONNECT_START' })
      logger.info(isReconnect ? 'camera_reconnect_attempt' : 'camera_initialized', { deviceId: deviceId || 'default' })

      cleanupStream()

      const videoConstraint = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }

      // Declared outside the try block so the catch branch can still
      // attach late-arrival cleanup if this specific call times out.
      const rawGetUserMedia = navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: false })

      try {
        const stream = await withTimeout(rawGetUserMedia, CAMERA_START_TIMEOUT_MS, 'getUserMedia')

        // If a newer attempt (device switch, retry, reconnect) started
        // after this one, or the component unmounted while we were
        // awaiting permission, this result is stale - discard it instead
        // of overwriting a newer/valid stream or updating a dead component.
        if (!mountedRef.current || requestId !== latestRequestRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await withTimeout(videoRef.current.play(), CAMERA_START_TIMEOUT_MS, 'video.play()')
        }

        if (!mountedRef.current || requestId !== latestRequestRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          streamRef.current = null
          return
        }

        // Detect the camera being physically disconnected / stream dying
        // mid-session. This is per-track so it fires even if only one
        // track of a multi-track stream ends.
        stream.getTracks().forEach((track) => {
          track.onended = () => {
            // Ignore if this stream has already been superseded by a
            // newer one (e.g. user switched device right as this ended).
            if (streamRef.current !== stream || !mountedRef.current) return
            logger.warn('camera_disconnected', { deviceId: deviceId || 'default' })
            dispatch({ type: 'DEVICE_LOST', error: categorizeGetUserMediaError({ name: 'NotReadableError', message: 'track ended' }) })
          }
        })

        dispatch({ type: 'CONNECT_SUCCESS' })
        logger.info(isReconnect ? 'camera_reconnected' : 'camera_connected', { deviceId: deviceId || 'default' })
        refreshDevices()
      } catch (err) {
        if (err?.name === 'TimeoutError') {
          // We're giving up on this attempt now, but the real getUserMedia
          // call is still out there and might resolve later. If it does,
          // stop it immediately rather than leaving an orphaned camera
          // lock running in the background.
          rawGetUserMedia
            .then((lateStream) => lateStream.getTracks().forEach((t) => t.stop()))
            .catch(() => {})
        }
        if (!mountedRef.current || requestId !== latestRequestRef.current) return
        const categorized = categorizeGetUserMediaError(err)
        dispatch({ type: 'CONNECT_FAILURE', error: categorized })
        logger.error('capture_failed', { stage: 'camera_start', code: categorized.code, message: categorized.technicalMessage })
      }
    },
    [deviceId, refreshDevices]
  )

  // Initial connect + reconnect whenever the target device changes.
  useEffect(() => {
    mountedRef.current = true
    attemptConnect({ isReconnect: false })
    return () => {
      mountedRef.current = false
      cleanupStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  // Detect a currently-selected external device disappearing from the
  // device list (covers cases where the track's own 'ended' event doesn't
  // fire promptly). Event-driven only - no polling/timers, so this can't
  // spin into a reconnect loop on its own.
  useEffect(() => {
    async function handleDeviceChange() {
      const all = await refreshDevices()
      if (!all) return
      if (deviceId && state.status === CAMERA_STATES.READY) {
        const stillPresent = all.some((d) => d.deviceId === deviceId)
        if (!stillPresent) {
          logger.warn('camera_disconnected', { deviceId, reason: 'device_list' })
          dispatch({ type: 'DEVICE_LOST', error: categorizeGetUserMediaError({ name: 'NotFoundError', message: 'device removed' }) })
        }
      }
    }
    navigator.mediaDevices.addEventListener?.('devicechange', handleDeviceChange)
    return () => {
      navigator.mediaDevices.removeEventListener?.('devicechange', handleDeviceChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, state.status])

  /** Manual retry from a permission/availability error (not a mid-session disconnect). */
  const retry = useCallback(() => {
    attemptConnect({ isReconnect: false })
  }, [attemptConnect])

  /** Manual reconnect after a mid-session disconnect. One attempt per call - no auto-loop. */
  const reconnect = useCallback(() => {
    if (state.status !== CAMERA_STATES.DISCONNECTED) return
    attemptConnect({ isReconnect: true })
  }, [attemptConnect, state.status])

  /**
   * Grabs the current video frame onto a canvas. Delegates all validation
   * to safeCaptureFrame - never throws, always returns { canvas, error }.
   * `mirror` should be true only for the built-in front-facing camera.
   */
  function captureFrame(mirror = !deviceId) {
    logger.info('capture_started', { deviceId: deviceId || 'default' })
    const result = safeCaptureFrame(videoRef.current, mirror)
    if (result.error) {
      logger.error('capture_failed', { stage: 'frame_grab', code: result.error.code, message: result.error.technicalMessage })
    } else {
      logger.info('capture_completed', { deviceId: deviceId || 'default' })
    }
    return result
  }

  return {
    videoRef,
    status: state.status,
    ready: state.status === CAMERA_STATES.READY,
    disconnected: state.status === CAMERA_STATES.DISCONNECTED,
    reconnecting: state.status === CAMERA_STATES.RECONNECTING,
    error: state.status === CAMERA_STATES.ERROR ? state.error : null,
    captureFrame,
    devices,
    retry,
    reconnect,
  }
}
