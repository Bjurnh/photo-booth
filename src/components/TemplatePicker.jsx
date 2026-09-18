import { useRef, useMemo } from 'react'
import { fileToDataUrl, loadImageFromUrl } from '../utils/templateStorage'

export default function TemplatePicker({ templates, setTemplates, selectedId, onSelect, onNext, onBack, layout }) {
  const fileInputRef = useRef(null)

  // A template is stretched to fill the exact layout canvas it's applied
  // to, so a template made for one layout will look distorted on another
  // (this was the reported bug). Templates are tagged with the layout
  // they were uploaded for, and only matching ones are shown here.
  const compatibleTemplates = useMemo(
    () => templates.filter((t) => t.layoutId === layout.id),
    [templates, layout.id]
  )

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes('png')) {
      alert('Please upload a PNG file (transparent background works best).')
      e.target.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('That image is too large (max 8MB). Please use a smaller file.')
      e.target.value = ''
      return
    }

    try {
      const url = await fileToDataUrl(file)

      // Soft dimension check - catches the common mistake of exporting a
      // template at the wrong canvas size in Canva/Photoshop. Warns but
      // doesn't block, since a slightly different aspect ratio is still
      // usable (it'll just stretch a bit).
      try {
        const img = await loadImageFromUrl(url)
        const uploadedAspect = img.naturalWidth / img.naturalHeight
        const targetAspect = layout.width / layout.height
        const percentOff = Math.abs(uploadedAspect - targetAspect) / targetAspect
        if (percentOff > 0.05) {
          const proceed = confirm(
            `This image is ${img.naturalWidth}x${img.naturalHeight}, but "${layout.name}" needs ${layout.width}x${layout.height} (or the same proportions). ` +
              `Using it as-is will stretch it slightly. Upload anyway?`
          )
          if (!proceed) {
            e.target.value = ''
            return
          }
        }
      } catch {
        // If dimension-checking itself fails for some reason, don't block
        // the upload over it - just skip the warning.
      }

      const newTemplate = { id: `custom-${Date.now()}`, name: file.name, url, layoutId: layout.id }
      setTemplates((prev) => [...prev, newTemplate])
      onSelect(newTemplate.id)
    } catch {
      alert('Could not read that file. Please try a different image.')
    }
    e.target.value = ''
  }

  return (
    <div className="screen" style={{ padding: '32px 24px' }}>
      <h2 className="screen-heading">Pick a template</h2>
      <p style={{ opacity: 0.7, marginTop: -8 }}>
        For "{layout.name}" ({layout.width}x{layout.height}) — or upload your own custom design (transparent PNG)
      </p>

      {compatibleTemplates.length === 0 && (
        <p style={{ fontSize: 14, opacity: 0.6, marginTop: 8 }}>
          No templates uploaded yet for this layout. Upload one sized {layout.width}x{layout.height}, or continue without one.
        </p>
      )}

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 16,
          overflowY: 'auto',
          marginTop: 16,
        }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="big-button secondary"
          style={{
            aspectRatio: '3/4',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 16,
            borderStyle: 'dashed',
            fontSize: 16,
            padding: 12,
          }}
        >
          <span style={{ fontSize: 32 }}>+</span>
          Upload template
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />

        {compatibleTemplates.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              aspectRatio: '3/4',
              borderRadius: 16,
              border: selectedId === t.id ? '4px solid var(--coral)' : '2px solid var(--line)',
              padding: 0,
              overflow: 'hidden',
              background: '#fff',
              backgroundImage: t.url
                ? `url(${t.url})`
                : 'repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%)',
              backgroundSize: t.url ? 'cover' : '20px 20px',
              backgroundPosition: 'center',
            }}
            title={t.name}
          />
        ))}

        <button
          onClick={() => onSelect(null)}
          style={{
            aspectRatio: '3/4',
            borderRadius: 16,
            border: selectedId === null ? '4px solid var(--coral)' : '2px solid var(--line)',
            background: 'var(--paper)',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          No template
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <button className="big-button secondary" onClick={onBack}>Back</button>
        <button className="big-button accent" onClick={onNext}>Next</button>
      </div>
    </div>
  )
}
