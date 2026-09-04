import React from 'react'
import { Button, Tooltip } from 'antd'

/**
 * One button system. `variant` maps to the semantic palette; every button
 * shares height, radius, font and icon size through the antd theme tokens.
 */
export function Btn({
  variant = 'secondary',
  icon: Icon,
  children,
  size = 'middle',
  block,
  ...rest
}) {
  const iconSize = size === 'small' ? 14 : 15
  const node = Icon ? <Icon size={iconSize} strokeWidth={2} /> : undefined

  const map = {
    primary: { type: 'primary' },
    secondary: { type: 'default' },
    outline: { type: 'default', style: { color: 'var(--c-primary)', borderColor: 'var(--c-primary)' } },
    text: { type: 'text' },
    link: { type: 'link' },
    danger: { type: 'primary', danger: true },
    dangerGhost: { type: 'default', danger: true },
    success: {
      type: 'primary',
      style: { background: 'var(--c-success)', borderColor: 'var(--c-success)' },
    },
    warning: {
      type: 'primary',
      style: { background: 'var(--c-warning)', borderColor: 'var(--c-warning)' },
    },
    teal: {
      type: 'primary',
      style: { background: 'var(--c-accent-teal)', borderColor: 'var(--c-accent-teal)' },
    },
  }
  const cfg = map[variant] || map.secondary

  return (
    <Button
      {...cfg}
      size={size}
      block={block}
      icon={node}
      {...rest}
      style={{ ...cfg.style, ...(rest.style || {}) }}
    >
      {children}
    </Button>
  )
}

/** Compact icon-only action used inside table rows. Always tooltipped. */
export function IconBtn({ icon: Icon, label, danger, onClick, disabled, size = 15 }) {
  const btn = (
    <button
      type="button"
      className={`icon-btn${danger ? ' is-danger' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <Icon size={size} strokeWidth={1.9} />
    </button>
  )
  return disabled ? btn : <Tooltip title={label}>{btn}</Tooltip>
}

/** Row action cluster — keeps spacing identical on every list screen. */
export function RowActions({ children }) {
  return <div className="row-actions">{children}</div>
}
