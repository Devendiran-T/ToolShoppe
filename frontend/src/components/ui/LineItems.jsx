import React from 'react'
import { Table } from 'antd'
import { Plus, Trash2 } from 'lucide-react'
import { Btn, IconBtn } from './Buttons.jsx'

/**
 * Editable line grid used by every document that has item lines.
 * `columns` entries render an input via render(row, index, set) where
 * set(index, patch) merges the patch into that row.
 */
export default function LineItems({
  rows,
  onChange,
  columns,
  newRow,
  allowAdd = true,
  allowDelete = true,
  addLabel = 'Add line',
  summary,
  minRows = 1,
  scrollX,
}) {
  const set = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i))
  const add = () => onChange([...rows, newRow ? newRow() : {}])

  const cols = [
    { title: '#', width: 46, align: 'center', render: (_, __, i) => <span className="num dim">{i + 1}</span> },
    ...columns.map((c) => ({
      title: c.title,
      width: c.width,
      align: c.numeric ? 'right' : c.align,
      className: c.numeric ? 'col-num' : undefined,
      render: (_, row, i) => c.render(row, i, set),
    })),
  ]
  if (allowDelete) {
    cols.push({
      title: '',
      width: 48,
      align: 'center',
      render: (_, __, i) =>
        rows.length > minRows ? (
          <IconBtn icon={Trash2} label="Remove line" danger onClick={() => remove(i)} />
        ) : null,
    })
  }

  return (
    <div>
      <div className="tbl-card" style={{ boxShadow: 'none' }}>
        <Table
          size="small"
          pagination={false}
          columns={cols}
          dataSource={rows.map((r, i) => ({ ...r, __k: i }))}
          rowKey="__k"
          summary={summary}
          scroll={scrollX ? { x: scrollX } : undefined}
        />
      </div>
      {allowAdd && (
        <Btn variant="outline" size="small" icon={Plus} onClick={add} style={{ marginTop: 10 }}>
          {addLabel}
        </Btn>
      )}
    </div>
  )
}
