import { useState } from 'react'

const STORAGE_KEY = 'photobooth.saveServerUrl'

export function getSavedServerUrl() {
  return localStorage.getItem(STORAGE_KEY) || ''
}

export function setSavedServerUrl(url) {
  localStorage.setItem(STORAGE_KEY, url)
}

export default function SettingsPanel({ onClose }) {
  const [url, setUrl] = useState(getSavedServerUrl())
  const [status, setStatus] = useState(null)

  function handleSave() {
    setSavedServerUrl(url.trim())
    onClose()
  }

  async function handleTest() {
    setStatus('testing')
    try {
      const res = await fetch(`${url.trim().replace(/\/$/, '')}/api/health`)
      const data = await res.json()
      setStatus(data.ok ? 'ok' : 'fail')
    } catch {
      setStatus('fail')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 420,
        }}
      >
        <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Laptop save server</h3>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          On the laptop, run <code>npm run server</code>, then enter its local network address here
          (e.g. http://192.168.1.20:4000). Photos taken on this device will be sent there to save.
        </p>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://192.168.1.20:4000"
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: '2px solid var(--line)',
            fontSize: 16,
            marginTop: 8,
          }}
        />

        {status === 'ok' && <p style={{ color: 'green', fontSize: 14 }}>Connected ✓</p>}
        {status === 'fail' && <p style={{ color: 'var(--coral)', fontSize: 14 }}>Could not reach server</p>}

        <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="big-button secondary" style={{ padding: '12px 20px', fontSize: 16 }} onClick={handleTest}>
            Test
          </button>
          <button className="big-button accent" style={{ padding: '12px 20px', fontSize: 16 }} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
