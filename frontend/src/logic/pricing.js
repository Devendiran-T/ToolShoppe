export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

/** Default customer price = supplier rate x (1 + markup%). */
export const defaultCustomerPrice = (supplierRate, markupPct) =>
  round2((Number(supplierRate) || 0) * (1 + (Number(markupPct) || 0) / 100))

/** Margin % = (price - cost) / price. */
export const marginPct = (customerPrice, supplierRate) => {
  const p = Number(customerPrice) || 0
  if (!p) return 0
  return round2(((p - (Number(supplierRate) || 0)) / p) * 100)
}

export const money = (n) =>
  (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const inr = (n) => `₹ ${money(n)}`

export const sum = (arr, fn) => arr.reduce((a, x) => a + (Number(fn(x)) || 0), 0)
