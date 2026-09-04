import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tooltip as ATooltip } from 'antd'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, AreaChart, Area, Cell,
} from 'recharts'
import dayjs from 'dayjs'
import {
  FileText, ClipboardList, Send, FileCheck2, ShoppingCart, PackageCheck, Boxes,
  IndianRupee, Plus, UserPlus, Store, Wrench, PackagePlus, TrendingUp, ArrowRight,
  GitCompareArrows, Truck, ReceiptText, CircleAlert, Activity,
} from 'lucide-react'

import { useStore } from '../store/AppContext.jsx'
import { dashboardCounts, customerName, itemName } from '../store/selectors.js'
import { crMargin, stockSummary } from '../logic/stock.js'
import { round2, sum } from '../logic/pricing.js'
import { CR_STAGES } from '../store/reducer.js'
import { color, TONE } from '../theme/tokens.js'
import {
  Card, KpiCard, StatusBadge, Money, Grid, EmptyState, Btn, RefChip, nf,
} from '../components/ui/index.js'
import { fmtDate } from '../components/ui/DateField.jsx'



/* Twelve chain steps, each mapped to the documents that prove it happened. */
const WORKFLOW = [
  { n: '01', title: 'Customer Request', to: '/sales/customer-request', tone: 'neutral', count: (s) => s.customerRequests.length },
  { n: '02', title: 'Purchase Request', to: '/purchase/request', tone: 'info', count: (s) => s.purchaseRequests.length },
  { n: '03', title: 'Vendor Quotation', to: '/purchase/vendor-quotation', tone: 'info', count: (s) => s.vendorQuotations.length },
  { n: '04', title: 'Comparison', to: '/purchase/quotation-comparison', tone: 'violet', count: (s) => s.quotationComparisons.length },
  { n: '05', title: 'Customer Quotation', to: '/sales/quotation', tone: 'violet', count: (s) => s.customerQuotations.length },
  { n: '06', title: 'Customer PO', to: '/sales/customer-po', tone: 'primary', count: (s) => s.salesOrders.length },
  { n: '07', title: 'Supplier PO', to: '/purchase/purchase-order', tone: 'primary', count: (s) => s.purchaseOrders.length },
  { n: '08', title: 'GRN', to: '/purchase/grn', tone: 'warning', count: (s) => s.grns.length },
  { n: '09', title: 'Inward', to: '/purchase/inward', tone: 'warning', count: (s) => s.inwards.length },
  { n: '10', title: 'Outward', to: '/sales/outward', tone: 'teal', count: (s) => s.outwards.length },
  { n: '11', title: 'Sales Invoice', to: '/sales/invoice', tone: 'success', count: (s) => s.salesInvoices.length },
  { n: '12', title: 'Purchase Invoice', to: '/purchase/invoice', tone: 'success', count: (s) => s.purchaseInvoices.length },
]

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const s = useStore()
  const nav = useNavigate()
  const [months, setMonths] = useState(6)
  const c = dashboardCounts(s)

  /* ------------------------------- KPI figures ------------------------------ */
  const stock = useMemo(() => stockSummary(s.stockLedger, s.items), [s.stockLedger, s.items])
  const stockValue = round2(sum(stock, (r) => r.stockValue))
  const salesRevenue = round2(sum(s.salesInvoices, (i) => i.total))
  const purchaseValue = round2(sum(s.purchaseInvoices, (i) => i.total))
  const openCrs = s.customerRequests.filter((x) => x.stage !== 'Completed')

  /* --------------------------- period-scoped series ------------------------- */
  const series = useMemo(() => {
    const buckets = []
    for (let i = months - 1; i >= 0; i -= 1) {
      const m = dayjs().subtract(i, 'month')
      buckets.push({ key: m.format('YYYY-MM'), label: m.format('MMM'), sales: 0, purchase: 0, inward: 0, outward: 0 })
    }
    const find = (d) => buckets.find((b) => b.key === dayjs(d).format('YYYY-MM'))
    s.salesInvoices.forEach((i) => {
      const b = find(i.date)
      if (b) b.sales = round2(b.sales + i.total)
    })
    s.purchaseInvoices.forEach((i) => {
      const b = find(i.date)
      if (b) b.purchase = round2(b.purchase + i.total)
    })
    s.stockLedger.forEach((r) => {
      const b = find(r.date)
      if (!b) return
      if (r.type === 'IN') b.inward = round2(b.inward + r.value)
      else b.outward = round2(b.outward + r.value)
    })
    return buckets
  }, [s, months])

  const hasSeries = series.some((b) => b.sales || b.purchase || b.inward || b.outward)

  /* ------------------------- pending by workflow stage ---------------------- */
  const pendingByStage = useMemo(
    () =>
      [
        { stage: 'Awaiting RFQ', n: c.awaitingRfq, fill: TONE.neutral.dot },
        { stage: 'Awaiting quotes', n: c.awaitingQuotes, fill: TONE.info.dot },
        { stage: 'To compare', n: c.toCompare, fill: TONE.violet.dot },
        { stage: 'With customer', n: c.quotesOut, fill: TONE.primary.dot },
        { stage: 'PO to send', n: c.posToSend, fill: TONE.primary.dot },
        { stage: 'Awaiting goods', n: c.awaitingGoods, fill: TONE.warning.dot },
        { stage: 'To add to stock', n: c.inwardPending, fill: TONE.warning.dot },
        { stage: 'To dispatch', n: c.toDispatch, fill: TONE.teal.dot },
        { stage: 'To invoice', n: c.toInvoiceSales + c.toInvoicePurchase, fill: TONE.success.dot },
      ].filter((r) => r.n > 0),
    [c]
  )

  /* ------------------------------- top items -------------------------------- */
  const topItems = useMemo(() => {
    const by = {}
    s.stockLedger
      .filter((r) => r.type === 'OUT')
      .forEach((r) => {
        by[r.itemId] = by[r.itemId] || { itemId: r.itemId, qty: 0, value: 0 }
        by[r.itemId].qty = round2(by[r.itemId].qty + r.qty)
        by[r.itemId].value = round2(by[r.itemId].value + r.value)
      })
    return Object.values(by)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((r) => ({ ...r, name: itemName(s, r.itemId) }))
  }, [s])



  const money = (v) => `₹ ${nf(v, 0)}`

  return (
    <div>
      {/* ------------------------------- header ------------------------------- */}
      <div className="ph">
        <div>
          <h1 className="page-title">
            {greeting()}, Demo User
          </h1>
          <div className="page-sub">
            Toolsphoppe overview — {fmtDate(dayjs().format('YYYY-MM-DD'))} · {openCrs.length} order
            {openCrs.length === 1 ? '' : 's'} moving through the chain.
          </div>
        </div>
      </div>

      {/* --------------------------------- KPIs ------------------------------- */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard
          label="Customer Requests"
          value={s.customerRequests.length}
          icon={FileText}
          tone="primary"
          hint={`${openCrs.length} still open`}
          onClick={() => nav('/sales/customer-request')}
        />
        <KpiCard
          label="Pending Purchase Requests"
          value={c.awaitingRfq}
          icon={ClipboardList}
          tone={c.awaitingRfq ? 'warning' : 'neutral'}
          hint="awaiting RFQ"
          onClick={() => nav('/purchase/request')}
        />
        <KpiCard
          label="Vendor Quotations"
          value={s.vendorQuotations.length}
          icon={Send}
          tone="info"
          hint={`${c.toCompare} ready to compare`}
          onClick={() => nav('/purchase/vendor-quotation')}
        />
        <KpiCard
          label="Pending Customer Quotations"
          value={c.quotesOut}
          icon={FileCheck2}
          tone={c.quotesOut ? 'violet' : 'neutral'}
          hint="awaiting customer response"
          onClick={() => nav('/sales/quotation')}
        />
        <KpiCard
          label="Purchase Orders"
          value={s.purchaseOrders.length}
          icon={ShoppingCart}
          tone="primary"
          hint={`${c.posToSend} to send`}
          onClick={() => nav('/purchase/purchase-order')}
        />
        <KpiCard
          label="Pending GRNs"
          value={c.awaitingGoods}
          icon={PackageCheck}
          tone={c.awaitingGoods ? 'warning' : 'neutral'}
          hint="orders awaiting delivery"
          onClick={() => nav('/purchase/grn')}
        />
        <KpiCard
          label="Current Stock Value"
          value={money(stockValue)}
          icon={Boxes}
          tone={stockValue > 0 ? 'teal' : 'neutral'}
          hint={`${stock.filter((r) => r.onHand > 0).length} item(s) on hand`}
          onClick={() => nav('/inventory')}
        />
        <KpiCard
          label="Sales Revenue"
          value={money(salesRevenue)}
          icon={IndianRupee}
          tone="success"
          hint={`purchase ${money(purchaseValue)}`}
          onClick={() => nav('/sales/invoice')}
        />
      </div>

      {/* ------------------------------ workflow ------------------------------ */}
      <Card
        title="Order workflow"
        subtitle="Every document in the chain carries the customer request number it belongs to."
        icon={Activity}
        pad={false}
      >
        <div style={{ padding: '14px 20px 6px' }}>
          <div className="wf-track">
            {WORKFLOW.map((w) => {
              const n = w.count(s)
              const t = TONE[w.tone]
              return (
                <div
                  key={w.n}
                  className={`wf-step${n > 0 ? ' is-hot' : ''}`}
                  style={{ '--wf-accent': t.dot, '--wf-bg': t.bg, cursor: 'pointer' }}
                  onClick={() => nav(w.to)}
                >
                  <div className="wf-n">{w.n}</div>
                  <div className="wf-t">{w.title}</div>
                  <div className="wf-c">{n}</div>
                  <div className="wf-h">document{n === 1 ? '' : 's'}</div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* -------------------------------- charts ------------------------------ */}
      <Grid min={420} style={{ marginTop: 16 }}>
        <Card title="Sales vs Purchase" subtitle={`Invoiced value, last ${months} months`} icon={TrendingUp}>
          {hasSeries ? (
            <ResponsiveContainer width="100%" height={252}>
              <BarChart data={series} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barGap={5}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: color.textSecondary }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: color.textMuted }}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(79,70,229,0.05)' }}
                  contentStyle={tooltipStyle}
                  formatter={(v, k) => [`₹ ${nf(v)}`, k === 'sales' ? 'Sales' : 'Purchase']}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} formatter={(v) => (v === 'sales' ? 'Sales' : 'Purchase')} />
                <Bar dataKey="sales" fill={color.primary} radius={[4, 4, 0, 0]} maxBarSize={34} />
                <Bar dataKey="purchase" fill={color.accentTeal} radius={[4, 4, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState compact icon={TrendingUp} title="No invoiced value yet" description="Raise a sales or purchase invoice and the trend appears here." />
          )}
        </Card>

        <Card title="Inventory movement" subtitle="Inward vs outward value from the stock ledger" icon={Boxes}>
          {hasSeries ? (
            <ResponsiveContainer width="100%" height={252}>
              <AreaChart data={series} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color.accentBlue} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={color.accentBlue} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color.warning} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={color.warning} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: color.textSecondary }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: color.textMuted }}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, k) => [`₹ ${nf(v)}`, k === 'inward' ? 'Inward' : 'Outward']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} formatter={(v) => (v === 'inward' ? 'Inward' : 'Outward')} />
                <Area type="monotone" dataKey="inward" stroke={color.accentBlue} strokeWidth={2} fill="url(#gIn)" />
                <Area type="monotone" dataKey="outward" stroke={color.warning} strokeWidth={2} fill="url(#gOut)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState compact icon={Boxes} title="No stock movement yet" description="Add an inward to inventory to start the ledger." />
          )}
        </Card>
      </Grid>

      <Grid min={420} style={{ marginTop: 16 }}>
        <Card title="Pending by workflow stage" subtitle="Where work is waiting right now" icon={ClipboardList}>
          {pendingByStage.length ? (
            <ResponsiveContainer width="100%" height={Math.max(200, pendingByStage.length * 32)}>
              <BarChart data={pendingByStage} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2F7" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: color.textMuted }} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  width={128}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: color.textSecondary }}
                />
                <Tooltip cursor={{ fill: 'rgba(79,70,229,0.05)' }} contentStyle={tooltipStyle} formatter={(v) => [v, 'Pending']} />
                <Bar dataKey="n" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {pendingByStage.map((r) => (
                    <Cell key={r.stage} fill={r.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState compact icon={ClipboardList} title="Nothing pending" description="Every order in the system has reached its next milestone." />
          )}
        </Card>

        <Card title="Top items dispatched" subtitle="By outward value" icon={Boxes}>
          {topItems.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {topItems.map((r, i) => {
                const max = topItems[0].value || 1
                return (
                  <div key={r.itemId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, marginBottom: 5 }}>
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span className="dim num" style={{ marginRight: 8 }}>{i + 1}</span>
                        {r.name}
                      </span>
                      <span style={{ flex: 'none' }}>
                        <Money value={r.value} strong />
                      </span>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.max(4, (r.value / max) * 100)}%`,
                          height: '100%',
                          borderRadius: 4,
                          background: `linear-gradient(90deg, ${color.primary}, ${color.accentBlue})`,
                        }}
                      />
                    </div>
                    <div className="dim" style={{ fontSize: 11.5, marginTop: 3 }}>{nf(r.qty, 2)} dispatched</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState compact icon={Boxes} title="Nothing dispatched yet" description="Outward movements will rank here by value." />
          )}
        </Card>
      </Grid>



      {/* -------------------------- orders in progress ------------------------ */}
      <Card
        title="Orders in progress"
        subtitle="Live position of every customer request that has not been fully invoiced"
        icon={Activity}
        pad={false}
        extra={
          <Btn variant="text" size="small" icon={ArrowRight} onClick={() => nav('/sales/customer-request')}>
            View all
          </Btn>
        }
        className="card"
        style={{ marginTop: 16 }}
      >
        {openCrs.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ background: 'var(--c-surface-alt)' }}>
                  {['CR No', 'Customer', 'Required by', 'Stage', 'Progress', 'Margin'].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        textAlign: i >= 5 ? 'right' : 'left',
                        padding: '11px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#475569',
                        borderBottom: '1px solid var(--c-border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openCrs.slice(0, 6).map((cr) => {
                  const pct = Math.round(((CR_STAGES.indexOf(cr.stage) + 1) / CR_STAGES.length) * 100)
                  const m = crMargin(s.stockLedger, cr.id)
                  return (
                    <tr
                      key={cr.id}
                      onClick={() => nav(`/sales/customer-request/${cr.id}`)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}
                    >
                      <td style={{ padding: '13px 16px' }}>
                        <RefChip>{cr.crNo}</RefChip>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13 }}>{customerName(s, cr.customerId)}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13 }} className="muted">{fmtDate(cr.requiredBy)}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <StatusBadge status={cr.stage} />
                      </td>
                      <td style={{ padding: '13px 16px', minWidth: 150 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden', minWidth: 70 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color.primary, borderRadius: 3 }} />
                          </div>
                          <span className="num dim" style={{ fontSize: 12 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                        {m.salesValue || m.purchaseValue ? (
                          <Money value={m.margin} tone={m.margin >= 0 ? 'pos' : 'neg'} strong />
                        ) : (
                          <span className="dim">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No orders in progress"
            description="Every customer request has been completed. Create a new request to start the chain."
            action={<Btn variant="primary" icon={Plus} onClick={() => nav('/sales/customer-request')}>New Customer Request</Btn>}
          />
        )}
      </Card>
    </div>
  )
}

const tooltipStyle = {
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
  fontSize: 12,
  padding: '8px 12px',
}
const legendStyle = { fontSize: 12, paddingTop: 6 }
