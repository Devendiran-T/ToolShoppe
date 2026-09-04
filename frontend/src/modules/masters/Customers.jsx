import React, { useState } from 'react'
import { Input, InputNumber, Row, Col, Switch, Tooltip } from 'antd'
import { Plus, Pencil, Eye, Users, Power, PowerOff } from 'lucide-react'
import { useApp } from '../../store/AppContext.jsx'
import {
  DataTable, PageHeader, StatusBadge, Btn, IconBtn, RowActions, FormModal,
  ViewDrawer, DrawerSection, Field, FormSection, KV, Pct, useConfirm, useToast,
} from '../../components/ui/index.js'

const blank = {
  name: '', contactPerson: '', phone: '', email: '', gstin: '',
  billingAddress: '', shippingAddress: '', markupPct: 15, paymentTerms: '', active: true,
}

export default function Customers() {
  const { state, dispatch } = useApp()
  const confirm = useConfirm()
  const toast = useToast()
  const [draft, setDraft] = useState(null)
  const [view, setView] = useState(null)

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const save = () => {
    if (!draft.name.trim()) return toast.warning('Please enter the customer name.')
    if (!/^\S+@\S+\.\S+$/.test(draft.email || '')) return toast.warning('Please enter a valid email address.')
    dispatch({ type: 'MASTER_SAVE', collection: 'customers', codeType: 'CUS', record: draft })
    toast.success(draft.id ? 'Customer updated successfully.' : 'Customer created successfully.')
    setDraft(null)
  }

  const toggle = (r) =>
    confirm({
      title: r.active ? 'Deactivate customer?' : 'Reactivate customer?',
      description: r.active
        ? `${r.name} will no longer be available for new transactions. Existing documents are untouched.`
        : `${r.name} will be available for new transactions again.`,
      okText: r.active ? 'Deactivate' : 'Reactivate',
      tone: r.active ? 'warning' : 'primary',
      onConfirm: () => {
        dispatch({ type: 'MASTER_TOGGLE', collection: 'customers', id: r.id })
        toast.success(r.active ? 'Customer deactivated.' : 'Customer reactivated.')
      },
    })

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'name',
      sorter: true,
      render: (v, r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 550 }}>{v}</div>
          <div className="dim" style={{ fontSize: 11.5 }}>{r.paymentTerms}</div>
        </div>
      ),
    },
    { title: 'Contact', dataIndex: 'contactPerson', width: 150 },
    { title: 'Phone', dataIndex: 'phone', width: 148, render: (v) => <span className="num">{v}</span> },
    { title: 'Email', dataIndex: 'email', width: 220, render: (v) => <span className="muted">{v}</span> },
    { title: 'Markup', dataIndex: 'markupPct', width: 96, numeric: true, sorter: true, render: (v) => <Pct value={v} /> },
    { title: 'Status', width: 106, render: (_, r) => <StatusBadge status={r.active ? 'Active' : 'Inactive'} /> },
    {
      title: 'Actions',
      width: 116,
      fixed: 'right',
      render: (_, r) => (
        <RowActions>
          <IconBtn icon={Eye} label="View" onClick={() => setView(r)} />
          <IconBtn icon={Pencil} label="Edit" onClick={() => setDraft({ ...r })} />
          <IconBtn
            icon={r.active ? PowerOff : Power}
            label={r.active ? 'Deactivate' : 'Reactivate'}
            danger={r.active}
            onClick={() => toggle(r)}
          />
        </RowActions>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="The default markup % pre-fills the customer price whenever a quotation is raised from a supplier rate."
        actions={
          <Btn variant="primary" icon={Plus} onClick={() => setDraft({ ...blank })}>
            New Customer
          </Btn>
        }
      />

      <DataTable
        columns={columns}
        data={state.customers}
        scrollX={960}
        searchKeys={['code', 'name', 'contactPerson', 'email', 'gstin', 'phone']}
        searchPlaceholder="Search code, name, email…"
        filters={[
          {
            key: 'active',
            placeholder: 'Status',
            width: 152,
            options: [
              { value: 'y', label: 'Active' },
              { value: 'n', label: 'Inactive' },
            ],
            match: (r, v) => (v === 'y' ? r.active : !r.active),
          },
        ]}
        empty={{
          icon: Users,
          title: 'No customers yet',
          description: 'Add the companies you sell to. Every customer request starts from one of them.',
          action: <Btn variant="primary" icon={Plus} onClick={() => setDraft({ ...blank })}>New Customer</Btn>,
        }}
      />

      {/* ------------------------------- form -------------------------------- */}
      <FormModal
        open={!!draft}
        title={draft?.id ? `Edit customer ${draft.code}` : 'New customer'}
        subtitle="Fields marked with an asterisk are required."
        onCancel={() => setDraft(null)}
        onOk={save}
        okText={draft?.id ? 'Save changes' : 'Create customer'}
        width={860}
      >
        {draft && (
          <>
            <FormSection title="Customer information">
              <Row gutter={16}>
                <Col xs={24} md={14}>
                  <Field label="Customer name" required>
                    <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Registered company name" />
                  </Field>
                </Col>
                <Col xs={24} md={10}>
                  <Field label="Contact person">
                    <Input value={draft.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} />
                  </Field>
                </Col>
                <Col xs={24} md={8}>
                  <Field label="Phone">
                    <Input value={draft.phone} onChange={(e) => set({ phone: e.target.value })} />
                  </Field>
                </Col>
                <Col xs={24} md={9}>
                  <Field label="Email" required help="Quotations and invoices are addressed here.">
                    <Input value={draft.email} onChange={(e) => set({ email: e.target.value })} />
                  </Field>
                </Col>
                <Col xs={24} md={7}>
                  <Field label="GSTIN">
                    <Input value={draft.gstin} onChange={(e) => set({ gstin: e.target.value })} />
                  </Field>
                </Col>
              </Row>
            </FormSection>

            <FormSection title="Addresses">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Field label="Billing address">
                    <Input.TextArea rows={3} value={draft.billingAddress} onChange={(e) => set({ billingAddress: e.target.value })} />
                  </Field>
                </Col>
                <Col xs={24} md={12}>
                  <Field label="Shipping address">
                    <Input.TextArea rows={3} value={draft.shippingAddress} onChange={(e) => set({ shippingAddress: e.target.value })} />
                  </Field>
                </Col>
              </Row>
            </FormSection>

            <FormSection title="Commercial terms">
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Field label="Default markup %" required help="Applied to the supplier rate to suggest a customer price.">
                    <InputNumber min={0} max={200} style={{ width: '100%' }} value={draft.markupPct} onChange={(v) => set({ markupPct: v })} />
                  </Field>
                </Col>
                <Col xs={24} md={10}>
                  <Field label="Payment terms">
                    <Input value={draft.paymentTerms} onChange={(e) => set({ paymentTerms: e.target.value })} placeholder="e.g. 30 days from invoice" />
                  </Field>
                </Col>
                <Col xs={24} md={6}>
                  <Field label="Active">
                    <div style={{ paddingTop: 6 }}>
                      <Switch checked={draft.active} onChange={(v) => set({ active: v })} />
                      <span className="muted" style={{ marginLeft: 10, fontSize: 13 }}>
                        {draft.active ? 'Available' : 'Hidden from new documents'}
                      </span>
                    </div>
                  </Field>
                </Col>
              </Row>
            </FormSection>
          </>
        )}
      </FormModal>

      {/* ------------------------------- view -------------------------------- */}
      <ViewDrawer
        open={!!view}
        onClose={() => setView(null)}
        title="Customer"
        docNo={view?.name}
        status={view ? (view.active ? 'Active' : 'Inactive') : undefined}
        subtitle={view?.code}
        actions={
          view && (
            <>
              <Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>
              <Btn variant="primary" icon={Pencil} onClick={() => { setDraft({ ...view }); setView(null) }}>
                Edit customer
              </Btn>
            </>
          )
        }
      >
        {view && (
          <>
            <DrawerSection title="Contact">
              <KV
                items={[
                  ['Code', <span className="doc-no">{view.code}</span>],
                  ['Contact person', view.contactPerson],
                  ['Phone', view.phone],
                  ['Email', view.email],
                  ['GSTIN', view.gstin],
                ]}
              />
            </DrawerSection>
            <DrawerSection title="Addresses">
              <KV items={[['Billing', view.billingAddress], ['Shipping', view.shippingAddress]]} />
            </DrawerSection>
            <DrawerSection title="Commercial terms">
              <KV
                items={[
                  ['Default markup', <Pct value={view.markupPct} strong />],
                  ['Payment terms', view.paymentTerms],
                ]}
              />
            </DrawerSection>
            <DrawerSection title="Activity">
              <KV
                items={[
                  ['Customer requests', state.customerRequests.filter((x) => x.customerId === view.id).length],
                  ['Orders received', state.salesOrders.filter((x) => x.customerId === view.id).length],
                  ['Invoices raised', state.salesInvoices.filter((x) => x.customerId === view.id).length],
                ]}
              />
            </DrawerSection>
          </>
        )}
      </ViewDrawer>
    </div>
  )
}
