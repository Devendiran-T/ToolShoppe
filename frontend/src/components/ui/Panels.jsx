import React from 'react'

/** Standard white card with an optional titled header strip. */
export function Card({ title, subtitle, icon: Icon, extra, children, pad = true, className = '', style }) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || extra) && (
        <div className="card-head no-print-border">
          <div>
            <h3 className="card-title">
              {Icon && <Icon size={15} strokeWidth={2} style={{ color: 'var(--c-text-2)' }} />}
              {title}
            </h3>
            {subtitle && <div className="card-sub">{subtitle}</div>}
          </div>
          {extra && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{extra}</div>}
        </div>
      )}
      {pad ? <div className="card-pad">{children}</div> : children}
    </div>
  )
}

/** Uppercase label used inside detail drawers and forms. */
export function SectionLabel({ children }) {
  return <div className="section-label">{children}</div>
}

/** Grouped block of form fields. */
export function FormSection({ title, description, children }) {
  return (
    <div className="form-sec">
      {title && <SectionLabel>{title}</SectionLabel>}
      {description && <div className="fld-help" style={{ marginTop: -6, marginBottom: 10 }}>{description}</div>}
      {children}
    </div>
  )
}

/** Label + control wrapper used by every form. */
export function Field({ label, required, help, children, style }) {
  return (
    <div className="fld" style={style}>
      {label && (
        <div className="fld-label">
          {label}
          {required && <span className="fld-req">*</span>}
        </div>
      )}
      {children}
      {help && <div className="fld-help">{help}</div>}
    </div>
  )
}

/** Definition list for read-only detail panes. Falsy values are dropped. */
export function KV({ items }) {
  return (
    <dl className="kv">
      {items
        .filter((i) => i && i[1] !== undefined && i[1] !== null && i[1] !== '')
        .map(([k, v]) => (
          <React.Fragment key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </React.Fragment>
        ))}
    </dl>
  )
}

/** Responsive two/three column grid for cards. */
export function Grid({ cols = 2, gap = 16, min = 300, children, style }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
        gap,
        ...style,
      }}
      data-cols={cols}
    >
      {children}
    </div>
  )
}
