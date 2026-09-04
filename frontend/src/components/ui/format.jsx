import React from 'react'

/* Consistent number, currency and quantity presentation across the whole ERP. */

export const nf = (n, dp = 2) =>
  (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })

/** ₹ 12,500.00 */
export function Money({ value, dp = 2, muted, strong, tone, className = '' }) {
  const style = {}
  if (tone === 'pos') style.color = 'var(--c-success)'
  if (tone === 'neg') style.color = 'var(--c-danger)'
  if (muted) style.color = 'var(--c-text-muted)'
  return (
    <span className={`num ${className}`} style={{ fontWeight: strong ? 650 : undefined, ...style }}>
      <span style={{ opacity: 0.55, marginRight: 3 }}>₹</span>
      {nf(value, dp)}
    </span>
  )
}

/** 5 NOS */
export function Qty({ value, unit, dp = 2, strong, className = '' }) {
  return (
    <span className={`num ${className}`} style={{ fontWeight: strong ? 650 : undefined }}>
      {nf(value, dp)}
      {unit ? <span style={{ color: 'var(--c-text-muted)', marginLeft: 4, fontSize: '0.92em' }}>{unit}</span> : null}
    </span>
  )
}

/** 12.00 % */
export function Pct({ value, dp = 2, tone, strong }) {
  const style = {}
  if (tone === 'auto') style.color = Number(value) >= 0 ? 'var(--c-success)' : 'var(--c-danger)'
  if (tone === 'pos') style.color = 'var(--c-success)'
  if (tone === 'neg') style.color = 'var(--c-danger)'
  return (
    <span className="num" style={{ fontWeight: strong ? 650 : undefined, ...style }}>
      {nf(value, dp)} %
    </span>
  )
}

/** Plain string helpers for CSV export and email bodies. */
export const money = (n) => nf(n, 2)
export const inr = (n) => `₹ ${nf(n, 2)}`
