import { crMargin } from '../logic/stock.js'

const by = (arr, id) => arr.find((x) => x.id === id)

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

export const prByCr = (s, crId) => s.purchaseRequests.find((p) => p.crId === crId)
export const crOfPr = (s, prId) => {
  const pr = by(s.purchaseRequests, prId)
  return pr ? getCR(s, pr.crId) : null
}
export const vqsOfPr = (s, prId) => s.vendorQuotations.filter((v) => v.prId === prId)
export const qcOfPr = (s, prId) => s.quotationComparisons.find((q) => q.prId === prId)

export const activeCustomers = (s) => s.customers.filter((c) => c.active)
export const activeSuppliers = (s) => s.suppliers.filter((c) => c.active)
export const activeItems = (s) => s.items.filter((c) => c.active)

/** Everything linked to one Customer Request — powers the Track timeline. */
export function crChain(s, crId) {
  const pr = s.purchaseRequests.find((x) => x.crId === crId)
  return {
    cr: getCR(s, crId),
    pr,
    vqs: pr ? s.vendorQuotations.filter((v) => v.prId === pr.id) : [],
    qc: pr ? s.quotationComparisons.find((q) => q.prId === pr.id) : undefined,
    cqs: s.customerQuotations.filter((x) => x.crId === crId),
    sos: s.salesOrders.filter((x) => x.crId === crId),
    pos: s.purchaseOrders.filter((x) => x.crId === crId),
    grns: s.grns.filter((x) => x.crId === crId),
    inwards: s.inwards.filter((x) => x.crId === crId),
    outwards: s.outwards.filter((x) => x.crId === crId),
    salesInvoices: s.salesInvoices.filter((x) => x.crId === crId),
    purchaseInvoices: s.purchaseInvoices.filter((x) => x.crId === crId),
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
