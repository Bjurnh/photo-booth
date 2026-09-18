import { LAYOUTS } from '../layouts/layoutDefinitions'
import LayoutPreview from './LayoutPreview'

export default function LayoutPicker({ selectedId, onSelect, onNext, onBack }) {
  return (
    <div className="screen" style={{ padding: '32px 24px' }}>
      <h2 className="screen-heading">Choose a layout</h2>
      <p style={{ opacity: 0.7, marginTop: -8 }}>This sets the shape of your final photo</p>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16,
          overflowY: 'auto',
          marginTop: 16,
          alignContent: 'start',
        }}
      >
        {LAYOUTS.map((layout) => {
          const selected = selectedId === layout.id
          return (
            <button
              key={layout.id}
              onClick={() => onSelect(layout.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: 16,
                minHeight: 200,
                borderRadius: 16,
                border: selected ? '4px solid var(--coral)' : '2px solid var(--line)',
                background: '#fff',
              }}
            >
              <LayoutPreview layout={layout} previewWidth={110} />
              <div style={{ fontWeight: 700, fontSize: 16, textAlign: 'center' }}>{layout.name}</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                {layout.slots.length} photo{layout.slots.length > 1 ? 's' : ''}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <button className="big-button secondary" onClick={onBack}>Back</button>
        <button className="big-button accent" onClick={onNext}>Next</button>
      </div>
    </div>
  )
}
