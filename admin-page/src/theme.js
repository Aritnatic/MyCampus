// Design tokens — derived from the Micro Dashboard reference set (4.1-*).
// Three-step surface stack: canvas → panel → sunken, in a dark and a light palette.
// Saturated "pencil-box" 4-color accent palette kept; only the grayscale flips between modes.
// Radius scale: 14 / 10 / 6 (container / button / chip). No shadows.
//
// Theming: `tokens.ink` is the string "var(--ink)", so every inline style follows the active palette
// with no re-render. applyTheme() writes the palette onto :root as CSS variables.

import { useSyncExternalStore } from 'react'

const palettes = {
  dark: {
    canvas:    '#0d0d0f',  // page background, near-black with a touch of warmth
    surface:   '#17171a',  // cards, table, top bar (one step lighter than canvas)
    sunken:    '#1f1f23',  // sidebar, search inputs, nested wells
    hover:     '#26262b',  // hover/active state on surfaces
    hairline:  '#26262b',  // 1px borders between surfaces
    hairline2: '#1f1f23',  // 1px row dividers inside a panel
    ink:       '#f5f5f5',  // primary text (never pure white)
    inkSoft:   '#a1a1a6',  // secondary text, labels
    inkFaint:  '#6b6b73',  // tertiary text, placeholders, hints

    violet:    '#8b5cf6',  // action, primary CTA, brand signal
    violetSoft:'rgba(139, 92, 246, 0.16)',
    violetText:'#a78bfa',
    green:     '#22c55e',  // success, growth, "on" state
    yellow:    '#f5b400',  // warmth, highlight, secondary
    blue:      '#38bdf8',  // cool counterpoint, info
    red:       '#f87171',  // errors, destructive actions
    redSoft:   'rgba(248, 113, 113, 0.14)',

    accent:    '#8b5cf6',
    accentInk: '#0d0d0f',

    greenSoft:  'rgba(34, 197, 94, 0.14)',
    yellowSoft: 'rgba(245, 180, 0, 0.14)',
    blueSoft:   'rgba(56, 189, 248, 0.14)',

    greenText:  '#4ade80',
    yellowText: '#fbbf24',
    blueText:   '#7dd3fc',

    // Hover wash and scrollbar thumb: white-on-dark, black-on-light.
    wash:       'rgba(255, 255, 255, 0.05)',
    thumb:      'rgba(255, 255, 255, 0.22)',
  },
  light: {
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

    wash:       'rgba(0, 0, 0, 0.05)',
    thumb:      'rgba(0, 0, 0, 0.22)',
  },
}

export const tokens = Object.fromEntries(Object.keys(palettes.dark).map((k) => [k, `var(--${k})`]))

// Radius scale: 14 / 10 / 6 (container / button / chip)
export const radius = {
  container: 14,
  button:    10,
  chip:      6,
  pill:      999,
}

// ---- choosing a theme ----
// The person's choice is 'system' (follow the OS), 'light' or 'dark', remembered in this browser.
const KEY = 'mycampus.admin.theme'
const CHOICES = ['system', 'light', 'dark']
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: light)') : null
const listeners = new Set()

function read() {
  try { const v = localStorage.getItem(KEY); return CHOICES.includes(v) ? v : 'system' } catch { return 'system' }
}
let choice = read()

const resolve = () => (choice === 'system' ? (media?.matches ? 'light' : 'dark') : choice)

export function applyTheme() {
  const mode = resolve()
  const root = document.documentElement
  for (const [k, v] of Object.entries(palettes[mode])) root.style.setProperty(`--${k}`, v)
  root.dataset.theme = mode
  root.style.colorScheme = mode // native scrollbars, inputs and date pickers follow too
}

export function setThemeChoice(next) {
  choice = next
  try { localStorage.setItem(KEY, next) } catch { /* private mode */ }
  applyTheme()
  listeners.forEach((l) => l())
}

media?.addEventListener('change', () => { if (choice === 'system') applyTheme() })

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
export const useThemeChoice = () => useSyncExternalStore(subscribe, () => choice)

applyTheme()
