export default function HomeScreen({ onStart, onOpenSettings }) {
  return (
    <div
      className="screen"
      onClick={onStart}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ink)',
        color: 'var(--paper)',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onOpenSettings()
        }}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 5,
          background: 'transparent',
          border: 'none',
          color: 'var(--paper)',
          opacity: 0.6,
          fontSize: 22,
          padding: 8,
        }}
        aria-label="Settings"
      >
        ⚙
      </button>

      <div className="sprocket-strip" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 8vw, 88px)',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.05,
        }}
      >
        SAY CHEESE
      </h1>
      <p style={{ fontSize: 'clamp(14px, 2.5vw, 20px)', opacity: 0.8, marginTop: 12 }}>Tap anywhere to start</p>

      <div
        style={{
          marginTop: 'clamp(24px, 5vh, 48px)',
          width: 'clamp(64px, 10vw, 96px)',
          height: 'clamp(64px, 10vw, 96px)',
          borderRadius: '50%',
          background: 'var(--flash-yellow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ width: '62%', height: '62%', borderRadius: '50%', background: 'var(--ink)' }} />
      </div>

      <div className="sprocket-strip" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>
    </div>
  )
}
