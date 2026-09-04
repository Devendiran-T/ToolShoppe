import React from 'react'
import { Modal, Drawer, App as AntApp } from 'antd'
import { X, AlertTriangle, Printer } from 'lucide-react'
import { Btn } from './Buttons.jsx'
import StatusBadge from './StatusBadge.jsx'

/**
 * Large transaction forms — roomy centred modal with a sticky footer.
 * Never a cramped little dialog.
 */
export function FormModal({
  open,
  title,
  subtitle,
  onCancel,
  onOk,
  okText = 'Save',
  cancelText = 'Cancel',
  okVariant = 'primary',
  okDisabled,
  confirmLoading,
  width = 940,
  children,
  footerNote,
}) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      width={width}
      destroyOnClose
      maskClosable={false}
      closeIcon={<X size={17} strokeWidth={2} />}
      title={
        <div>
          <div style={{ fontSize: 16, fontWeight: 650, letterSpacing: '-0.01em' }}>{title}</div>
        </div>
      }
      styles={{ body: { maxHeight: 'calc(100vh - 230px)', overflowY: 'auto', overflowX: 'hidden', paddingTop: 16 } }}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left', fontSize: 12, color: 'var(--c-text-muted)' }}>
            {footerNote}
          </div>
          <Btn variant="secondary" onClick={onCancel}>
            {cancelText}
          </Btn>
          <Btn variant={okVariant} onClick={onOk} disabled={okDisabled} loading={confirmLoading}>
            {okText}
          </Btn>
        </div>
      }
    >
      {children}
    </Modal>
  )
}

/** Read-only detail surface: a right-hand drawer with a clean header. */
export function ViewDrawer({ open, onClose, title, docNo, status, subtitle, width = 720, children, actions, onPrint }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={Math.min(width, typeof window !== 'undefined' ? window.innerWidth : width)}
      closeIcon={null}
      styles={{ header: { display: 'none' } }}
      footer={
        actions ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{actions}</div>
        ) : null
      }
    >
      <div className="dw-head">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--c-text-2)', fontWeight: 500 }}>{title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 19, fontWeight: 650, letterSpacing: '-0.02em' }}>{docNo}</span>
              {status && <StatusBadge status={status} />}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
            {onPrint && <Btn variant="text" icon={Printer} onClick={onPrint} aria-label="Print" />}
            <Btn variant="text" icon={X} onClick={onClose} aria-label="Close" />
          </div>
        </div>
      </div>
      <div className="dw-body">{children}</div>
    </Drawer>
  )
}

export function DrawerSection({ title, children, extra }) {
  return (
    <div className="dw-sec">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>{title}</div>
        {extra}
      </div>
      {children}
    </div>
  )
}

/**
 * Professional confirmation dialog. `tone` drives the icon and the primary
 * button so a destructive action always reads as destructive.
 */
export function useConfirm() {
  const { modal } = AntApp.useApp()
  return React.useCallback(
    ({ title, description, okText = 'Confirm', tone = 'primary', onConfirm, cancelText = 'Cancel' }) => {
      const danger = tone === 'danger'
      const warn = tone === 'warning'
      const accent = danger ? 'var(--c-danger)' : warn ? 'var(--c-warning)' : 'var(--c-primary)'
      const bg = danger ? 'var(--c-danger-light)' : warn ? 'var(--c-warning-light)' : 'var(--c-primary-light)'
      modal.confirm({
        title: null,
        icon: null,
        width: 440,
        okText,
        cancelText,
        okButtonProps: { danger, style: danger || warn ? { background: accent, borderColor: accent } : undefined },
        onOk: onConfirm,
        content: (
          <div style={{ display: 'flex', gap: 14, paddingTop: 4 }}>
            <div
              style={{
                width: 40, height: 40, flex: 'none', borderRadius: 10,
                display: 'grid', placeItems: 'center', background: bg, color: accent,
              }}
            >
              <AlertTriangle size={20} strokeWidth={2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--c-text-2)' }}>{description}</div>
            </div>
          </div>
        ),
      })
    },
    [modal]
  )
}

/** Consistent toast copy. Keeps notification wording uniform app-wide. */
export function useToast() {
  const { message } = AntApp.useApp()
  return React.useMemo(
    () => ({
      success: (t) => message.success(t),
      error: (t) => message.error(t),
      warning: (t) => message.warning(t),
      info: (t) => message.info(t),
    }),
    [message]
  )
}
