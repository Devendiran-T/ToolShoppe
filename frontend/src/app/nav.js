import {
  LayoutDashboard, Users, Store, Wrench, FileText, FileCheck2, ShoppingCart,
  PackageCheck, ReceiptText, Send, GitCompareArrows, ClipboardList, PackagePlus,
  Boxes, Mail, Layers, Briefcase, Truck,
} from 'lucide-react'

/**
 * Single navigation definition — consumed by the sidebar and the breadcrumb
 * trail so the two can never disagree. `badge` names a key from
 * selectors.dashboardCounts().
 */
export const NAV = [
  { key: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    key: 'masters',
    label: 'Masters',
    index: '1',
    icon: Layers,
    children: [
      { key: '/masters/customers', label: 'Customers', icon: Users },
      { key: '/masters/suppliers', label: 'Suppliers', icon: Store },
      { key: '/masters/items', label: 'Items', icon: Wrench },
    ],
  },
  {
    key: 'sales',
    label: 'Sales',
    index: '2',
    icon: Briefcase,
    children: [
      { key: '/sales/customer-request', label: 'Customer Request', icon: FileText, badge: 'openRequests' },
      { key: '/sales/quotation', label: 'Quotation', icon: FileCheck2, badge: 'quotesOut' },
      { key: '/sales/customer-po', label: 'Purchase Order', icon: ShoppingCart },
      { key: '/sales/outward', label: 'Outward', icon: Truck, badge: 'toDispatch' },
      { key: '/sales/invoice', label: 'Invoice', icon: ReceiptText, badge: 'toInvoiceSales' },
    ],
  },
  {
    key: 'purchase',
    label: 'Purchase',
    index: '3',
    icon: ShoppingCart,
    children: [
      { key: '/purchase/request', label: 'Request (PR)', icon: ClipboardList, badge: 'awaitingRfq' },
      { key: '/purchase/vendor-quotation', label: 'Vendor Quotation', icon: Send },
      { key: '/purchase/quotation-comparison', label: 'Quotation Comparison', icon: GitCompareArrows, badge: 'toCompare' },
      { key: '/purchase/purchase-order', label: 'Purchase Order', icon: FileText, badge: 'posToSend' },
      { key: '/purchase/grn', label: 'GRN', icon: PackageCheck },
      { key: '/purchase/inward', label: 'Inward', icon: PackagePlus, badge: 'inwardPending' },
      { key: '/purchase/invoice', label: 'Invoice', icon: ReceiptText, badge: 'toInvoicePurchase' },
    ],
  },
  { key: '/inventory', label: 'Inventory', index: '4', icon: Boxes },
  { key: '/email-log', label: 'Email Log', icon: Mail },
]

/** Flat list of every routable entry. */
export const FLAT = NAV.flatMap((n) => (n.children ? n.children.map((c) => ({ ...c, parent: n })) : [{ ...n }]))

/** Longest matching nav route for the current pathname. */
export function matchNav(pathname) {
  if (pathname === '/') return FLAT.find((f) => f.key === '/')
  return FLAT.filter((f) => f.key !== '/' && pathname.startsWith(f.key)).sort(
    (a, b) => b.key.length - a.key.length
  )[0]
}

/** Breadcrumb trail: Home › Section › Screen › Document */
export function breadcrumbFor(pathname, docLabel) {
  const hit = matchNav(pathname)
  const trail = [{ label: 'Home', to: '/' }]
  if (!hit) return trail
  if (hit.key === '/') return [{ label: 'Dashboard' }]
  if (hit.parent) trail.push({ label: hit.parent.label })
  trail.push(docLabel ? { label: hit.label, to: hit.key } : { label: hit.label })
  if (docLabel) trail.push({ label: docLabel })
  return trail
}
