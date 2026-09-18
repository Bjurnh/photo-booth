import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../hooks/useCamera'
import { createCaptureLock } from '../utils/captureLock'
import { getUserFacingMessage } from '../utils/errors'
import { logger } from '../utils/logger'

export default function CameraCapture({
  filterCss,
  templateUrl,
  onCaptured,
  onBack,
  deviceId,
  onDeviceChange,
  processingError,
  onDismissError,
  slotProgress,
}) {
  const { videoRef, ready, disconnected, reconnecting, error, captureFrame, devices, retry, reconnect } =
    useCamera(deviceId)
  const [count, setCount] = useState(null)
  // isProcessing covers the full window from "shutter pressed" through
  // "onCaptured has returned" - including the async compositing step in
  // App.jsx. This is what actually prevents a double capture; the
  // countdown-based `count` state alone was not enough, since it cleared
  // before the (async) result was handled.
  const [isProcessing, setIsProcessing] = useState(false)
  const lockRef = useRef(createCaptureLock())
  const timerRef = useRef(null)

  // Only mirror the built-in front camera - an external device like a DJI
  // in webcam mode should show/capture un-flipped.
  const mirrored = !deviceId

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function startCountdown() {
    // Synchronous, ref-based gate - closes the race where React state
    // (`count`/`isProcessing`) hasn't re-rendered yet but a second tap/
    // keydown/duplicate event already fired.
    if (!lockRef.current.acquire()) {
      logger.warn('capture_ignored_duplicate', {})
      return
    }
    setIsProcessing(true)

    let n = 3
    setCount(n)
    timerRef.current = setInterval(() => {
      n -= 1
      if (n === 0) {
        clearInterval(timerRef.current)
        timerRef.current = null
        setCount(null)

        const { canvas, error: captureErr } = captureFrame(mirrored)
        if (captureErr || !canvas) {
          lockRef.current.release()
          setIsProcessing(false)
          onCaptured(null, captureErr)
          return
        }

        // onCaptured may be async (image compositing in App.jsx). The lock
        // stays held until it resolves either way, so the shutter can't
        // be pressed again mid-processing. The catch here is defensive -
        // App.jsx's handleCaptured already catches internally and never
        // rejects, but this guarantees no unhandled rejection even if
        // that changes later.
        Promise.resolve(onCaptured(canvas, null))
          .catch((err) => {
            logger.error('capture_failed', { stage: 'on_captured_callback', message: err?.message })
          })
          .finally(() => {
            lockRef.current.release()
            setIsProcessing(false)
          })
      } else {
        setCount(n)
      }
    }, 800)
  }

  const shutterDisabled = !ready || count !== null || isProcessing

  return (
    <div className="screen" style={{ background: 'var(--film-black)' }}>
      {devices.length > 1 && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5, textAlign: 'right' }}>
          <select
            value={deviceId || ''}
            onChange={(e) => onDeviceChange(e.target.value || null)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 14,
              fontFamily: 'var(--font-body)',
            }}
          >
            <option value="">Default (built-in) camera</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera (${d.deviceId.slice(0, 6)})`}
              </option>
            ))}
          </select>
          {deviceId && (
            <div style={{ color: 'var(--paper)', fontSize: 11, opacity: 0.7, marginTop: 4 }}>
              Using external camera (e.g. DJI)
            </div>
          )}
        </div>
      )}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {slotProgress && slotProgress.total > 1 && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 5,
              background: 'rgba(0,0,0,0.55)',
              color: 'var(--paper)',
              padding: '8px 14px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Photo {slotProgress.current} of {slotProgress.total}
          </div>
        )}
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: mirrored ? 'scaleX(-1)' : 'none',
            filter: filterCss,
          }}
        />

        {templateUrl && (
          <img
            src={templateUrl}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
          />
        )}

        {count !== null && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(72px, 22vw, 160px)',
              color: 'var(--paper)',
              textShadow: '0 0 30px rgba(0,0,0,0.6)',
            }}
          >
            {count}
          </div>
        )}

        {disconnected && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 24, textAlign: 'center', background: 'rgba(0,0,0,0.75)' }}>
            <div>Camera disconnected. Check the cable/connection, then reconnect.</div>
            <button className="big-button accent" onClick={reconnect} disabled={reconnecting}>
              {reconnecting ? 'Reconnecting…' : 'Reconnect Camera'}
            </button>
          </div>
        )}

        {error && !disconnected && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 24, textAlign: 'center', background: 'rgba(0,0,0,0.6)' }}>
            <div>{getUserFacingMessage(error)}</div>
            <button className="big-button accent" onClick={retry}>Retry</button>
          </div>
        )}

        {processingError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 24, textAlign: 'center', background: 'rgba(0,0,0,0.6)' }}>
            <div>{getUserFacingMessage(processingError)}</div>
            <button className="big-button accent" onClick={onDismissError}>Okay</button>
          </div>
        )}

        {!ready && !error && !disconnected && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            Starting camera…
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(12px, 3vw, 20px) clamp(12px, 4vw, 24px)',
          background: 'var(--film-black)',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <button className="big-button secondary" style={{ color: 'var(--paper)', borderColor: 'var(--paper)' }} onClick={onBack}>
            Back
          </button>
        </div>

        <button className="shutter-button" onClick={startCountdown} disabled={shutterDisabled} style={{ opacity: shutterDisabled ? 0.5 : 1 }} />

        <div style={{ flex: 1 }} />
      </div>
    </div>
  )
}
