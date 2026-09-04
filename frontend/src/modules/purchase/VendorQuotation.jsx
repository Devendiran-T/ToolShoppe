import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Eye, GitCompareArrows, Send } from 'lucide-react'
import { useApp } from '../../store/AppContext.jsx'
import { supplierName, getCR } from '../../store/selectors.js'
import {
  DataTable, PageHeader, StatusBadge, RefChip, Btn, IconBtn, RowActions, Money, fmtDate,
} from '../../components/ui/index.js'

export default function VendorQuotation() {
  const { state, dispatch } = useApp()
  const nav = useNavigate()
  const [pendingCompare, setPendingCompare] = useState(null)

  useEffect(() => {
    if (!pendingCompare) return
    const qc = state.quotationComparisons.find((q) => q.prId === pendingCompare)
    if (qc) {
      setPendingCompare(null)
      nav(`/purchase/quotation-comparison/${qc.id}`)
    }
  }, [pendingCompare, state.quotationComparisons, nav])

  const rows = useMemo(
    () =>
      state.vendorQuotations.map((v) => {
        const pr = state.purchaseRequests.find((p) => p.id === v.prId)
        const cr = pr ? getCR(state, pr.crId) : null
        return {
          ...v,
          prNo: pr ? pr.prNo : '—',
          crNo: cr ? cr.crNo : '—',
          crId: cr ? cr.id : null,
          supplier: supplierName(state, v.supplierId),
          siblings: state.vendorQuotations.filter((x) => x.prId === v.prId).length,
          prStatus: pr ? pr.status : '',
        }
      }),
    [state]
  )

  const columns = [
    {
      title: 'Quotation No',
      dataIndex: 'vqNo',
      width: 128,
      sorter: true,
      render: (v, r) => <a className="doc-no" onClick={() => nav(`/purchase/vendor-quotation/${r.id}`)}>{v}</a>,
    },
    { title: 'PR No', dataIndex: 'prNo', width: 106, render: (v, r) => <a className="doc-no" onClick={() => nav(`/purchase/request/${r.prId}`)}>{v}</a> },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      sorter: true,
      render: (v, r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 550 }}>{v}</div>
          {r.quoteRef && <div className="dim" style={{ fontSize: 11.5 }}>Ref {r.quoteRef}</div>}
        </div>
      ),
    },
    { title: 'Request No', dataIndex: 'crNo', width: 122, render: (v, r) => <RefChip onClick={() => r.crId && nav(`/sales/customer-request/${r.crId}`)}>{v}</RefChip> },
    { title: 'Date', dataIndex: 'quoteDate', width: 124, sorter: true, render: fmtDate },
    { title: 'Amount', dataIndex: 'grandTotal', width: 150, numeric: true, sorter: true, render: (v) => <Money value={v} strong /> },
    { title: 'Delivery', dataIndex: 'deliveryDays', width: 106, numeric: true, sorter: true, render: (v) => <span className="num">{v} days</span> },
    { title: 'Status', dataIndex: 'status', width: 118, render: (v) => <StatusBadge status={v} /> },
    {
      title: 'Actions',
      width: 176,
      fixed: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <IconBtn
            icon={r.status === 'Received' ? Pencil : Eye}
            label={r.status === 'Received' ? 'Edit quotation' : 'View quotation'}
            onClick={() => nav(`/purchase/vendor-quotation/${r.id}`)}
          />
          {r.siblings >= 1 && r.prStatus !== 'Ordered' && (
            <Btn
              variant="outline"
              size="small"
              icon={GitCompareArrows}
              onClick={() => {
                dispatch({ type: 'QC_CREATE', prId: r.prId })
                setPendingCompare(r.prId)
              }}
            >
              Compare
            </Btn>
          )}
        </div>
      ),
    },
  ]

  const newBtn = (
    <Btn variant="primary" icon={Plus} onClick={() => nav('/purchase/vendor-quotation/new')}>
      New Quotation
    </Btn>
  )

  return (
    <div>
      <PageHeader
        title="Vendor Quotation"
        subtitle="Key in what each supplier quoted against a purchase request. Two or more quotations unlock the comparison."
        actions={newBtn}
      />
      <DataTable
        columns={columns}
        data={rows}
        scrollX={1400}
        showRange
        rangeKey="quoteDate"
        searchKeys={['vqNo', 'prNo', 'crNo', 'supplier', 'quoteRef']}
        searchPlaceholder="Search quotation, PR, supplier…"
        filters={[
          { key: 'status', placeholder: 'Status', width: 152, options: ['Received', 'Selected', 'Rejected'].map((x) => ({ value: x, label: x })) },
          {
            key: 'supplierId',
            placeholder: 'Supplier',
            width: 226,
            showSearch: true,
            options: state.suppliers.map((c) => ({ value: c.id, label: c.name })),
          },
        ]}
        empty={{
          icon: Send,
          title: 'No vendor quotations yet',
          description: 'Send an RFQ first, then record each supplier reply here as it comes in.',
          action: newBtn,
        }}
      />
    </div>
  )
}
