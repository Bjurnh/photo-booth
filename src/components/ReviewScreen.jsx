import { useState } from 'react'
import { getSavedServerUrl } from './SettingsPanel'

export default function ReviewScreen({ dataUrl, onRetake, onPrint, onDownload }) {
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'ok' | 'fail'
  const serverUrl = getSavedServerUrl()

  async function handleSaveToLaptop() {
    if (!serverUrl) {
      setSaveStatus('no-server')
      return
    }
    setSaveStatus('saving')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(`${serverUrl.replace(/\/$/, '')}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
        signal: controller.signal,
      })
      const data = await res.json()
      setSaveStatus(data.ok ? 'ok' : 'fail')
    } catch {
      setSaveStatus('fail')
    } finally {
      clearTimeout(timeout)
    }
  }

  return (
    <div className="screen" style={{ alignItems: 'center', padding: '32px 24px', overflowY: 'auto' }}>
      <h2 className="screen-heading" style={{ flexShrink: 0 }}>Looking good!</h2>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <img
          src={dataUrl}
          alt="Captured"
          style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
        />
      </div>

      {saveStatus === 'saving' && <p style={{ fontSize: 14 }}>Sending to laptop…</p>}
      {saveStatus === 'ok' && <p style={{ fontSize: 14, color: 'green' }}>Saved to laptop ✓</p>}
      {saveStatus === 'fail' && <p style={{ fontSize: 14, color: 'var(--coral)' }}>Couldn't reach laptop — check WiFi/settings</p>}
      {saveStatus === 'no-server' && <p style={{ fontSize: 14, color: 'var(--coral)' }}>Set the laptop's address in Settings (gear icon on Home) first</p>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
        <button className="big-button secondary" onClick={onRetake}>Retake</button>
        <button className="big-button" onClick={onDownload}>Download</button>
        <button className="big-button" onClick={handleSaveToLaptop}>Save to Laptop</button>
        <button className="big-button accent" onClick={onPrint}>Print</button>
      </div>
    </div>
  )
}
