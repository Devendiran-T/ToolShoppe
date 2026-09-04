import React from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { Table } from 'antd'
import { Building2, Link2, ReceiptText } from 'lucide-react'
import { useStore } from '../../store/AppContext.jsx'
import { itemName, itemCode, getCR } from '../../store/selectors.js'
import { useDocLabel } from '../../app/docLabel.jsx'
import { DocHeader, Card, Grid, KV, Money, Qty, Pct, fmtDate } from '../../components/ui/index.js'

export default function SalesInvoiceView() {
  const { id } = useParams()
  const nav = useNavigate()
  const s = useStore()
  const si = s.salesInvoices.find((x) => x.id === id)
  useDocLabel(si ? si.siNo : null)
  if (!si) return <Navigate to="/sales/invoice" replace />

  const cust = s.customers.find((c) => c.id === si.customerId)
  const so = s.salesOrders.find((x) => x.id === si.soId)
  const out = s.outwards.find((x) => x.id === si.outId)
  const cr = getCR(s, si.crId)

  return (
    <div>
      <DocHeader
        title="Sales Invoice"
        docNo={si.siNo}
        status={si.status}
        subtitle={cust ? `${cust.name} · due ${fmtDate(si.dueDate)}` : undefined}
        backTo="/sales/invoice"
      />

      <Grid min={340}>
        <Card title="Bill to" icon={Building2}>
          <KV
            items={[
              ['Customer', cust ? cust.name : '—'],
              ['Address', cust ? cust.billingAddress : ''],
              ['GSTIN', cust ? cust.gstin : ''],
              ['Contact', cust ? `${cust.contactPerson} · ${cust.phone}` : ''],
            ]}
          />
        </Card>

        <Card title="Invoice information" icon={ReceiptText}>
          <KV
            items={[
              ['Invoice no', <span className="doc-no">{si.siNo}</span>],
              ['Invoice date', fmtDate(si.date)],
              ['Payment terms', si.paymentTerms],
              ['Due date', fmtDate(si.dueDate)],
            ]}
          />
        </Card>

        <Card title="References" icon={Link2}>
          <KV
            items={[
              [
                'Customer PO',
                <a className="doc-no" onClick={() => nav(`/sales/customer-po/${si.soId}`)}>
                  {so ? `${so.soNo} (${so.customerPoNo})` : '—'}
                </a>,
              ],
              [
                'Outward',
                <a className="doc-no" onClick={() => nav(`/sales/outward/${si.outId}`)}>
                  {out ? `${out.outNo} — DC ${out.dcNo}` : '—'}
                </a>,
              ],
              ['Customer request', <a className="doc-no" onClick={() => nav(`/sales/customer-request/${si.crId}`)}>{cr ? cr.crNo : '—'}</a>],
            ]}
          />
        </Card>
      </Grid>

      <Card title="Invoice lines" pad={false} className="card tbl-card" style={{ marginTop: 16 }}>
        <Table
          size="small"
          pagination={false}
          rowKey="itemId"
          dataSource={si.lines}
          scroll={{ x: 1020 }}
          columns={[
            { title: 'S.No', width: 62, align: 'center', render: (_, __, i) => <span className="num dim">{i + 1}</span> },
            { title: 'Code', width: 106, render: (_, l) => <span className="doc-no">{itemCode(s, l.itemId)}</span> },
            { title: 'Item', render: (_, l) => itemName(s, l.itemId) },
            { title: 'HSN', width: 102, dataIndex: 'hsn', render: (v) => <span className="num muted">{v}</span> },
            { title: 'Qty', width: 92, align: 'right', className: 'col-num', render: (_, l) => <Qty value={l.qty} /> },
            { title: 'Rate', width: 116, align: 'right', className: 'col-num', render: (_, l) => <Money value={l.rate} /> },
            { title: 'Taxable', width: 128, align: 'right', className: 'col-num', render: (_, l) => <Money value={l.taxable} /> },
            { title: 'Tax %', width: 88, align: 'right', className: 'col-num', render: (_, l) => <Pct value={l.taxPct} /> },
            { title: 'Tax amount', width: 124, align: 'right', className: 'col-num', render: (_, l) => <Money value={l.taxAmount} muted /> },
            { title: 'Total', width: 140, align: 'right', className: 'col-num', render: (_, l) => <Money value={l.total} strong /> },
          ]}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={9} align="right">Taxable value</Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right"><Money value={si.subtotal} /></Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={9} align="right">GST</Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right"><Money value={si.tax} /></Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={9} align="right"><strong>Invoice total</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right"><Money value={si.total} strong /></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        <div className="card-pad" style={{ paddingTop: 12 }}>
          <div className="fld-help">
            GST is applied as a single item-level percentage in this prototype. A CGST/SGST/IGST split can
            be added without changing anything upstream in the chain.
          </div>
        </div>
      </Card>
    </div>
  )
}
