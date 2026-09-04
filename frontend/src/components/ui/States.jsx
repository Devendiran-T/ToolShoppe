import React from 'react'
import { Inbox, AlertTriangle, RotateCw } from 'lucide-react'
import { Btn } from './Buttons.jsx'

/** Never show a blank screen — an empty list explains itself and offers the next step. */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  compact,
}) {
  return (
    <div className="state-box" style={compact ? { padding: '30px 20px' } : undefined}>
      <div className="state-ic">
        <Icon size={22} strokeWidth={1.7} />
      </div>
      <div className="state-title">{title}</div>
      {description && <div className="state-desc">{description}</div>}
      {action && <div className="state-act">{action}</div>}
    </div>
  )
}

/** User-facing error — never leaks stack traces or HTTP jargon. */
export function ErrorState({ title = 'Unable to load this data', description, onRetry }) {
  return (
    <div className="state-box">
      <div className="state-ic" style={{ color: 'var(--c-danger)', background: 'var(--c-danger-light)', borderColor: '#FECACA' }}>
        <AlertTriangle size={22} strokeWidth={1.7} />
      </div>
      <div className="state-title">{title}</div>
      <div className="state-desc">
        {description || 'Something went wrong while preparing this screen. Please try again.'}
      </div>
      {onRetry && (
        <div className="state-act">
          <Btn variant="secondary" icon={RotateCw} onClick={onRetry}>
            Retry
          </Btn>
        </div>
      )}
    </div>
  )
}

/* ----------------------------- skeleton loaders ----------------------------- */

export function TableSkeleton({ rows = 6, cols = 6 }) {
  return (
    <div style={{ padding: '0 0 4px' }}>
      <div style={{ display: 'flex', gap: 16, padding: '14px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-alt)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="sk" style={{ height: 10, flex: i === 1 ? 2 : 1 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 16, padding: '17px 16px', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="sk" style={{ height: 12, flex: i === 1 ? 2 : 1, opacity: 1 - r * 0.09 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function KpiSkeleton({ count = 4 }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="kpi" key={i} style={{ '--kpi-accent': 'var(--c-border)' }}>
          <div className="kpi-top">
            <div className="sk" style={{ height: 10, width: 90 }} />
            <div className="sk" style={{ height: 34, width: 34, borderRadius: 9 }} />
          </div>
          <div className="sk" style={{ height: 22, width: 110, marginTop: 12 }} />
          <div className="sk" style={{ height: 9, width: 70, marginTop: 9 }} />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ height = 220 }) {
  return (
    <div className="card card-pad">
      <div className="sk" style={{ height: 12, width: 160, marginBottom: 16 }} />
      <div className="sk" style={{ height }} />
    </div>
  )
}
