import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Alert } from 'antd'
import { PackagePlus, Eye, Boxes } from 'lucide-react'
import { useApp } from '../../store/AppContext.jsx'
import { supplierName, itemName, itemCode, getCR } from '../../store/selectors.js'
import { round2, sum } from '../../logic/pricing.js'
import {
  DataTable, PageHeader, StatusBadge, RefChip, Btn, IconBtn, FormModal,
  Money, Qty, fmtDate, useToast,
} from '../../components/ui/index.js'

export default function Inward() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const nav = useNavigate()
  const [confirmRow, setConfirmRow] = useState(null)

  const rows = useMemo(
    () =>
      state.inwards.map((i) => {
        const grn = state.grns.find((g) => g.id === i.grnId)
        const po = state.purchaseOrders.find((p) => p.id === i.poId)
        const cr = getCR(state, i.crId)
        return {
          ...i,
          grnNo: grn ? grn.grnNo : '—',
          poNo: po ? po.poNo : '—',
          crNo: cr ? cr.crNo : '—',
          supplier: supplierName(state, i.supplierId),
          qty: sum(i.lines, (l) => l.qty),
        }
      }),
    [state]
  )

  const pending = rows.filter((r) => r.status === 'Pending').length

  const columns = [
    { title: 'Inward No', dataIndex: 'inwNo', width: 118, sorter: true, render: (v) => <span className="doc-no">{v}</span> },
    { title: 'GRN No', dataIndex: 'grnNo', width: 114, render: (v, r) => <a className="doc-no" onClick={() => nav(`/purchase/grn/${r.grnId}`)}>{v}</a> },
    { title: 'Supplier', dataIndex: 'supplier', sorter: true, render: (v) => <span style={{ fontWeight: 550 }}>{v}</span> },
    { title: 'PO No', dataIndex: 'poNo', width: 106, render: (v, r) => <a className="doc-no" onClick={() => nav(`/purchase/purchase-order/${r.poId}`)}>{v}</a> },
    { title: 'Request No', dataIndex: 'crNo', width: 122, render: (v, r) => <RefChip onClick={() => nav(`/sales/customer-request/${r.crId}`)}>{v}</RefChip> },
    { title: 'Date', dataIndex: 'date', width: 124, sorter: true, render: fmtDate },
    { title: 'Quantity', dataIndex: 'qty', width: 112, numeric: true, sorter: true, render: (v) => <Qty value={v} /> },
    { title: 'Value', dataIndex: 'value', width: 146, numeric: true, sorter: true, render: (v) => <Money value={v} strong /> },
    { title: 'Inventory Status', dataIndex: 'status', width: 148, render: (v) => <StatusBadge status={v} /> },
    {
      title: 'Actions',
      width: 210,
      fixed: 'right',
      render: (_, r) =>
        r.status === 'Pending' ? (
          <Btn variant="primary" size="small" icon={PackagePlus} onClick={() => setConfirmRow(r)}>
            Add to Inventory
          </Btn>
        ) : (
          <span className="dim" style={{ fontSize: 12 }}>
            in stock since {fmtDate(r.addedAt ? r.addedAt.slice(0, 10) : r.date)}
          </span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Inward"
        subtitle="Created by every GRN. Adding to inventory posts the IN rows in the stock ledger, tagged with the request number."
      />

      {pending > 0 && (
        <Alert
          style={{ marginBottom: 14 }}
          type="warning"
          showIcon
          message={`${pending} inward${pending === 1 ? '' : 's'} waiting to be added to inventory. Stock is not available for dispatch until it is posted.`}
        />
      )}

      <DataTable
        columns={columns}
        data={rows}
        scrollX={1480}
        showRange
        searchKeys={['inwNo', 'grnNo', 'poNo', 'crNo', 'supplier']}
        searchPlaceholder="Search inward, GRN, PO, request…"
        filters={[
          { key: 'status', placeholder: 'Inventory status', width: 174, options: ['Pending', 'Added'].map((x) => ({ value: x, label: x })) },
          {
            key: 'supplierId',
            placeholder: 'Supplier',
            width: 226,
            showSearch: true,
            options: state.suppliers.map((c) => ({ value: c.id, label: c.name })),
          },
        ]}
        empty={{
          icon: Boxes,
          title: 'No inward records yet',
          description: 'Record a goods receipt and the inward appears here, ready to be posted to stock.',
          action: <Btn variant="primary" onClick={() => nav('/purchase/grn')}>Go to GRN</Btn>,
        }}
      />

      <FormModal
        open={!!confirmRow}
        title={confirmRow ? `Add ${confirmRow.inwNo} to inventory` : ''}
        subtitle={confirmRow ? `Posted against ${confirmRow.crNo} at the supplier rate` : ''}
        onCancel={() => setConfirmRow(null)}
        onOk={() => {
          dispatch({ type: 'INW_ADD_TO_STOCK', inwId: confirmRow.id })
          toast.success(`${confirmRow.inwNo} added to inventory — stock is now available for ${confirmRow.crNo}.`)
          setConfirmRow(null)
        }}
        okText="Add to Inventory"
        width={780}
        footerNote="Posts IN rows to the stock ledger. This cannot be undone."
      >
        {confirmRow && (
          <>
            <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
              These quantities will be posted as IN rows against <strong>{confirmRow.crNo}</strong>. They can
              then be dispatched to the customer on an outward — and only against this request.
            </p>
            <div className="tbl-card" style={{ boxShadow: 'none' }}>
              <Table
                size="small"
                pagination={false}
                rowKey="itemId"
                dataSource={confirmRow.lines}
                scroll={{ x: 620 }}
                columns={[
                  { title: 'Code', width: 106, render: (_, l) => <span className="doc-no">{itemCode(state, l.itemId)}</span> },
                  { title: 'Item', render: (_, l) => itemName(state, l.itemId) },
                  { title: 'Quantity', width: 108, align: 'right', className: 'col-num', render: (_, l) => <Qty value={l.qty} /> },
                  { title: 'Rate', width: 118, align: 'right', className: 'col-num', render: (_, l) => <Money value={l.rate} /> },
                  { title: 'Value', width: 140, align: 'right', className: 'col-num', render: (_, l) => <Money value={round2(l.qty * l.rate)} strong /> },
                ]}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right"><strong>Total inward value</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right"><Money value={confirmRow.value} strong /></Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </div>
          </>
        )}
      </FormModal>
    </div>
  )
}
