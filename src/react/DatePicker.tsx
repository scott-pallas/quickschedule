'use client'

import React, { useState, type ReactNode } from 'react'
import { useBookingContext } from './BookingProvider.js'

interface RenderDayProps {
  date: Date
  dateStr: string
  isSelected: boolean
  isToday: boolean
  isPast: boolean
  select: () => void
}

export interface DatePickerProps {
  renderDay?: (props: RenderDayProps) => ReactNode
  renderHeader?: (props: {
    month: string
    year: number
    prev: () => void
    next: () => void
  }) => ReactNode
  as?: (props: { value: string | null; onChange: (date: string) => void }) => ReactNode
}

export function DatePicker({ renderDay, renderHeader, as }: DatePickerProps) {
  const { selectedDate, selectDate } = useBookingContext()
  const [viewDate, setViewDate] = useState(() => new Date())

  if (as) {
    return <>{as({ value: selectedDate, onChange: selectDate })}</>
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const lastDay = new Date(year, month + 1, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: Date[] = []
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long' })

  const prev = () => setViewDate(new Date(year, month - 1, 1))
  const next = () => setViewDate(new Date(year, month + 1, 1))

  const defaultHeader =
    renderHeader ??
    (({
      month,
      year,
      prev,
      next,
    }: {
      month: string
      year: number
      prev: () => void
      next: () => void
    }) => (
      <div>
        <button onClick={prev}>&lt;</button>
        <span>
          {month} {year}
        </span>
        <button onClick={next}>&gt;</button>
      </div>
    ))

  const defaultRenderDay =
    renderDay ??
    (({ dateStr, isSelected, isPast, select, date }: RenderDayProps) => (
      <button key={dateStr} onClick={select} disabled={isPast} data-selected={isSelected}>
        {date.getDate()}
      </button>
    ))

  return (
    <div>
      {defaultHeader({ month: monthName, year, prev, next })}
      <div>
        {days.map((date) => {
          const dateStr = formatDateStr(date)
          return defaultRenderDay({
            date,
            dateStr,
            isSelected: selectedDate === dateStr,
            isToday: date.getTime() === today.getTime(),
            isPast: date < today,
            select: () => selectDate(dateStr),
          })
        })}
      </div>
    </div>
  )
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
