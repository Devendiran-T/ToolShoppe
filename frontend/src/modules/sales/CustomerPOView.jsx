import React from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { Table, Alert } from 'antd'
import { Truck, Building2, Link2, ShoppingCart } from 'lucide-react'
import { useStore } from '../../store/AppContext.jsx'
import { itemName, itemCode, supplierName, getCR } from '../../store/selectors.js'
import { round2 } from '../../logic/pricing.js'
import { useDocLabel } from '../../app/docLabel.jsx'
import {
  DocHeader, Card, Grid, KV, Btn, Money, Qty, StatusBadge, fmtDate,
} from '../../components/ui/index.js'

export default function CustomerPOView() {
  const { id } = useParams()
  const nav = useNavigate()
  const s = useStore()
  const so = s.salesOrders.find((x) => x.id === id)
  useDocLabel(so ? so.soNo : null)
  if (!so) return <Navigate to="/sales/customer-po" replace />

  const cr = getCR(s, so.crId)
  const cq = s.customerQuotations.find((x) => x.id === so.cqId)
  const po = s.purchaseOrders.find((x) => x.soId === so.id)
  const cust = s.customers.find((c) => c.id === so.customerId)
  const outs = s.outwards.filter((o) => o.soId === so.id)

  return (
    <div>
      <DocHeader
        title="Customer Purchase Order"
        docNo={so.soNo}
        status={so.status}
        subtitle={cust ? `${cust.name} · their PO ${so.customerPoNo}` : undefined}
        backTo="/sales/customer-po"
        actions={
          so.status === 'Open' && (
            <Btn variant="primary" icon={Truck} onClick={() => nav(`/sales/outward?so=${so.id}`)}>
              Post Outward
            </Btn>
          )
        }
      />

      <Grid min={340}>
        <Card title="Customer" icon={Building2}>
          <KV
            items={[
              ['Name', cust ? `${cust.code} — ${cust.name}` : '—'],
              ['Their PO No', <span className="doc-no">{so.customerPoNo}</span>],
              ['Their PO date', fmtDate(so.customerPoDate)],
              ['Delivery date', fmtDate(so.deliveryDate)],
              ['Shipping address', cust ? cust.shippingAddress : ''],
            ]}
          />
        </Card>

        <Card title="Order information" icon={ShoppingCart}>
          <KV
            items={[
              ['Order no', <span className="doc-no">{so.soNo}</span>],
              ['Date', fmtDate(so.date)],
              ['Order value (pre-tax)', <Money value={so.total} strong />],
              ['Status', <StatusBadge status={so.status} />],
            ]}
          />
        </Card>

        <Card title="References" icon={Link2}>
          <KV
            items={[
              ['Customer request', <a className="doc-no" onClick={() => nav(`/sales/customer-request/${so.crId}`)}>{cr ? cr.crNo : '—'}</a>],
              ['Quotation', <a className="doc-no" onClick={() => nav(`/sales/quotation/${so.cqId}`)}>{cq ? cq.cqNo : '—'}</a>],
              [
                'Supplier PO',
                po ? (
                  <span>
                    <a className="doc-no" onClick={() => nav(`/purchase/purchase-order/${po.id}`)}>{po.poNo}</a>
                    <span className="dim" style={{ marginLeft: 8 }}>{supplierName(s, po.supplierId)}</span>
                  </span>
                ) : '—',
              ],
              [
                'Outward',
                outs.length
                  ? outs.map((o) => (
                      <a key={o.id} className="doc-no" onClick={() => nav(`/sales/outward/${o.id}`)} style={{ marginRight: 10 }}>
                        {o.outNo}
                      </a>
                    ))
                  : <span className="dim">not dispatched yet</span>,
              ],
            ]}
          />
        </Card>
      </Grid>

      <Card title="Order lines" pad={false} className="card tbl-card" style={{ marginTop: 16 }}>
        <Table
          size="small"
          pagination={false}
          rowKey="itemId"
          dataSource={so.lines}
          scroll={{ x: 760 }}
          columns={[
            { title: 'S.No', width: 62, align: 'center', render: (_, __, i) => <span className="num dim">{i + 1}</span> },
            { title: 'Code', width: 108, render: (_, l) => <span className="doc-no">{itemCode(s, l.itemId)}</span> },
            { title: 'Item', render: (_, l) => itemName(s, l.itemId) },
            { title: 'Quantity', width: 108, align: 'right', className: 'col-num', render: (_, l) => <Qty value={l.qty} /> },
            { title: 'Customer price', width: 140, align: 'right', className: 'col-num', render: (_, l) => <Money value={l.price} /> },
            { title: 'Line total', width: 148, align: 'right', className: 'col-num', render: (_, l) => <Money value={round2(l.qty * l.price)} strong /> },
          ]}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5} align="right"><strong>Order total (pre-tax)</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right"><Money value={so.total} strong /></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {po && po.status === 'Draft' && (
        <Alert
          style={{ marginTop: 16 }}
          type="warning"
          showIcon
          message={`Supplier purchase order ${po.poNo} is still in draft — send it to ${supplierName(s, po.supplierId)} to start the delivery.`}
          action={<Btn size="small" variant="secondary" onClick={() => nav(`/purchase/purchase-order/${po.id}`)}>Open PO</Btn>}
        />
      )}
    </div>
  )
}
