// Filter definitions. `css` is used for the live preview overlay (cheap),
// and is re-applied at export time by drawing through a filtered canvas.
export const FILTERS = [
  { id: 'normal', label: 'Normal', css: 'none' },
  { id: 'grayscale', label: 'B&W', css: 'grayscale(1) contrast(1.05)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(0.75) contrast(1.05)' },
  { id: 'bright', label: 'Bright', css: 'brightness(1.15) saturate(1.1)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.35) saturate(1.3) contrast(0.9) brightness(1.05)' },
]

export function getFilterById(id) {
  return FILTERS.find((f) => f.id === id) || FILTERS[0]
}
