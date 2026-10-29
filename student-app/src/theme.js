// Design tokens — derived from the Micro Dashboard reference set (4.1-*).
// Three-step surface stack: canvas → panel → sunken, in a dark and a light palette.
// Saturated "pencil-box" 4-color accent palette kept; only the grayscale flips between modes.
// Radius scale: 14 / 10 / 6 (container / button / chip). No shadows.
//
// Theming: `tokens` and the sheets made with `themed()` read the active palette each time they're
// accessed (at render), so the same `t.ink` / `styles.card` code works in both modes. ThemeProvider
// (context/ThemeContext.js) switches the palette and remounts the screens so everything re-reads it.

const dark = {
  // Three-tier dark surface stack (page → panel → recessed)
  canvas:    '#0d0d0f',  // page background, near-black with a touch of warmth
  surface:   '#17171a',  // cards, table, top bar (one step lighter than canvas)
  sunken:    '#1f1f23',  // search inputs, nested wells
  hover:     '#26262b',  // pressed/active state on surfaces
  hairline:  '#26262b',  // 1px borders between surfaces
  hairline2: '#1f1f23',  // 1px row dividers inside a panel
  ink:       '#f5f5f5',  // primary text (never pure white)
  inkSoft:   '#a1a1a6',  // secondary text, labels
  inkFaint:  '#6b6b73',  // tertiary text, placeholders, hints

  // Accent palette — violet primary, with green/yellow/blue support.
  violet:    '#8b5cf6',  // action, primary CTA, brand signal
  violetSoft:'rgba(139, 92, 246, 0.16)',
  violetText:'#a78bfa',
  green:     '#22c55e',  // success, growth, "on" state
  yellow:    '#f5b400',  // warmth, highlight, secondary
  blue:      '#38bdf8',  // cool counterpoint, info
  red:       '#f87171',  // errors, destructive actions
  redSoft:   'rgba(248, 113, 113, 0.14)',

  // Convenience semantic aliases — primary brand is violet.
  accent:    '#8b5cf6',
  accentInk: '#0d0d0f',

  // Tinted status backgrounds (low-alpha washes)
  greenSoft:  'rgba(34, 197, 94, 0.14)',
  yellowSoft: 'rgba(245, 180, 0, 0.14)',
  blueSoft:   'rgba(56, 189, 248, 0.14)',

  // Status text colors (saturated, readable on the surface)
  greenText:  '#4ade80',
  yellowText: '#fbbf24',
  blueText:   '#7dd3fc',
}

const light = {
  canvas:    '#f6f6f9',
  surface:   '#ffffff',
  sunken:    '#eeeef3',
  hover:     '#e4e4eb',
  hairline:  '#e0e0e8',
  hairline2: '#ececf2',
  ink:       '#16161a',
  inkSoft:   '#55555e',
  inkFaint:  '#8a8a95',

  violet:    '#7c3aed',
  violetSoft:'rgba(124, 58, 237, 0.10)',
  violetText:'#6d28d9',
  green:     '#16a34a',
  yellow:    '#d97706',
  blue:      '#0284c7',
  red:       '#dc2626',
  redSoft:   'rgba(220, 38, 38, 0.10)',

  accent:    '#7c3aed',
  accentInk: '#ffffff',

  greenSoft:  'rgba(22, 163, 74, 0.12)',
  yellowSoft: 'rgba(217, 119, 6, 0.12)',
  blueSoft:   'rgba(2, 132, 199, 0.12)',

  greenText:  '#15803d',
  yellowText: '#b45309',
  blueText:   '#0369a1',
}

export const palettes = { dark, light }

let current = dark
export const setPalette = (mode) => { current = palettes[mode] ?? dark }

// Live view of the active palette: `t.ink` is whatever the current mode says it is.
export const tokens = new Proxy({}, { get: (_, key) => current[key] })

// Wraps a factory (usually `() => StyleSheet.create({...})`, or a plain object of colours) so it's
// rebuilt once per palette instead of once at import. Use it for anything at module level that reads `t`.
export function themed(factory) {
  let built
  let builtFor
  return new Proxy({}, {
    get(_, key) {
      if (builtFor !== current) { built = factory(); builtFor = current }
      return built[key]
    },
  })
}

// Radius scale: 14 / 10 / 6 (container / button / chip)
export const radius = {
  container: 14,
  button:    10,
  chip:      6,
  pill:      999,
}
