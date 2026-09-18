import { describe, it, expect } from 'vitest'
import {
  CAPTURE_ERROR_CODES,
  createCaptureError,
  getUserFacingMessage,
  categorizeGetUserMediaError,
} from './errors'

describe('createCaptureError', () => {
  it('creates a well-formed error for a known code', () => {
    const err = createCaptureError(CAPTURE_ERROR_CODES.INVALID_VIDEO, 'video not ready')
    expect(err.code).toBe('INVALID_VIDEO')
    expect(err.technicalMessage).toBe('video not ready')
  })

  it('falls back to UNKNOWN_CAPTURE_ERROR for an unrecognized code', () => {
    const err = createCaptureError('NOT_A_REAL_CODE', 'oops')
    expect(err.code).toBe(CAPTURE_ERROR_CODES.UNKNOWN_CAPTURE_ERROR)
  })
})

describe('getUserFacingMessage', () => {
  it('returns a non-technical message for every known error code', () => {
    for (const code of Object.values(CAPTURE_ERROR_CODES)) {
      const message = getUserFacingMessage(createCaptureError(code, 'some internal detail: 0x1234'))
      expect(typeof message).toBe('string')
      expect(message.length).toBeGreaterThan(0)
      // Never leak technical detail into the user-facing string.
      expect(message).not.toContain('0x1234')
    }
  })

  it('returns a safe default when given null', () => {
    expect(getUserFacingMessage(null)).toBe(getUserFacingMessage(createCaptureError('UNKNOWN_CAPTURE_ERROR')))
  })
})

describe('categorizeGetUserMediaError', () => {
  it('maps NotAllowedError to CAMERA_PERMISSION', () => {
    const result = categorizeGetUserMediaError({ name: 'NotAllowedError', message: 'denied' })
    expect(result.code).toBe(CAPTURE_ERROR_CODES.CAMERA_PERMISSION)
  })

  it('maps NotFoundError to CAMERA_UNAVAILABLE', () => {
    const result = categorizeGetUserMediaError({ name: 'NotFoundError', message: 'no device' })
    expect(result.code).toBe(CAPTURE_ERROR_CODES.CAMERA_UNAVAILABLE)
  })

  it('maps a synthetic TimeoutError to CAMERA_UNAVAILABLE (a hung getUserMedia call)', () => {
    const result = categorizeGetUserMediaError({ name: 'TimeoutError', message: 'getUserMedia timed out after 10000ms' })
    expect(result.code).toBe(CAPTURE_ERROR_CODES.CAMERA_UNAVAILABLE)
  })

  it('maps an unrecognized error name to UNKNOWN_CAPTURE_ERROR', () => {
    const result = categorizeGetUserMediaError({ name: 'SomethingWeird', message: 'huh' })
    expect(result.code).toBe(CAPTURE_ERROR_CODES.UNKNOWN_CAPTURE_ERROR)
  })
})
