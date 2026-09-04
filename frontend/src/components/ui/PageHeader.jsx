import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { Btn } from './Buttons.jsx'
import StatusBadge from './StatusBadge.jsx'

/** Standard page header for every list screen. */
export default function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="ph">
      <div style={{ minWidth: 0 }}>
        <h1 className="page-title">{title}</h1>
        {children}
      </div>
      {actions && <div className="ph-actions no-print">{actions}</div>}
    </div>
  )
}

/** Header for a single-document page: back, number, status, print, actions. */
export function DocHeader({ title, docNo, status, subtitle, actions, backTo, showPrint = true }) {
  const nav = useNavigate()
  return (
    <div className="ph">
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: 'var(--c-text-2)', fontWeight: 500, marginBottom: 3 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
          <h1 className="page-title">{docNo}</h1>
          {status && <StatusBadge status={status} />}
        </div>
      </div>
      <div className="ph-actions no-print">
        <Btn variant="secondary" icon={ArrowLeft} onClick={() => (backTo ? nav(backTo) : nav(-1))}>
          Back
        </Btn>
        {showPrint && (
          <Btn variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print
          </Btn>
        )}
        {actions}
      </div>
    </div>
  )
}
