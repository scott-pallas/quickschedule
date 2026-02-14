'use client'

import React, { type ReactNode } from 'react'
import { useBookingContext } from './BookingProvider.js'
import type { Booking, Provider, AppointmentType } from '../types/index.js'

interface RenderConfirmationProps {
  booking: Booking
  provider: Provider
  appointmentType: AppointmentType
}

export interface BookingConfirmationProps {
  render?: (props: RenderConfirmationProps) => ReactNode
}

export function BookingConfirmation({ render }: BookingConfirmationProps) {
  const { booking, selectedProvider, selectedType } = useBookingContext()

  if (!booking?.success || !booking.booking) return null

  const defaultRender = ({ booking: b }: RenderConfirmationProps) => (
    <div>
      <h2>Booking Confirmed!</h2>
      <p>Confirmation: {b.confirmationNumber}</p>
    </div>
  )

  return (
    <>
      {(render ?? defaultRender)({
        booking: booking.booking,
        provider: selectedProvider!,
        appointmentType: selectedType!,
      })}
    </>
  )
}
