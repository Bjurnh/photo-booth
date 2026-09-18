import { FILTERS } from '../utils/filters'

export default function FilterPicker({ selectedId, onSelect, onNext, onBack }) {
  return (
    <div className="screen" style={{ padding: '32px 24px' }}>
      <h2 className="screen-heading">Pick a filter</h2>

      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          padding: '16px 4px',
          alignItems: 'center',
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            style={{
              flex: '0 0 140px',
              height: 180,
              borderRadius: 16,
              border: selectedId === f.id ? '4px solid var(--coral)' : '2px solid var(--line)',
              background: 'linear-gradient(135deg, #ffd6a5, #fdffb6, #a0c4ff)',
              filter: f.css,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 12,
              fontWeight: 700,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="big-button secondary" onClick={onBack}>Back</button>
        <button className="big-button accent" onClick={onNext}>Next</button>
      </div>
    </div>
  )
}
