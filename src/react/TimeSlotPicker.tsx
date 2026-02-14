'use client'

import React, { type ReactNode } from 'react'
import { useBookingContext } from './BookingProvider.js'
import { useAvailableSlots } from './hooks/useAvailableSlots.js'

interface RenderSlotProps {
  time: string
  isSelected: boolean
  select: () => void
}

export interface TimeSlotPickerProps {
  renderSlot?: (props: RenderSlotProps) => ReactNode
  renderLoading?: () => ReactNode
  renderEmpty?: () => ReactNode
}

export function TimeSlotPicker({
  renderSlot,
  renderLoading,
  renderEmpty,
}: TimeSlotPickerProps) {
  const { selectedTime, selectTime } = useBookingContext()
  const { slots, isLoading } = useAvailableSlots()

  if (isLoading) return <>{renderLoading?.() ?? <div>Loading...</div>}</>
  if (slots.length === 0) return <>{renderEmpty?.() ?? <div>No available times</div>}</>

  const defaultRender = ({ time, isSelected, select }: RenderSlotProps) => (
    <button key={time} onClick={select} data-selected={isSelected}>
      {time}
    </button>
  )

  const render = renderSlot ?? defaultRender

  return (
    <>
      {slots.map((time) =>
        render({
          time,
          isSelected: selectedTime === time,
          select: () => selectTime(time),
        }),
      )}
    </>
  )
}
