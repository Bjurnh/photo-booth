/**
 * Renders a layout's slots as placeholder rectangles, scaled to fit
 * `previewWidth`. Reads directly from the layout's own slots/width/height -
 * no separate hardcoded geometry, so the preview always matches what
 * composeLayout() will actually produce.
 */
export default function LayoutPreview({ layout, previewWidth = 120 }) {
  const scale = previewWidth / layout.width
  const previewHeight = layout.height * scale

  return (
    <svg
      width={previewWidth}
      height={previewHeight}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      style={{ display: 'block', borderRadius: 8, overflow: 'hidden' }}
    >
      <rect x={0} y={0} width={layout.width} height={layout.height} fill={layout.background || '#ffffff'} stroke="var(--line)" strokeWidth={4} />
      {layout.slots.map((slot, i) => (
        <rect
          key={i}
          x={slot.x}
          y={slot.y}
          width={slot.width}
          height={slot.height}
          rx={Math.min(slot.width, slot.height) * 0.04}
          fill="#c9c2b4"
        />
      ))}
    </svg>
  )
}
