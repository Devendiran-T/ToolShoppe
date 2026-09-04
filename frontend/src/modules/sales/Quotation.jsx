import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, FileCheck2, GitCompareArrows } from 'lucide-react'
import { useStore } from '../../store/AppContext.jsx'
import { customerName, getCR } from '../../store/selectors.js'
import {
  DataTable, PageHeader, StatusBadge, RefChip, IconBtn, RowActions, Money, Btn, fmtDate,
} from '../../components/ui/index.js'

export default function Quotation() {
  const s = useStore()
  const nav = useNavigate()

  const rows = useMemo(
    () =>
      s.customerQuotations.map((q) => {
        const cr = getCR(s, q.crId)
        const qc = s.quotationComparisons.find((x) => x.id === q.qcId)
        return {
          ...q,
          crNo: cr ? cr.crNo : '—',
          qcNo: qc ? qc.qcNo : '—',
          customer: customerName(s, q.customerId),
        }
      }),
    [s]
  )

  const columns = [
    {
      title: 'Quotation No',
      dataIndex: 'cqNo',
      width: 124,
      sorter: true,
      render: (v, r) => <a className="doc-no" onClick={() => nav(`/sales/quotation/${r.id}`)}>{v}</a>,
    },
    { title: 'Date', dataIndex: 'date', width: 126, sorter: true, render: fmtDate },
    { title: 'Customer', dataIndex: 'customer', sorter: true, render: (v) => <span style={{ fontWeight: 550 }}>{v}</span> },
    {
      title: 'Request No',
      dataIndex: 'crNo',
      width: 122,
      render: (v, r) => <RefChip onClick={() => nav(`/sales/customer-request/${r.crId}`)}>{v}</RefChip>,
    },
    {
      title: 'Comparison',
      dataIndex: 'qcNo',
      width: 118,
      render: (v, r) => <a className="doc-no" onClick={() => nav(`/purchase/quotation-comparison/${r.qcId}`)}>{v}</a>,
    },
    { title: 'Amount', dataIndex: 'total', width: 146, numeric: true, sorter: true, render: (v) => <Money value={v} strong /> },
    { title: 'Valid till', dataIndex: 'validTill', width: 126, render: fmtDate },
    { title: 'Status', dataIndex: 'status', width: 124, render: (v) => <StatusBadge status={v} /> },
    {
      title: 'Actions',
      width: 78,
      fixed: 'right',
      render: (_, r) => (
        <RowActions>
          <IconBtn icon={Eye} label="View quotation" onClick={() => nav(`/sales/quotation/${r.id}`)} />
        </RowActions>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Quotation"
        subtitle="Raised by the system when an approved comparison is sent to the customer, at the marked-up prices."
      />
      <DataTable
        columns={columns}
        data={rows}
        scrollX={1240}
        showRange
        searchKeys={['cqNo', 'crNo', 'qcNo', 'customer']}
        searchPlaceholder="Search quotation, request, customer…"
        filters={[
          {
            key: 'status',
            placeholder: 'Status',
            width: 158,
            options: ['Sent', 'Accepted', 'Rejected', 'Expired'].map((x) => ({ value: x, label: x })),
          },
          {
            key: 'customerId',
            placeholder: 'Customer',
            width: 220,
            showSearch: true,
            options: s.customers.map((c) => ({ value: c.id, label: c.name })),
          },
        ]}
        empty={{
          icon: FileCheck2,
          title: 'No customer quotations yet',
          description: 'Approve a quotation comparison and send it to the customer — the quotation is created for you.',
          action: (
            <Btn variant="primary" icon={GitCompareArrows} onClick={() => nav('/purchase/quotation-comparison')}>
              Go to Quotation Comparison
            </Btn>
          ),
        }}
      />
    </div>
  )
}
