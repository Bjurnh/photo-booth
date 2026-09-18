export default function PrintScreen({ onDone }) {
  return (
    <div
      className="screen"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ink)',
        color: 'var(--paper)',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 6vw, 40px)' }}>Sent to printer!</h1>
      <p style={{ fontSize: 18, opacity: 0.8, maxWidth: 320 }}>
        Confirm the print in the dialog if it hasn't started yet.
      </p>
      <button className="big-button accent" style={{ marginTop: 32 }} onClick={onDone}>
        Take another photo
      </button>
    </div>
  )
}
