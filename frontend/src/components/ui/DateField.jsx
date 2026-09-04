import React from 'react'
import { DatePicker } from 'antd'
import { Calendar } from 'lucide-react'
import dayjs from 'dayjs'

/** DatePicker that reads and writes plain 'YYYY-MM-DD' strings. */
export default function DateField({ value, onChange, ...rest }) {
  return (
    <DatePicker
      style={{ width: '100%' }}
      format="DD MMM YYYY"
      suffixIcon={<Calendar size={15} strokeWidth={2} style={{ color: 'var(--c-text-muted)' }} />}
      value={value ? dayjs(value) : null}
      onChange={(d) => onChange(d ? d.format('YYYY-MM-DD') : null)}
      {...rest}
    />
  )
}

export const fmtDate = (s) => (s ? dayjs(s).format('DD MMM YYYY') : '—')
export const fmtDateTime = (s) => (s ? dayjs(s).format('DD MMM YYYY, HH:mm') : '—')
