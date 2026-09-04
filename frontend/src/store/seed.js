import { emptyCounters, nextNo, uid } from './numbering.js'

export const COLLECTIONS = [
  'customers', 'suppliers', 'items',
  'customerRequests', 'purchaseRequests', 'vendorQuotations', 'quotationComparisons',
  'customerQuotations', 'salesOrders', 'purchaseOrders', 'grns', 'inwards', 'outwards',
  'salesInvoices', 'purchaseInvoices', 'stockLedger', 'emailLog',
]

export function blankState() {
  const s = { counters: emptyCounters() }
  COLLECTIONS.forEach((k) => { s[k] = [] })
  return s
}

export const CATEGORIES = ['Cutting tools', 'Hand tools', 'Measuring', 'Abrasives']
export const UNITS = ['Nos', 'Set', 'Box', 'Kg', 'Mtr', 'Pkt']

const CUSTOMERS = [
  {
    name: 'Bharat Engineering Works',
    contactPerson: 'R. Muthukumar',
    phone: '+91 98400 11223',
    email: 'purchase@bharatengg.co.in',
    gstin: '33AABCB1234K1Z5',
    billingAddress: '14, Ambattur Industrial Estate, Chennai 600058',
    shippingAddress: 'Plant 2, Ambattur Industrial Estate, Chennai 600058',
    markupPct: 12,
    paymentTerms: '30 days from invoice',
  },
  {
    name: 'Sundaram Auto Components',
    contactPerson: 'K. Lakshmi',
    phone: '+91 98410 44556',
    email: 'stores@sundaramauto.com',
    gstin: '33AACCS7788M1ZP',
    billingAddress: '92, Sipcot Industrial Park, Irungattukottai 602117',
    shippingAddress: '92, Sipcot Industrial Park, Irungattukottai 602117',
    markupPct: 15,
    paymentTerms: '45 days from invoice',
  },
  {
    name: 'Kaveri Fabrication Pvt Ltd',
    contactPerson: 'S. Arun Prasad',
    phone: '+91 99620 77889',
    email: 'arun@kaverifab.in',
    gstin: '33AAECK5566L1ZQ',
    billingAddress: '7/3, Thirumudivakkam Industrial Estate, Chennai 600044',
    shippingAddress: '7/3, Thirumudivakkam Industrial Estate, Chennai 600044',
    markupPct: 20,
    paymentTerms: 'Advance 50%, balance on delivery',
  },
]

const SUPPLIERS = [
  {
    name: 'Sri Venkateswara Tools',
    contactPerson: 'V. Rajesh',
    phone: '+91 94440 12345',
    email: 'sales@svtools.in',
    gstin: '33AAFFS1122H1Z8',
    address: '22, Nethaji Subhash Chandra Bose Road, Chennai 600079',
    categories: ['Cutting tools', 'Hand tools'],
    leadTimeDays: 5,
  },
  {
    name: 'Ganesh Industrial Supplies',
    contactPerson: 'M. Ganesan',
    phone: '+91 93810 55667',
    email: 'orders@ganeshindustrial.com',
    gstin: '33AAGFG9988P1ZR',
    address: '5, Erabalu Chetty Street, Parrys, Chennai 600001',
    categories: ['Cutting tools', 'Measuring', 'Abrasives'],
    leadTimeDays: 7,
  },
  {
    name: 'Metro Hardware & Abrasives',
    contactPerson: 'D. Nirmala',
    phone: '+91 90030 33445',
    email: 'metro.hardware@gmail.com',
    gstin: '33AAHFM4455J1ZT',
    address: '18, Govindappa Naicken Street, Chennai 600001',
    categories: ['Hand tools', 'Abrasives'],
    leadTimeDays: 4,
  },
  {
    name: 'Precision Metrology Agencies',
    contactPerson: 'A. Suresh Babu',
    phone: '+91 98844 66778',
    email: 'quotes@precisionmetrology.co.in',
    gstin: '33AAJFP2233N1ZV',
    address: '41, Anna Salai, Guindy, Chennai 600032',
    categories: ['Measuring', 'Cutting tools'],
    leadTimeDays: 10,
  },
]

const ITEMS = [
  ['HSS Drill Bit Set 1-13mm', 'Jobber length, 25 pieces, ground finish', 'Cutting tools', 'Addison', 'Set', '82075010', 18, 1150],
  ['Carbide End Mill 10mm 4-Flute', 'Solid carbide, TiAlN coated', 'Cutting tools', 'Widia', 'Nos', '82075090', 18, 980],
  ['Tap & Die Set M3-M12', '32 piece set in steel case', 'Cutting tools', 'Totem', 'Set', '82076010', 18, 2250],
  ['Adjustable Wrench 300mm', 'Chrome vanadium, 12 inch', 'Hand tools', 'Taparia', 'Nos', '82040000', 18, 615],
  ['Combination Plier 200mm', 'Insulated 1000V, 8 inch', 'Hand tools', 'Taparia', 'Nos', '82032000', 18, 385],
  ['Screwdriver Set 12pc', 'Slotted and Phillips, magnetic tip', 'Hand tools', 'Stanley', 'Set', '82054000', 18, 720],
  ['Digital Vernier Caliper 150mm', 'Resolution 0.01mm, IP54', 'Measuring', 'Mitutoyo', 'Nos', '90172000', 18, 2380],
  ['Outside Micrometer 0-25mm', 'Ratchet stop, carbide anvil', 'Measuring', 'Mitutoyo', 'Nos', '90172000', 18, 1850],
  ['Steel Rule 300mm', 'Stainless, dual marking mm/inch', 'Measuring', 'Freemans', 'Nos', '90178000', 12, 145],
  ['Flap Disc 100mm A60', 'Zirconia, pack of 10', 'Abrasives', 'Cumi', 'Box', '68042210', 18, 295],
  ['Cut-off Wheel 4in 1.2mm', 'Pack of 50, for stainless', 'Abrasives', 'Cumi', 'Box', '68042290', 18, 640],
  ['Emery Sheet 320 Grit', 'Waterproof, pack of 100', 'Abrasives', 'Sia', 'Box', '68053000', 12, 480],
]

/** Masters only — documents are produced by replaying reducer actions (seedRunner). */
export function seedMasters() {
  const s = blankState()
  CUSTOMERS.forEach((c) => {
    s.customers.push({ ...c, id: uid('cus'), code: nextNo(s.counters, 'CUS'), active: true })
  })
  SUPPLIERS.forEach((c) => {
    s.suppliers.push({ ...c, id: uid('sup'), code: nextNo(s.counters, 'SUP'), active: true })
  })
  ITEMS.forEach(([name, description, category, brand, unit, hsn, taxPct, lastPurchaseRate]) => {
    s.items.push({
      id: uid('itm'),
      code: nextNo(s.counters, 'ITM'),
      name, description, category, brand, unit, hsn, taxPct, lastPurchaseRate,
      active: true,
    })
  })
  return s
}
