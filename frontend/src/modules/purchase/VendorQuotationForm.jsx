import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Select, Input, InputNumber, Checkbox, Table, Alert, Row, Col } from 'antd'
import { Save, Lock, FileText, Building2 } from 'lucide-react'
import { useApp } from '../../store/AppContext.jsx'
import { itemName, itemCode, getCR, customerName } from '../../store/selectors.js'
import { round2 } from '../../logic/pricing.js'
import { vqTotals, isComplete } from '../../logic/compare.js'
import { today, addDays } from '../../store/reducer.js'
import { useDocLabel } from '../../app/docLabel.jsx'
import {
  PageHeader, DocHeader, Card, Grid, Btn, Field, FormSection, Money, Qty, Pct,
  DateField, useToast,
} from '../../components/ui/index.js'

export default function VendorQuotationForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useApp()
  const toast = useToast()
  const existing = id && id !== 'new' ? state.vendorQuotations.find((v) => v.id === id) : null
  const locked = existing && existing.status !== 'Received'
  useDocLabel(existing ? existing.vqNo : 'New')

  const [draft, setDraft] = useState(
    existing || {
      prId: null,
      supplierId: null,
      quoteRef: '',
      quoteDate: today(),
      validTill: addDays(today(), 15),
      deliveryDays: 7,
      paymentTerms: '30 days',
      freight: 0,
      lines: [],
    }
  )
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const pr = state.purchaseRequests.find((p) => p.id === draft.prId)
  const cr = pr ? getCR(state, pr.crId) : null

  const prOptions = state.purchaseRequests
    .filter((p) => p.status !== 'Ordered')
    .map((p) => {
      const c = getCR(state, p.crId)
      return { value: p.id, label: `${p.prNo} — ${c ? c.crNo : ''} — ${c ? customerName(state, c.customerId) : ''}` }
    })

  // Suppliers are limited to the ones the RFQ was actually sent to.
  const supplierOptions = useMemo(() => {
    if (!pr) return []
    const already = state.vendorQuotations.filter((v) => v.prId === pr.id && v.id !== draft.id).map((v) => v.supplierId)
    return state.suppliers
      .filter((s) => (pr.rfqSupplierIds || []).includes(s.id))
      .map((s) => ({ value: s.id, label: `${s.code} — ${s.name}`, disabled: already.includes(s.id) }))
  }, [pr, state, draft.id])

  const pickPr = (prId) => {
    const p = state.purchaseRequests.find((x) => x.id === prId)
    set({
      prId,
      supplierId: null,
      lines: p
        ? p.lines.map((l) => {
            const it = state.items.find((i) => i.id === l.itemId)
            return { itemId: l.itemId, qty: l.qty, rate: it ? it.lastPurchaseRate : 0, taxPct: it ? it.taxPct : 18, notQuoted: false }
          })
        : [],
    })
  }

  const setLine = (i, patch) => set({ lines: draft.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) })

  const totals = vqTotals(draft)
  const complete = pr ? isComplete(draft, pr.lines) : false

  const save = () => {
    if (!draft.prId) return toast.warning('Please select the purchase request.')
    if (!draft.supplierId) return toast.warning('Please select the supplier.')
    if (!draft.lines.some((l) => !l.notQuoted && Number(l.rate) > 0)) return toast.warning('Enter a rate for at least one item.')
    dispatch({ type: 'VQ_SAVE', payload: draft })
    toast.success(existing ? 'Quotation updated successfully.' : 'Vendor quotation saved.')
    nav('/purchase/vendor-quotation')
  }

  const saveBtn = !locked && (
    <Btn variant="primary" icon={Save} onClick={save}>
      {existing ? 'Save changes' : 'Save quotation'}
    </Btn>
  )

  return (
    <div>
      {existing ? (
        <DocHeader
          title="Vendor Quotation"
          docNo={existing.vqNo}
          status={existing.status}
          backTo="/purchase/vendor-quotation"
          actions={saveBtn}
        />
      ) : (
        <PageHeader
          title="New vendor quotation"
          subtitle="Record what the supplier quoted. The linked customer request is shown read-only."
          actions={
            <>
              <Btn variant="secondary" onClick={() => nav('/purchase/vendor-quotation')}>Cancel</Btn>
              {saveBtn}
            </>
          }
        />
      )}

      {locked && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          icon={<Lock size={15} strokeWidth={2} />}
          message={`This quotation has been ${existing.status.toLowerCase()} in a comparison and can no longer be edited.`}
        />
      )}

      <Card title="Quotation information" icon={FileText}>
        <FormSection>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Field label="Purchase request" required>
                <Select
                  showSearch
                  optionFilterProp="label"
                  disabled={!!existing}
                  value={draft.prId || undefined}
                  options={prOptions}
                  onChange={pickPr}
                  placeholder="Select PR"
                  style={{ width: '100%' }}
                />
              </Field>
            </Col>
            <Col xs={12} md={4}>
              <Field label="Request No">
                <Input readOnly value={cr ? cr.crNo : ''} />
              </Field>
            </Col>
            <Col xs={12} md={6}>
              <Field label="Customer">
                <Input readOnly value={cr ? customerName(state, cr.customerId) : ''} />
              </Field>
            </Col>
            <Col xs={24} md={6}>
              <Field label="Supplier" required help={pr ? undefined : 'Pick a purchase request first.'}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  disabled={!!existing || !pr}
                  value={draft.supplierId || undefined}
                  options={supplierOptions}
                  onChange={(v) => set({ supplierId: v })}
                  placeholder={pr ? 'Supplier the RFQ went to' : 'Pick a PR first'}
                  style={{ width: '100%' }}
                  notFoundContent="No RFQ has been sent for this request yet"
                />
              </Field>
            </Col>
          </Row>
        </FormSection>

        <FormSection title="Commercial terms">
          <Row gutter={16}>
            <Col xs={12} md={5}>
              <Field label="Supplier quote ref">
                <Input disabled={locked} value={draft.quoteRef} onChange={(e) => set({ quoteRef: e.target.value })} />
              </Field>
            </Col>
            <Col xs={12} md={4}>
              <Field label="Quote date">
                <DateField disabled={locked} value={draft.quoteDate} onChange={(v) => set({ quoteDate: v })} />
              </Field>
            </Col>
            <Col xs={12} md={4}>
              <Field label="Valid till">
                <DateField disabled={locked} value={draft.validTill} onChange={(v) => set({ validTill: v })} />
              </Field>
            </Col>
            <Col xs={12} md={3}>
              <Field label="Delivery days">
                <InputNumber disabled={locked} min={0} style={{ width: '100%' }} value={draft.deliveryDays} onChange={(v) => set({ deliveryDays: v })} />
              </Field>
            </Col>
            <Col xs={12} md={4}>
              <Field label="Payment terms">
                <Input disabled={locked} value={draft.paymentTerms} onChange={(e) => set({ paymentTerms: e.target.value })} />
              </Field>
            </Col>
            <Col xs={12} md={4}>
              <Field label="Freight / other">
                <InputNumber disabled={locked} min={0} step={0.01} style={{ width: '100%' }} value={draft.freight} onChange={(v) => set({ freight: v })} />
              </Field>
            </Col>
          </Row>
        </FormSection>
      </Card>

      <Card title="Rates quoted" icon={Building2} pad={false} style={{ marginTop: 16 }} className="card tbl-card">
        <Table
          size="small"
          pagination={false}
          rowKey={(r) => r.itemId}
          dataSource={draft.lines}
          scroll={{ x: 940 }}
          locale={{ emptyText: 'Select a purchase request to load its items' }}
          columns={[
            { title: 'S.No', width: 62, align: 'center', render: (_, __, i) => <span className="num dim">{i + 1}</span> },
            { title: 'Code', width: 104, render: (_, l) => <span className="doc-no">{itemCode(state, l.itemId)}</span> },
            { title: 'Item', render: (_, l) => itemName(state, l.itemId) },
            { title: 'Qty', width: 92, align: 'right', className: 'col-num', render: (_, l) => <Qty value={l.qty} /> },
            {
              title: 'Rate',
              width: 128,
              render: (_, l, i) => (
                <InputNumber size="small" min={0} step={0.01} disabled={locked || l.notQuoted} style={{ width: '100%' }} value={l.rate} onChange={(v) => setLine(i, { rate: v })} />
              ),
            },
            {
              title: 'Tax %',
              width: 96,
              render: (_, l, i) => (
                <InputNumber size="small" min={0} max={100} disabled={locked || l.notQuoted} style={{ width: '100%' }} value={l.taxPct} onChange={(v) => setLine(i, { taxPct: v })} />
              ),
            },
            {
              title: 'Line total',
              width: 138,
              align: 'right',
              className: 'col-num',
              render: (_, l) => (l.notQuoted ? <span className="dim">—</span> : <Money value={round2(l.qty * l.rate)} />),
            },
            {
              title: 'Not quoted',
              width: 106,
              align: 'center',
              render: (_, l, i) => <Checkbox disabled={locked} checked={l.notQuoted} onChange={(e) => setLine(i, { notQuoted: e.target.checked })} />,
            },
          ]}
          summary={() =>
            draft.lines.length ? (
              <Table.Summary>
                {[
                  ['Subtotal', totals.subtotal, false],
                  ['Tax', totals.tax, false],
                  ['Freight / other', totals.freight, false],
                  ['Grand total', totals.grandTotal, true],
                ].map(([label, val, strong]) => (
                  <Table.Summary.Row key={label}>
                    <Table.Summary.Cell index={0} colSpan={6} align="right">
                      {strong ? <strong>{label}</strong> : label}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <Money value={val} strong={strong} />
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} />
                  </Table.Summary.Row>
                ))}
              </Table.Summary>
            ) : null
          }
        />
        {pr && !complete && (
          <div className="card-pad" style={{ paddingTop: 14 }}>
            <Alert
              type="warning"
              showIcon
              message="Incomplete quotation — one or more items are not quoted. It appears in the comparison but can never be picked as Best."
            />
          </div>
        )}
      </Card>
    </div>
  )
}
