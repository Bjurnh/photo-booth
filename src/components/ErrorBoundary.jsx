import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Photobooth app crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            background: 'var(--ink)',
            color: 'var(--paper)',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)' }}>Something went wrong</h2>
          <p style={{ opacity: 0.8, maxWidth: 320 }}>
            The booth ran into an unexpected error. Restarting should fix it.
          </p>
          <button className="big-button accent" onClick={() => window.location.reload()}>
            Restart booth
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
