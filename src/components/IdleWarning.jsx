export default function IdleWarning({ onStillHere }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
        padding: 24,
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          maxWidth: 360,
        }}
      >
        <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Still there?</h3>
        <p style={{ fontSize: 15, opacity: 0.75 }}>
          This will restart to the home screen in a few seconds if no one's using it.
        </p>
        <button className="big-button accent" style={{ marginTop: 8 }} onClick={onStillHere}>
          I'm still here
        </button>
      </div>
    </div>
  )
}
