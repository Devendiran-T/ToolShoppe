import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { TONE } from '../../theme/tokens.js'

/**
 * Dashboard KPI tile. `tone` selects the accent from the semantic palette —
 * the card body stays white so the dashboard never turns into a colour swatch.
 */
export default function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  hint,
  trend,
  onClick,
}) {
  const t = TONE[tone] || TONE.primary
  const TrendIcon = trend == null ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'var(--c-success)' : trend < 0 ? 'var(--c-danger)' : 'var(--c-text-muted)'

  return (
    <div
      className="kpi"
      style={{ '--kpi-accent': t.dot, '--kpi-bg': t.bg, cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="kpi-top">
        <div className="kpi-label">{label}</div>
        {Icon && (
          <div className="kpi-icon">
            <Icon size={17} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        {TrendIcon && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: trendColor, fontWeight: 550 }}>
            <TrendIcon size={13} strokeWidth={2.2} />
            {Math.abs(trend)}%
          </span>
        )}
        {hint}
      </div>
    </div>
  )
}
