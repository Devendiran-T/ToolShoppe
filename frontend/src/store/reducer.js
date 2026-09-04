import { nextNo, uid } from './numbering.js'
import { round2, sum } from '../logic/pricing.js'
import { vqTotals, computeBest } from '../logic/compare.js'
import { available } from '../logic/stock.js'
import { blankState } from './seed.js'

export const today = () => new Date().toISOString().slice(0, 10)
export const addDays = (d, n) => {
  const dt = new Date(d || today())
  dt.setDate(dt.getDate() + (Number(n) || 0))
  return dt.toISOString().slice(0, 10)
}

const clone = (s) => JSON.parse(JSON.stringify(s))
const find = (arr, id) => arr.find((x) => x.id === id)

/* ------------------------------------------------------------------ *
 * CR stage is never edited by hand - it is derived from the furthest
 * linked document after every single action.
 * ------------------------------------------------------------------ */
export const CR_STAGES = [
  'Requested', 'RFQ Sent', 'Quoted', 'PO Received',
  'Stock In', 'Dispatched', 'Invoiced', 'Completed',
]

function deriveCrStage(s, crId) {
  const si = s.salesInvoices.some((x) => x.crId === crId)
  const pi = s.purchaseInvoices.some((x) => x.crId === crId)
  if (si && pi) return 'Completed'
  if (si || pi) return 'Invoiced'
  if (s.outwards.some((x) => x.crId === crId)) return 'Dispatched'
  if (s.inwards.some((x) => x.crId === crId && x.status === 'Added')) return 'Stock In'
  if (s.salesOrders.some((x) => x.crId === crId)) return 'PO Received'
  if (s.customerQuotations.some((x) => x.crId === crId)) return 'Quoted'
  const pr = s.purchaseRequests.find((x) => x.crId === crId)
  if (pr && pr.rfqSentAt) return 'RFQ Sent'
  return 'Requested'
}

function derive(s) {
  s.customerRequests.forEach((cr) => { cr.stage = deriveCrStage(s, cr.id) })
  return s
}

const logEmail = (s, { to, subject, body, refType, refId }) => {
  s.emailLog.unshift({
    id: uid('eml'),
    sentAt: new Date().toISOString(),
    to: Array.isArray(to) ? to : [to],
    subject, body, refType, refId,
  })
}

/* ------------------------------------------------------------------ */

export function reducer(state, action) {
  const s = clone(state)
  const c = s.counters

  switch (action.type) {
    /* ---------------- Masters ---------------- */
    case 'MASTER_SAVE': {
      const { collection, record, codeType } = action
      const list = s[collection]
      if (record.id) {
        const i = list.findIndex((x) => x.id === record.id)
        list[i] = { ...list[i], ...record }
      } else {
        list.push({
          ...record,
          id: uid(codeType.toLowerCase()),
          code: nextNo(c, codeType),
          active: true,
        })
      }
      return derive(s)
    }
    case 'MASTER_TOGGLE': {
      const r = find(s[action.collection], action.id)
      if (r) r.active = !r.active
      return derive(s)
    }

    /* ---------------- 2.1 Customer Request -> auto PR ---------------- */
    case 'CR_CREATE': {
      const p = action.payload
      const cr = {
        id: uid('cr'),
        crNo: nextNo(c, 'CR'),
        date: p.date || today(),
        customerId: p.customerId,
        requiredBy: p.requiredBy || null,
        reference: p.reference || '',
        remarks: p.remarks || '',
        lines: p.lines.map((l) => ({ ...l, qty: Number(l.qty) || 0 })),
        stage: 'Requested',
      }
      s.customerRequests.unshift(cr)
      // AUTO: purchase request with identical lines
      s.purchaseRequests.unshift({
        id: uid('pr'),
        prNo: nextNo(c, 'PR'),
        date: cr.date,
        crId: cr.id,
        lines: cr.lines.map((l) => ({ itemId: l.itemId, qty: l.qty, unit: l.unit })),
        rfqSupplierIds: [],
        rfqSentAt: null,
        status: 'Open',
      })
      return derive(s)
    }
    case 'CR_UPDATE': {
      const p = action.payload
      const cr = find(s.customerRequests, p.id)
      if (!cr || cr.stage !== 'Requested') return state
      Object.assign(cr, {
        customerId: p.customerId,
        date: p.date,
        requiredBy: p.requiredBy,
        reference: p.reference,
        remarks: p.remarks,
        lines: p.lines.map((l) => ({ ...l, qty: Number(l.qty) || 0 })),
      })
      const pr = s.purchaseRequests.find((x) => x.crId === cr.id)
      if (pr) pr.lines = cr.lines.map((l) => ({ itemId: l.itemId, qty: l.qty, unit: l.unit }))
      return derive(s)
    }

    /* ---------------- 3.1 Send RFQ ---------------- */
    case 'PR_SEND_RFQ': {
      const { prId, supplierIds, subject, body } = action
      const pr = find(s.purchaseRequests, prId)
      if (!pr) return state
      pr.rfqSupplierIds = [...new Set([...(pr.rfqSupplierIds || []), ...supplierIds])]
      pr.rfqSentAt = today()
      if (pr.status === 'Open') pr.status = 'RFQ Sent'
      supplierIds.forEach((sid) => {
        const sup = find(s.suppliers, sid)
        logEmail(s, { to: sup && sup.email, subject, body, refType: 'PR', refId: pr.id })
      })
      return derive(s)
    }

    /* ---------------- 3.2 Vendor Quotation ---------------- */
    case 'VQ_SAVE': {
      const p = action.payload
      const lines = p.lines.map((l) => ({
        itemId: l.itemId,
        qty: Number(l.qty) || 0,
        rate: Number(l.rate) || 0,
        taxPct: Number(l.taxPct) || 0,
        notQuoted: !!l.notQuoted,
      }))
      const base = {
        ...p,
        lines,
        freight: Number(p.freight) || 0,
        deliveryDays: Number(p.deliveryDays) || 0,
      }
      base.grandTotal = vqTotals(base).grandTotal
      if (p.id) {
        const i = s.vendorQuotations.findIndex((x) => x.id === p.id)
        s.vendorQuotations[i] = { ...s.vendorQuotations[i], ...base }
      } else {
        s.vendorQuotations.unshift({
          ...base,
          id: uid('vq'),
          vqNo: nextNo(c, 'VQ'),
          status: 'Received',
        })
      }
      return derive(s)
    }

    /* ---------------- 3.3 Quotation Comparison ---------------- */
    case 'QC_CREATE': {
      const { prId } = action
      const pr = find(s.purchaseRequests, prId)
      const vqs = s.vendorQuotations.filter((v) => v.prId === prId)
      if (!pr || !vqs.length) return state
      const bestVqId = computeBest(vqs, pr.lines)
      let qc = s.quotationComparisons.find((q) => q.prId === prId)
      if (qc) {
        if (qc.status === 'Draft') {
          qc.vqIds = vqs.map((v) => v.id)
          qc.bestVqId = bestVqId
        }
      } else {
        qc = {
          id: uid('qc'),
          qcNo: nextNo(c, 'QC'),
          date: today(),
          prId,
          crId: pr.crId,
          vqIds: vqs.map((v) => v.id),
          bestVqId,
          selectedVqId: null,
          overrideReason: '',
          approvedAt: null,
          status: 'Draft',
        }
        s.quotationComparisons.unshift(qc)
      }
      s.lastQcId = qc.id
      return derive(s)
    }
    case 'QC_APPROVE': {
      const { qcId, selectedVqId, overrideReason } = action
      const qc = find(s.quotationComparisons, qcId)
      if (!qc) return state
      qc.selectedVqId = selectedVqId
      qc.overrideReason = overrideReason || ''
      qc.status = 'Approved'
      qc.approvedAt = today()
      qc.vqIds.forEach((vid) => {
        const vq = find(s.vendorQuotations, vid)
        if (vq) vq.status = vid === selectedVqId ? 'Selected' : 'Rejected'
      })
      const pr = find(s.purchaseRequests, qc.prId)
      if (pr) pr.status = 'Quoted'
      return derive(s)
    }

    /* ------- 3.3b Send Quotation to Customer -> auto Customer Quotation ------- */
    case 'QC_SEND_TO_CUSTOMER': {
      const { qcId, lines, validTill, subject, body } = action
      const qc = find(s.quotationComparisons, qcId)
      const pr = find(s.purchaseRequests, qc.prId)
      const cr = find(s.customerRequests, pr.crId)
      const cust = find(s.customers, cr.customerId)
      const cq = {
        id: uid('cq'),
        cqNo: nextNo(c, 'CQ'),
        date: today(),
        crId: cr.id,
        qcId: qc.id,
        customerId: cr.customerId,
        validTill: validTill || addDays(today(), 15),
        lines: lines.map((l) => ({
          itemId: l.itemId,
          qty: Number(l.qty) || 0,
          supplierRate: round2(l.supplierRate),
          customerPrice: round2(l.customerPrice),
          taxPct: Number(l.taxPct) || 0,
        })),
        status: 'Sent',
        sentAt: new Date().toISOString(),
      }
      cq.total = round2(sum(cq.lines, (l) => l.qty * l.customerPrice))
      s.customerQuotations.unshift(cq)
      qc.status = 'Sent to Customer'
      logEmail(s, { to: cust && cust.email, subject, body, refType: 'CQ', refId: cq.id })
      return derive(s)
    }
    case 'CQ_SET_STATUS': {
      const cq = find(s.customerQuotations, action.cqId)
      if (cq) cq.status = action.status
      return derive(s)
    }
    case 'CQ_RESEND': {
      const cq = find(s.customerQuotations, action.cqId)
      const cust = find(s.customers, cq.customerId)
      logEmail(s, {
        to: cust && cust.email,
        subject: action.subject,
        body: action.body,
        refType: 'CQ',
        refId: cq.id,
      })
      return derive(s)
    }

    /* ---------------- 2.3 Customer PO -> auto supplier PO ---------------- */
    case 'SO_CREATE': {
      const p = action.payload
      const cq = find(s.customerQuotations, p.cqId)
      const cr = find(s.customerRequests, cq.crId)
      const qc = find(s.quotationComparisons, cq.qcId)
      const vq = find(s.vendorQuotations, qc.selectedVqId)
      const so = {
        id: uid('so'),
        soNo: nextNo(c, 'SO'),
        date: p.date || today(),
        customerPoNo: p.customerPoNo,
        customerPoDate: p.customerPoDate,
        crId: cr.id,
        cqId: cq.id,
        customerId: cr.customerId,
        deliveryDate: p.deliveryDate || null,
        lines: p.lines.map((l) => ({
          itemId: l.itemId,
          qty: Number(l.qty) || 0,
          price: round2(l.price),
        })),
        status: 'Open',
      }
      so.total = round2(sum(so.lines, (l) => l.qty * l.price))
      s.salesOrders.unshift(so)
      cq.status = 'Accepted'
      const pr = find(s.purchaseRequests, qc.prId)
      if (pr) pr.status = 'Ordered'
      // AUTO: purchase order to the selected supplier at their quoted rates
      const po = {
        id: uid('po'),
        poNo: nextNo(c, 'PO'),
        date: today(),
        soId: so.id,
        crId: cr.id,
        vqId: vq.id,
        supplierId: vq.supplierId,
        expectedDelivery: addDays(today(), vq.deliveryDays),
        lines: so.lines.map((l) => {
          const vl = (vq.lines || []).find((x) => x.itemId === l.itemId)
          return {
            itemId: l.itemId,
            qty: l.qty,
            rate: round2(vl ? vl.rate : 0),
            taxPct: vl ? vl.taxPct : 0,
            receivedQty: 0,
          }
        }),
        status: 'Draft',
        sentAt: null,
      }
      po.total = round2(sum(po.lines, (l) => l.qty * l.rate))
      s.purchaseOrders.unshift(po)
      return derive(s)
    }

    /* ---------------- 3.4 Send PO ---------------- */
    case 'PO_SEND': {
      const po = find(s.purchaseOrders, action.poId)
      const sup = find(s.suppliers, po.supplierId)
      po.status = 'Sent'
      po.sentAt = new Date().toISOString()
      logEmail(s, {
        to: sup && sup.email,
        subject: action.subject,
        body: action.body,
        refType: 'PO',
        refId: po.id,
      })
      return derive(s)
    }

    /* ---------------- 3.5 GRN -> auto Inward ---------------- */
    case 'GRN_CREATE': {
      const p = action.payload
      const po = find(s.purchaseOrders, p.poId)
      const lines = p.lines
        .map((l) => ({
          itemId: l.itemId,
          receivedQty: Number(l.receivedQty) || 0,
          acceptedQty: Number(l.acceptedQty) || 0,
          rejectedQty: Number(l.rejectedQty) || 0,
          rate: round2(l.rate),
        }))
        .filter((l) => l.receivedQty > 0)
      if (!lines.length) return state
      const grn = {
        id: uid('grn'),
        grnNo: nextNo(c, 'GRN'),
        date: p.date || today(),
        poId: po.id,
        crId: po.crId,
        supplierId: po.supplierId,
        supplierRef: p.supplierRef || '',
        receivedBy: p.receivedBy || '',
        remarks: p.remarks || '',
        lines,
        status: 'Received',
      }
      grn.total = round2(sum(lines, (l) => l.acceptedQty * l.rate))
      s.grns.unshift(grn)
      // PO received quantities + status, and item last purchase rate
      lines.forEach((l) => {
        const pl = po.lines.find((x) => x.itemId === l.itemId)
        if (pl) pl.receivedQty = round2((pl.receivedQty || 0) + l.receivedQty)
        const item = find(s.items, l.itemId)
        if (item) item.lastPurchaseRate = l.rate
      })
      po.status = po.lines.every((l) => (l.receivedQty || 0) >= l.qty)
        ? 'Received'
        : 'Partially Received'
      // AUTO: inward, pending
      const inw = {
        id: uid('inw'),
        inwNo: nextNo(c, 'INW'),
        date: grn.date,
        grnId: grn.id,
        poId: po.id,
        crId: po.crId,
        supplierId: po.supplierId,
        lines: lines
          .filter((l) => l.acceptedQty > 0)
          .map((l) => ({ itemId: l.itemId, qty: l.acceptedQty, rate: l.rate })),
        status: 'Pending',
        addedAt: null,
      }
      inw.value = round2(sum(inw.lines, (l) => l.qty * l.rate))
      s.inwards.unshift(inw)
      return derive(s)
    }

    /* ---------------- 3.6 Add to Inventory ---------------- */
    case 'INW_ADD_TO_STOCK': {
      const inw = find(s.inwards, action.inwId)
      if (!inw || inw.status === 'Added') return state
      inw.lines.forEach((l) => {
        s.stockLedger.push({
          id: uid('stk'),
          date: inw.date,
          type: 'IN',
          itemId: l.itemId,
          crId: inw.crId,
          qty: l.qty,
          rate: l.rate,
          value: round2(l.qty * l.rate),
          refType: 'INW',
          refId: inw.id,
          partyId: inw.supplierId,
        })
      })
      inw.status = 'Added'
      inw.addedAt = new Date().toISOString()
      return derive(s)
    }

    /* ---------------- 2.4 Outward ---------------- */
    case 'OUT_CREATE': {
      const p = action.payload
      const so = find(s.salesOrders, p.soId)
      const lines = p.lines
        .map((l) => ({ itemId: l.itemId, qty: Number(l.qty) || 0, price: round2(l.price) }))
        .filter((l) => l.qty > 0)
      if (!lines.length) return state
      // Availability guard: outward can never exceed what came in for this CR
      const bad = lines.find((l) => l.qty > available(s.stockLedger, l.itemId, so.crId))
      if (bad) return state
      const out = {
        id: uid('out'),
        outNo: nextNo(c, 'OUT'),
        date: p.date || today(),
        soId: so.id,
        crId: so.crId,
        customerId: so.customerId,
        dcNo: p.dcNo || '',
        mode: p.mode || '',
        vehicle: p.vehicle || '',
        remarks: p.remarks || '',
        lines,
        status: 'Dispatched',
      }
      out.value = round2(sum(lines, (l) => l.qty * l.price))
      s.outwards.unshift(out)
      lines.forEach((l) => {
        s.stockLedger.push({
          id: uid('stk'),
          date: out.date,
          type: 'OUT',
          itemId: l.itemId,
          crId: out.crId,
          qty: l.qty,
          rate: l.price,
          value: round2(l.qty * l.price),
          refType: 'OUT',
          refId: out.id,
          partyId: out.customerId,
        })
      })
      so.status = 'Dispatched'
      return derive(s)
    }

    /* ---------------- 2.5 Sales Invoice ---------------- */
    case 'SI_CREATE': {
      const p = action.payload
      const out = find(s.outwards, p.outId)
      const so = find(s.salesOrders, out.soId)
      const lines = out.lines.map((l) => {
        const item = find(s.items, l.itemId)
        const taxable = round2(l.qty * l.price)
        const taxPct = Number(item && item.taxPct) || 0
        return {
          itemId: l.itemId,
          hsn: (item && item.hsn) || '',
          qty: l.qty,
          rate: l.price,
          taxable,
          taxPct,
          taxAmount: round2((taxable * taxPct) / 100),
          total: round2(taxable * (1 + taxPct / 100)),
        }
      })
      const si = {
        id: uid('si'),
        siNo: nextNo(c, 'SI'),
        date: p.date || today(),
        outId: out.id,
        soId: so.id,
        crId: out.crId,
        customerId: out.customerId,
        paymentTerms: p.paymentTerms || '',
        dueDate: p.dueDate || addDays(today(), 30),
        lines,
        subtotal: round2(sum(lines, (l) => l.taxable)),
        tax: round2(sum(lines, (l) => l.taxAmount)),
        status: 'Final',
      }
      si.total = round2(si.subtotal + si.tax)
      s.salesInvoices.unshift(si)
      out.status = 'Invoiced'
      so.status = 'Invoiced'
      return derive(s)
    }

    /* ---------------- 3.7 Purchase Invoice ---------------- */
    case 'PI_CREATE': {
      const p = action.payload
      const grn = find(s.grns, p.grnId)
      const po = find(s.purchaseOrders, grn.poId)
      const lines = grn.lines
        .filter((l) => l.acceptedQty > 0)
        .map((l) => {
          const item = find(s.items, l.itemId)
          const taxable = round2(l.acceptedQty * l.rate)
          const taxPct = Number(item && item.taxPct) || 0
          return {
            itemId: l.itemId,
            qty: l.acceptedQty,
            rate: l.rate,
            taxable,
            taxPct,
            taxAmount: round2((taxable * taxPct) / 100),
            total: round2(taxable * (1 + taxPct / 100)),
          }
        })
      const pi = {
        id: uid('pi'),
        piNo: nextNo(c, 'PI'),
        date: p.date || today(),
        supplierInvNo: p.supplierInvNo || '',
        supplierInvDate: p.supplierInvDate || today(),
        grnId: grn.id,
        poId: po.id,
        crId: grn.crId,
        supplierId: grn.supplierId,
        dueDate: p.dueDate || addDays(today(), 30),
        lines,
        subtotal: round2(sum(lines, (l) => l.taxable)),
        tax: round2(sum(lines, (l) => l.taxAmount)),
        status: 'Final',
      }
      pi.total = round2(pi.subtotal + pi.tax)
      s.purchaseInvoices.unshift(pi)
      grn.status = 'Invoiced'
      po.status = 'Closed'
      return derive(s)
    }

    /* ---------------- Demo data ---------------- */
    case 'RESET_DEMO':
      return derive(action.state)
    case 'CLEAR_DOCUMENTS': {
      const fresh = clone(state)
      const empty = blankState()
      return derive({
        ...empty,
        customers: fresh.customers,
        suppliers: fresh.suppliers,
        items: fresh.items,
        counters: {
          ...empty.counters,
          CUS: fresh.counters.CUS,
          SUP: fresh.counters.SUP,
          ITM: fresh.counters.ITM,
        },
      })
    }
    default:
      return state
  }
}
