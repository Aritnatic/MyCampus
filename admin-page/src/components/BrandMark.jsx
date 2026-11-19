import React from 'react'

// The MyCampus mark (brand/mark.svg): a lowercase "m" of two arches, the right one a step higher.
// Draws in the current text colour, so it works on violet, dark and light backgrounds alike.
export default function BrandMark({ className = 'w-6 h-6', title = 'MyCampus' }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-label={title}>
      <path d="M22 87V61a13 13 0 0 1 26 0M48 87V40a13 13 0 0 1 26 0V87" transform="translate(0 -5.5)" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="butt" />
    </svg>
  )
}
