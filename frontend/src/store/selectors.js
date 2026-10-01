import { crMargin } from '../logic/stock.js'

const by = (arr, id) => (Array.isArray(arr) ? arr.find((x) => x && (x.id === id || (id != null && String(x.id) === String(id)))) : null)

export const getCustomer = (s, id) => by(s.customers, id)
export const getSupplier = (s, id) => by(s.suppliers, id)
export const getItem = (s, id) => by(s.items, id)
export const getCR = (s, id) => by(s.customerRequests, id)

export const customerName = (s, id) => (getCustomer(s, id) || {}).name || '—'
export const supplierName = (s, id) => (getSupplier(s, id) || {}).name || '—'
export const itemName = (s, id) => (getItem(s, id) || {}).name || '—'
export const itemCode = (s, id) => (getItem(s, id) || {}).code || '—'
export const itemUnit = (s, id) => (getItem(s, id) || {}).unit || ''
export const crNo = (s, id) => (getCR(s, id) || {}).crNo || '—'

export const prByCr = (s, crId) => (s.purchaseRequests || []).find((p) => p.crId === crId || (crId != null && String(p.crId) === String(crId)))
export const crOfPr = (s, prId) => {
  const pr = by(s.purchaseRequests, prId)
  return pr ? getCR(s, pr.crId) : null
}
export const vqsOfPr = (s, prId) => (s.vendorQuotations || []).filter((v) => v.prId === prId || (prId != null && String(v.prId) === String(prId)))
export const qcOfPr = (s, prId) => (s.quotationComparisons || []).find((q) => q.prId === prId || (prId != null && String(q.prId) === String(prId)))

export const activeCustomers = (s) => s.customers.filter((c) => c.active)
export const activeSuppliers = (s) => s.suppliers.filter((c) => c.active)
export const activeItems = (s) => s.items.filter((c) => c.active)

/** Everything linked to one Customer Request — powers the Track timeline. */
export function crChain(s, crId) {
  const eq = (a, b) => a === b || (a != null && b != null && String(a) === String(b))
  const pr = (s.purchaseRequests || []).find((x) => eq(x.crId, crId))
  return {
    cr: getCR(s, crId),
    pr,
    vqs: pr ? (s.vendorQuotations || []).filter((v) => eq(v.prId, pr.id)) : [],
    qc: pr ? (s.quotationComparisons || []).find((q) => eq(q.prId, pr.id)) : undefined,
    cqs: (s.customerQuotations || []).filter((x) => eq(x.crId, crId)),
    sos: (s.salesOrders || []).filter((x) => eq(x.crId, crId)),
    pos: (s.purchaseOrders || []).filter((x) => eq(x.crId, crId)),
    grns: (s.grns || []).filter((x) => eq(x.crId, crId)),
    inwards: (s.inwards || []).filter((x) => eq(x.crId, crId)),
    outwards: (s.outwards || []).filter((x) => eq(x.crId, crId)),
    salesInvoices: (s.salesInvoices || []).filter((x) => eq(x.crId, crId)),
    purchaseInvoices: (s.purchaseInvoices || []).filter((x) => eq(x.crId, crId)),
    margin: crMargin(s.stockLedger, crId),
  }
}

/** Counts of open documents per stage — the Dashboard. */
export function dashboardCounts(s) {
  return {
    openRequests: s.customerRequests.filter((x) => x.stage === 'Requested').length,
    awaitingRfq: s.purchaseRequests.filter((x) => x.status === 'Open').length,
    awaitingQuotes: s.purchaseRequests.filter((x) => x.status === 'RFQ Sent').length,
    toCompare: s.purchaseRequests.filter(
      (p) =>
        s.vendorQuotations.filter((v) => v.prId === p.id).length >= 2 &&
        !(s.quotationComparisons.find((q) => q.prId === p.id) || {}).approvedAt
    ).length,
    quotesOut: s.customerQuotations.filter((x) => x.status === 'Sent').length,
    posToSend: s.purchaseOrders.filter((x) => x.status === 'Draft').length,
    awaitingGoods: s.purchaseOrders.filter((x) => x.status === 'Sent' || x.status === 'Partially Received').length,
    inwardPending: s.inwards.filter((x) => x.status === 'Pending').length,
    toDispatch: s.salesOrders.filter((x) => x.status === 'Open').length,
    toInvoiceSales: s.outwards.filter((x) => x.status === 'Dispatched').length,
    toInvoicePurchase: s.grns.filter((x) => x.status === 'Received').length,
    completed: s.customerRequests.filter((x) => x.stage === 'Completed').length,
  }
}
