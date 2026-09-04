import React from 'react'
import { Input, Select, DatePicker } from 'antd'
import { Search, X } from 'lucide-react'
import { Btn } from './Buttons.jsx'

const { RangePicker } = DatePicker

/**
 * Reusable filter row: search + dropdowns + optional date range + clear.
 * Single row on desktop, wraps on tablet, stacks on mobile (see global.css).
 */
export default function FilterBar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  filters = [],
  values = {},
  onChange,
  range,
  onRangeChange,
  showRange,
  onClear,
  extra,
}) {
  const dirty =
    (search && search.length > 0) ||
    filters.some((f) => values[f.key] !== undefined && values[f.key] !== null && values[f.key] !== '') ||
    (range && range[0])

  return (
    <div className="filterbar no-print">
      {onSearch && (
        <Input
          allowClear
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          prefix={<Search size={15} strokeWidth={2} style={{ color: 'var(--c-text-muted)' }} />}
          style={{ width: 268 }}
        />
      )}
      {filters.map((f) => (
        <Select
          key={f.key}
          allowClear
          showSearch={f.showSearch}
          optionFilterProp="label"
          placeholder={f.placeholder}
          value={values[f.key] ?? undefined}
          options={f.options}
          onChange={(v) => onChange(f.key, v)}
          style={{ width: f.width || 176 }}
        />
      ))}

      {dirty && onClear && (
        <Btn variant="text" icon={X} size="small" onClick={onClear}>
          Clear
        </Btn>
      )}
      {extra ? (
        <>
          <div className="fb-grow" />
          {extra}
        </>
      ) : null}
    </div>
  )
}
