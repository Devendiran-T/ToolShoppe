import React from 'react'
import { Select } from 'antd'
import { useStore } from '../../store/AppContext.jsx'

/** Searchable master lookup. kind = customer | supplier | item */
export default function Lookup({
  kind = 'customer',
  value,
  onChange,
  placeholder,
  disabled,
  style,
  size,
  includeInactive = false,
  filter,
}) {
  const s = useStore()
  const source = kind === 'customer' ? s.customers : kind === 'supplier' ? s.suppliers : s.items
  let list = includeInactive ? source : source.filter((r) => r.active)
  if (filter) list = list.filter(filter)
  // Keep an already-chosen but now-inactive record visible on old documents.
  if (value && !list.some((r) => r.id === value)) {
    const cur = source.find((r) => r.id === value)
    if (cur) list = [cur, ...list]
  }

  return (
    <Select
      showSearch
      allowClear
      size={size}
      disabled={disabled}
      value={value || undefined}
      onChange={onChange}
      placeholder={placeholder || `Select ${kind}`}
      style={{ width: '100%', ...style }}
      optionFilterProp="label"
      options={list.map((r) => ({
        value: r.id,
        label: `${r.code} — ${r.name}`,
      }))}
    />
  )
}
