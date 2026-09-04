import React from 'react'
import { toneOf, TONE } from '../../theme/tokens.js'

/**
 * The only status chip in the application. Colour is resolved from the
 * semantic map in theme/tokens.js, so a status can never pick a random colour.
 */
export default function StatusBadge({ status, tone, dot = true, size = 'md' }) {
  const text = status || '—'
  const t = tone ? TONE[tone] : toneOf(text)
  return (
    <span
      className="badge"
      style={{
        color: t.fg,
        background: t.bg,
        borderColor: t.border,
        fontSize: size === 'sm' ? 11 : 12,
        padding: size === 'sm' ? '2px 7px' : '3px 9px',
      }}
    >
      {dot && <span className="badge-dot" style={{ background: t.dot }} />}
      {text}
    </span>
  )
}

/** Reference chip used for the CR "golden thread" and other doc links. */
export function RefChip({ children, onClick, tone = 'teal', title }) {
  const t = TONE[tone]
  return (
    <span
      title={title}
      onClick={onClick}
      className="badge"
      style={{
        color: t.fg,
        background: t.bg,
        borderColor: t.border,
        cursor: onClick ? 'pointer' : undefined,
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  )
}
