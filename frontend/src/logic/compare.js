import { round2, sum } from './pricing.js'

/** Totals for one vendor quotation. Only quoted lines count. */
export function vqTotals(vq) {
  const quoted = (vq.lines || []).filter((l) => !l.notQuoted)
  const subtotal = round2(sum(quoted, (l) => (Number(l.qty) || 0) * (Number(l.rate) || 0)))
  const tax = round2(
    sum(quoted, (l) => ((Number(l.qty) || 0) * (Number(l.rate) || 0) * (Number(l.taxPct) || 0)) / 100)
  )
  const freight = round2(vq.freight)
  return { subtotal, tax, freight, grandTotal: round2(subtotal + tax + freight), quotedCount: quoted.length }
}

export const lineTotal = (l) => round2((Number(l.qty) || 0) * (Number(l.rate) || 0))

/** A quotation is complete only if it covers every item on the PR. */
export function isComplete(vq, prLines) {
  const quoted = new Set((vq.lines || []).filter((l) => !l.notQuoted && Number(l.rate) > 0).map((l) => l.itemId))
  return (prLines || []).every((l) => quoted.has(l.itemId))
}

/**
 * Best = lowest grand total among quotations that cover all items.
 * Ties broken by fewer delivery days, then earlier quote date.
 */
export function computeBest(vqs, prLines) {
  const eligible = vqs.filter((v) => isComplete(v, prLines))
  if (!eligible.length) return null
  const sorted = [...eligible].sort((a, b) => {
    const ta = vqTotals(a).grandTotal
    const tb = vqTotals(b).grandTotal
    if (ta !== tb) return ta - tb
    const da = Number(a.deliveryDays) || 0
    const db = Number(b.deliveryDays) || 0
    if (da !== db) return da - db
    return String(a.quoteDate || '').localeCompare(String(b.quoteDate || ''))
  })
  return sorted[0].id
}

/** Lowest rate per item across the compared quotations (for cell shading). */
export function bestRatePerItem(vqs, prLines) {
  const map = {}
  ;(prLines || []).forEach((pl) => {
    let best = null
    vqs.forEach((v) => {
      const l = (v.lines || []).find((x) => x.itemId === pl.itemId)
      if (!l || l.notQuoted || !(Number(l.rate) > 0)) return
      if (best === null || Number(l.rate) < best) best = Number(l.rate)
    })
    map[pl.itemId] = best
  })
  return map
}
