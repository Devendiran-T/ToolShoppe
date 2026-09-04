import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Select, Input, InputNumber, Row, Col, Table, Alert } from 'antd'
import { Plus, Eye, PackageCheck } from 'lucide-react'
import { useApp } from '../../store/AppContext.jsx'
import { supplierName, itemName, itemCode, getCR } from '../../store/selectors.js'
import { round2, sum } from '../../logic/pricing.js'
import { today } from '../../store/reducer.js'
import {
  DataTable, PageHeader, StatusBadge, RefChip, Btn, IconBtn, RowActions, FormModal,
  Field, FormSection, Money, Qty, DateField, fmtDate, useToast,
} from '../../components/ui/index.js'

export default function GRN() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [draft, setDraft] = useState(null)

  const openPos = useMemo(
    () => state.purchaseOrders.filter((p) => p.status === 'Sent' || p.status === 'Partially Received'),
    [state]
  )

  const startFor = (poId) => {
    const po = state.purchaseOrders.find((p) => p.id === poId)
    if (!po) return
    setDraft({
      poId,
      date: today(),
      supplierRef: '',
      receivedBy: '',
      remarks: '',
      lines: po.lines.map((l) => {
        const balance = round2(l.qty - (l.receivedQty || 0))
        return {
          itemId: l.itemId,
          orderedQty: l.qty,
          alreadyReceived: l.receivedQty || 0,
          receivedQty: balance,
          acceptedQty: balance,
          rejectedQty: 0,
          rate: l.rate,
        }
      }),
    })
  }

  useEffect(() => {
    const poId = params.get('po')
    if (poId && !draft) {
      startFor(poId)
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const po = draft ? state.purchaseOrders.find((p) => p.id === draft.poId) : null
  const cr = po ? getCR(state, po.crId) : null

  const setLine = (i, patch) =>
    setDraft((d) => ({ ...d, lines: d.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }))

  const save = () => {
    if (!draft.poId) return toast.warning('Please select the purchase order.')
    const lines = draft.lines.filter((l) => Number(l.receivedQty) > 0)
    if (!lines.length) return toast.warning('Enter a received quantity on at least one line.')
    const over = lines.find((l) => l.receivedQty > round2(l.orderedQty - l.alreadyReceived))
    if (over) return toast.error('Received quantity cannot exceed the pending quantity on the order.')
    const mismatch = lines.find((l) => round2(Number(l.acceptedQty) + Number(l.rejectedQty)) !== round2(l.receivedQty))
    if (mismatch) return toast.error('Accepted + rejected must equal the received quantity on every line.')
    dispatch({ type: 'GRN_CREATE', payload: { ...draft, lines } })
    toast.success('GRN saved — an inward was created, waiting to be added to inventory.')
    setDraft(null)
  }

  const rows = useMemo(
    () =>
      state.grns.map((g) => {
        const p = state.purchaseOrders.find((x) => x.id === g.poId)
        const c = getCR(state, g.crId)
        return {
          ...g,
          poNo: p ? p.poNo : '—',
          crNo: c ? c.crNo : '—',
          supplier: supplierName(state, g.supplierId),
          qty: sum(g.lines, (l) => l.receivedQty),
        }
      }),
    [state]
  )

  const columns = [
    {
      title: 'GRN No',
      dataIndex: 'grnNo',
      width: 114,
      sorter: true,
      render: (v, r) => <a className="doc-no" onClick={() => nav(`/purchase/grn/${r.id}`)}>{v}</a>,
    },
    { title: 'PO No', dataIndex: 'poNo', width: 108, render: (v, r) => <a className="doc-no" onClick={() => nav(`/purchase/purchase-order/${r.poId}`)}>{v}</a> },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      sorter: true,
      render: (v, r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 550 }}>{v}</div>
          {r.supplierRef && <div className="dim" style={{ fontSize: 11.5 }}>DC {r.supplierRef}</div>}
        </div>
      ),
    },
    { title: 'Request No', dataIndex: 'crNo', width: 122, render: (v, r) => <RefChip onClick={() => nav(`/sales/customer-request/${r.crId}`)}>{v}</RefChip> },
    { title: 'Date', dataIndex: 'date', width: 124, sorter: true, render: fmtDate },
    { title: 'Received Qty', dataIndex: 'qty', width: 128, numeric: true, sorter: true, render: (v) => <Qty value={v} /> },
    { title: 'Value', dataIndex: 'total', width: 148, numeric: true, sorter: true, render: (v) => <Money value={v} strong /> },
    { title: 'Status', dataIndex: 'status', width: 124, render: (v) => <StatusBadge status={v} /> },
    {
      title: 'Actions',
      width: 78,
      fixed: 'right',
      render: (_, r) => (
        <RowActions>
          <IconBtn icon={Eye} label="View GRN" onClick={() => nav(`/purchase/grn/${r.id}`)} />
        </RowActions>
      ),
    },
  ]

  const newBtn = (
    <Btn
      variant="primary"
      icon={Plus}
      disabled={!openPos.length}
      onClick={() => setDraft({ poId: null, date: today(), supplierRef: '', receivedBy: '', remarks: '', lines: [] })}
    >
      Create GRN
    </Btn>
  )

  return (
    <div>
      <PageHeader
        title="GRN"
        subtitle="Record what the supplier actually delivered. Saving creates the inward automatically."
        actions={newBtn}
      />

      {!openPos.length && state.grns.length > 0 && (
        <Alert style={{ marginBottom: 14 }} type="info" showIcon message="No purchase order is awaiting delivery. Send a PO to a supplier first." />
      )}

      <DataTable
        columns={columns}
        data={rows}
        scrollX={1380}
        showRange
        searchKeys={['grnNo', 'poNo', 'crNo', 'supplier', 'supplierRef']}
        searchPlaceholder="Search GRN, PO, supplier…"
        filters={[
          { key: 'status', placeholder: 'Status', width: 158, options: ['Received', 'Invoiced'].map((x) => ({ value: x, label: x })) },
          {
            key: 'supplierId',
            placeholder: 'Supplier',
            width: 226,
            showSearch: true,
            options: state.suppliers.map((c) => ({ value: c.id, label: c.name })),
          },
        ]}
        empty={{
          icon: PackageCheck,
          title: 'No goods receipts yet',
          description: 'When a supplier delivers against a purchase order, record the receipt here.',
          action: newBtn,
        }}
      />

      <FormModal
        open={!!draft}
        title="New goods receipt note"
        subtitle="Only accepted quantities go on to the inward — rejected quantities never reach inventory."
        onCancel={() => setDraft(null)}
        onOk={save}
        okText="Save GRN"
        width={1060}
        footerNote="The item's last purchase rate is updated on save."
      >
        {draft && (
          <>
            <FormSection title="Receipt information">
              <Row gutter={16}>
                <Col xs={24} md={9}>
                  <Field label="Purchase order" required>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      style={{ width: '100%' }}
                      placeholder="Select the PO being received"
                      value={draft.poId || undefined}
                      onChange={startFor}
                      options={openPos.map((p) => ({ value: p.id, label: `${p.poNo} — ${supplierName(state, p.supplierId)} — ${p.status}` }))}
                    />
                  </Field>
                </Col>
                <Col xs={12} md={5}>
                  <Field label="Supplier">
                    <Input readOnly value={po ? supplierName(state, po.supplierId) : ''} />
                  </Field>
                </Col>
                <Col xs={12} md={4}>
                  <Field label="Request No">
                    <Input readOnly value={cr ? cr.crNo : ''} />
                  </Field>
                </Col>
                <Col xs={12} md={6}>
                  <Field label="Received date">
                    <DateField value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} />
                  </Field>
                </Col>
                <Col xs={12} md={8}>
                  <Field label="Supplier DC / invoice ref">
                    <Input value={draft.supplierRef} onChange={(e) => setDraft({ ...draft, supplierRef: e.target.value })} />
                  </Field>
                </Col>
                <Col xs={12} md={6}>
                  <Field label="Received by">
                    <Input value={draft.receivedBy} onChange={(e) => setDraft({ ...draft, receivedBy: e.target.value })} />
                  </Field>
                </Col>
                <Col xs={24} md={10}>
                  <Field label="Remarks">
                    <Input value={draft.remarks} onChange={(e) => setDraft({ ...draft, remarks: e.target.value })} />
                  </Field>
                </Col>
              </Row>
            </FormSection>

            <FormSection title="Quantities received">
              <div className="tbl-card" style={{ boxShadow: 'none' }}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="itemId"
                  dataSource={draft.lines}
                  scroll={{ x: 1020 }}
                  locale={{ emptyText: 'Select a purchase order to load its lines' }}
                  columns={[
                    { title: '#', width: 44, align: 'center', render: (_, __, i) => <span className="num dim">{i + 1}</span> },
                    {
                      title: 'Item',
                      render: (_, l) => (
                        <div style={{ minWidth: 0 }}>
                          <div>{itemName(state, l.itemId)}</div>
                          <div className="dim" style={{ fontSize: 11.5 }}>{itemCode(state, l.itemId)}</div>
                        </div>
                      ),
                    },
                    { title: 'Ordered', width: 92, align: 'right', className: 'col-num', render: (_, l) => <Qty value={l.orderedQty} /> },
                    { title: 'Already received', width: 128, align: 'right', className: 'col-num', render: (_, l) => <Qty value={l.alreadyReceived} /> },
                    {
                      title: 'Received now',
                      width: 122,
                      render: (_, l, i) => (
                        <InputNumber
                          size="small"
                          min={0}
                          max={round2(l.orderedQty - l.alreadyReceived)}
                          style={{ width: '100%' }}
                          value={l.receivedQty}
                          onChange={(v) => setLine(i, { receivedQty: v || 0, acceptedQty: v || 0, rejectedQty: 0 })}
                        />
                      ),
                    },
                    {
                      title: 'Accepted',
                      width: 112,
                      render: (_, l, i) => (
                        <InputNumber
                          size="small"
                          min={0}
                          max={l.receivedQty}
                          style={{ width: '100%' }}
                          value={l.acceptedQty}
                          onChange={(v) => setLine(i, { acceptedQty: v || 0, rejectedQty: round2(l.receivedQty - (v || 0)) })}
                        />
                      ),
                    },
                    {
                      title: 'Rejected',
                      width: 98,
                      align: 'right',
                      className: 'col-num',
                      render: (_, l) => (
                        <span style={{ color: l.rejectedQty > 0 ? 'var(--c-danger)' : undefined, fontWeight: l.rejectedQty > 0 ? 600 : 400 }}>
                          <Qty value={l.rejectedQty} />
                        </span>
                      ),
                    },
                    { title: 'Rate', width: 112, align: 'right', className: 'col-num', render: (_, l) => <Money value={l.rate} /> },
                    { title: 'Value', width: 134, align: 'right', className: 'col-num', render: (_, l) => <Money value={round2(l.acceptedQty * l.rate)} /> },
                  ]}
                  summary={() =>
                    draft.lines.length ? (
                      <Table.Summary>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={8} align="right"><strong>Accepted value</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={8} align="right">
                            <Money value={sum(draft.lines, (l) => l.acceptedQty * l.rate)} strong />
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    ) : null
                  }
                />
              </div>
            </FormSection>

            <Alert
              style={{ marginTop: 16 }}
              type="info"
              showIcon
              message="Partial deliveries are allowed — the purchase order stays Partially Received until the full quantity arrives."
            />
          </>
        )}
      </FormModal>
    </div>
  )
}
