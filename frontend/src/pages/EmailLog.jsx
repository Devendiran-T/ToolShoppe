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
}

export default function EmailLog() {
  const s = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(null)

  const rows = useMemo(
    () =>
      s.emailLog.map((e) => {
        let doc = '—'
        let to = null
        if (e.refType === 'PR') {
          const pr = s.purchaseRequests.find((x) => x.id === e.refId)
          doc = pr ? pr.prNo : '—'
          to = pr ? `/purchase/request/${pr.id}` : null
        } else if (e.refType === 'CQ') {
          const cq = s.customerQuotations.find((x) => x.id === e.refId)
          doc = cq ? cq.cqNo : '—'
          to = cq ? `/sales/quotation/${cq.id}` : null
        } else if (e.refType === 'PO') {
          const po = s.purchaseOrders.find((x) => x.id === e.refId)
          doc = po ? po.poNo : '—'
          to = po ? `/purchase/purchase-order/${po.id}` : null
        }
        return { ...e, doc, to, recipients: (e.to || []).join(', ') }
      }),
    [s]
  )

  const columns = [
    { title: 'Sent at', dataIndex: 'sentAt', width: 186, sorter: true, render: fmtDateTime },
    {
      title: 'Type',
      dataIndex: 'refType',
      width: 200,
      render: (v) => {
        const r = REF[v] || { label: v, tone: 'neutral', icon: Mail }
        const t = TONE[r.tone]
        const Icon = r.icon
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
      render: (v, r) => <a className="doc-no" onClick={() => r.to && nav(r.to)}>{v}</a>,
    },
    { title: 'Recipient', dataIndex: 'recipients', width: 262, render: (v) => <span className="muted">{v}</span> },
    {
      title: 'Subject',
      dataIndex: 'subject',
      render: (v, r) => (
        <a onClick={() => setOpen(r)} style={{ color: 'var(--c-text)' }}>{v}</a>
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
            options: Object.entries(REF).map(([value, r]) => ({ value, label: r.label })),
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
        title={open ? (REF[open.refType] || {}).label || 'Email' : ''}
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
                  ['To', (open.to || []).join(', ')],
                  ['Subject', open.subject],
                  ['Document', <a className="doc-no" onClick={() => open.to && nav(open.to)}>{open.doc}</a>],
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
                {open.body}
              </pre>
            </DrawerSection>
          </>
        )}
      </ViewDrawer>
    </div>
  )
}
