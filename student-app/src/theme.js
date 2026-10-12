// Design tokens — derived from the Micro Dashboard reference set (4.1-*).
// Three-step dark surface stack: canvas → panel → sunken.
// Saturated "pencil-box" 4-color accent palette kept; only the grayscale flipped.
// Radius scale: 14 / 10 / 6 (container / button / chip). No shadows.

export const tokens = {
  // Three-tier dark surface stack (page → panel → recessed)
  canvas:    '#0d0d0f',  // page background, near-black with a touch of warmth
  surface:   '#17171a',  // cards, table, top bar (one step lighter than canvas)
  sunken:    '#1f1f23',  // sidebar, search inputs, nested wells
  hover:     '#26262b',  // hover/active state on dark surfaces
  hairline:  '#26262b',  // 1px borders between dark surfaces
  hairline2: '#1f1f23',  // 1px row dividers inside a panel
  ink:       '#f5f5f5',  // primary text (never pure white)
  inkSoft:   '#a1a1a6',  // secondary text, labels
  inkFaint:  '#6b6b73',  // tertiary text, placeholders, hints

  // Accent palette — violet primary (per user), with green/yellow/blue support.
  // Kept four-family for status variety, but only violet is the brand signal.
  violet:    '#8b5cf6',  // action, primary CTA, brand signal
  violetSoft:'rgba(139, 92, 246, 0.16)',
  violetText:'#a78bfa',
  green:     '#22c55e',  // success, growth, "on" state
  yellow:    '#f5b400',  // warmth, highlight, secondary
  blue:      '#38bdf8',  // cool counterpoint, info

  // Convenience semantic aliases — primary brand is violet now.
  accent:    '#8b5cf6',
  accentInk: '#0d0d0f',

  // Tinted status backgrounds for dark mode (low-alpha washes)
  greenSoft:  'rgba(34, 197, 94, 0.14)',
  yellowSoft: 'rgba(245, 180, 0, 0.14)',
  blueSoft:   'rgba(56, 189, 248, 0.14)',

  // Status text colors (saturated, readable on dark)
  greenText:  '#4ade80',
  yellowText: '#fbbf24',
  blueText:   '#7dd3fc',
}

// Radius scale: 14 / 10 / 6 (container / button / chip)
export const radius = {
  container: 14,
  button:    10,
  chip:      6,
  pill:      999,
}
