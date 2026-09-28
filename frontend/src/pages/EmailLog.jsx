import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from 'antd'
import { Mail, Eye, Send, FileCheck2, FileText } from 'lucide-react'
import { useStore } from '../store/AppContext.jsx'
import {
  DataTable, PageHeader, Btn, IconBtn, RowActions, ViewDrawer, DrawerSection, KV,
  fmtDateTime,
} from '../components/ui/index.js'
import { TONE } from '../theme/tokens.js'

const REF = {
  PR: { label: 'RFQ to supplier', tone: 'info', icon: Send },
  CQ: { label: 'Quotation to customer', tone: 'teal', icon: FileCheck2 },
  PO: { label: 'Purchase order', tone: 'primary', icon: FileText },
  RFQ: { label: 'RFQ to supplier', tone: 'info', icon: Send },
  'Customer Quotation': { label: 'Quotation to customer', tone: 'teal', icon: FileCheck2 },
  'Purchase Order': { label: 'Purchase order', tone: 'primary', icon: FileText },
}

function formatRecipients(val) {
  if (Array.isArray(val)) return val.filter(Boolean).join(', ')
  if (typeof val === 'string') return val
  return '—'
}

export default function EmailLog() {
  const s = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(null)

  const rows = useMemo(() => {
    const list = s?.emailLog || []
    return list.map((e) => {
      let doc = '—'
      let routePath = null
      const type = e.refType || (e.document_type === 'Customer Quotation' ? 'CQ' : e.document_type === 'Purchase Order' ? 'PO' : 'PR')
      const refId = e.refId || e.document_id

      if (type === 'PR' || type === 'RFQ') {
        const pr = (s?.purchaseRequests || []).find((x) => x.id === refId || x.prNo === refId)
        doc = pr ? pr.prNo : (refId ? (String(refId).startsWith('PR-') ? refId : `PR-${String(refId).padStart(3, '0')}`) : '—')
        routePath = pr ? `/purchase/request/${pr.id}` : (refId ? `/purchase/request/${refId}` : null)
      } else if (type === 'CQ' || type === 'Customer Quotation') {
        const cq = (s?.customerQuotations || []).find((x) => x.id === refId || x.cqNo === refId)
        doc = cq ? cq.cqNo : (refId ? (String(refId).startsWith('CQ-') ? refId : `CQ-${String(refId).padStart(3, '0')}`) : '—')
        routePath = cq ? `/sales/quotation/${cq.id}` : (refId ? `/sales/quotation/${refId}` : null)
      } else if (type === 'PO' || type === 'Purchase Order') {
        const po = (s?.purchaseOrders || []).find((x) => x.id === refId || x.poNo === refId)
        doc = po ? po.poNo : (refId ? (String(refId).startsWith('PO-') ? refId : `PO-${String(refId).padStart(3, '0')}`) : '—')
        routePath = po ? `/purchase/purchase-order/${po.id}` : (refId ? `/purchase/purchase-order/${refId}` : null)
      }

      const recipients = formatRecipients(e.to || e.recipient)
      const sentAt = e.sentAt || e.sent_at || ''

      return {
        ...e,
        refType: type,
        doc,
        routePath,
        recipients,
        sentAt,
      }
    })
  }, [s])

  const columns = [
    { title: 'Sent at', dataIndex: 'sentAt', width: 186, sorter: true, render: fmtDateTime },
    {
      title: 'Type',
      dataIndex: 'refType',
      width: 200,
      render: (v) => {
        const r = REF[v] || { label: v || 'Email', tone: 'neutral', icon: Mail }
        const t = TONE[r.tone] || TONE.neutral
        const Icon = r.icon || Mail
        return (
          <span className="badge" style={{ background: t.bg, color: t.fg, borderColor: t.border }}>
            <Icon size={12} strokeWidth={2.2} />
            {r.label}
          </span>
        )
      },
    },
    {
      title: 'Document',
      dataIndex: 'doc',
      width: 122,
      render: (v, r) => (
        <a className="doc-no" onClick={() => r.routePath && nav(r.routePath)} style={{ cursor: r.routePath ? 'pointer' : 'default' }}>
          {v}
        </a>
      ),
    },
    { title: 'Recipient', dataIndex: 'recipients', width: 262, render: (v) => <span className="muted">{v}</span> },
    {
      title: 'Subject',
      dataIndex: 'subject',
      render: (v, r) => (
        <a onClick={() => setOpen(r)} style={{ color: 'var(--c-text)', cursor: 'pointer' }}>{v || '—'}</a>
      ),
    },
    {
      title: 'Actions',
      width: 78,
      fixed: 'right',
      render: (_, r) => (
        <RowActions>
          <IconBtn icon={Eye} label="Open message" onClick={() => setOpen(r)} />
        </RowActions>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Email Log"
        subtitle="Every simulated send in the prototype — quotation requests, customer quotations and purchase orders."
      />

      <Alert
        style={{ marginBottom: 14 }}
        type="info"
        showIcon
        message="No mail leaves the browser. Wiring in a real mail server would change only the send popup and this log writer — the rest of the flow stays exactly as it is."
      />

      <DataTable
        columns={columns}
        data={rows}
        scrollX={1180}
        searchKeys={['subject', 'recipients', 'doc', 'body']}
        searchPlaceholder="Search subject, recipient, document…"
        pageSize={12}
        filters={[
          {
            key: 'refType',
            placeholder: 'Type',
            width: 216,
            options: Object.entries(REF)
              .filter(([k]) => ['PR', 'CQ', 'PO'].includes(k))
              .map(([value, r]) => ({ value, label: r.label })),
          },
        ]}
        empty={{
          icon: Mail,
          title: 'Nothing sent yet',
          description: 'Send a quotation request, a customer quotation or a purchase order and it is recorded here.',
        }}
      />

      <ViewDrawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? (REF[open.refType] || {}).label || open.refType || 'Email' : ''}
        docNo={open ? open.doc : ''}
        subtitle={open ? open.subject : ''}
        width={720}
        actions={<Btn variant="secondary" onClick={() => setOpen(null)}>Close</Btn>}
      >
        {open && (
          <>
            <DrawerSection title="Message details">
              <KV
                items={[
                  ['Sent at', fmtDateTime(open.sentAt)],
                  ['To', open.recipients || formatRecipients(open.to || open.recipient)],
                  ['Subject', open.subject || '—'],
                  ['Document', open.routePath ? <a className="doc-no" onClick={() => nav(open.routePath)}>{open.doc}</a> : <span>{open.doc}</span>],
                ]}
              />
            </DrawerSection>
            <DrawerSection title="Body">
              <pre
                style={{
                  background: 'var(--c-surface-alt)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 'var(--r-card)',
                  padding: 16,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {open.body || 'No content'}
              </pre>
            </DrawerSection>
          </>
        )}
      </ViewDrawer>
    </div>
  )
}
