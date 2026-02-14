'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AppointmentType, Provider, BookingResponse } from '../types/index.js'

interface BookingState {
  step: 'type' | 'date' | 'time' | 'form' | 'confirmation'
  selectedType: AppointmentType | null
  selectedProvider: Provider | null
  selectedDate: string | null
  selectedTime: string | null
  booking: BookingResponse | null
}

interface BookingContextValue extends BookingState {
  apiBase: string
  selectType: (type: AppointmentType) => void
  selectProvider: (provider: Provider) => void
  selectDate: (date: string) => void
  selectTime: (time: string) => void
  setBooking: (booking: BookingResponse) => void
  reset: () => void
  goToStep: (step: BookingState['step']) => void
}

const BookingContext = createContext<BookingContextValue | null>(null)

export interface BookingProviderProps {
  apiBase?: string
  children: ReactNode
  onBookingComplete?: (booking: BookingResponse) => void
  onError?: (error: Error) => void
}

const initialState: BookingState = {
  step: 'type',
  selectedType: null,
  selectedProvider: null,
  selectedDate: null,
  selectedTime: null,
  booking: null,
}

export function BookingProvider({
  apiBase = '/api/quickschedule',
  children,
  onBookingComplete,
  onError,
}: BookingProviderProps) {
  const [state, setState] = useState<BookingState>(initialState)

  const selectType = useCallback((type: AppointmentType) => {
    setState((prev) => ({ ...prev, selectedType: type, step: 'date' }))
  }, [])

  const selectProvider = useCallback((provider: Provider) => {
    setState((prev) => ({ ...prev, selectedProvider: provider }))
  }, [])

  const selectDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, selectedDate: date, step: 'time' }))
  }, [])

  const selectTime = useCallback((time: string) => {
    setState((prev) => ({ ...prev, selectedTime: time, step: 'form' }))
  }, [])

  const setBooking = useCallback(
    (booking: BookingResponse) => {
      setState((prev) => ({ ...prev, booking, step: 'confirmation' }))
      if (booking.success) {
        onBookingComplete?.(booking)
      }
    },
    [onBookingComplete],
  )

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const goToStep = useCallback((step: BookingState['step']) => {
    setState((prev) => ({ ...prev, step }))
  }, [])

  return (
    <BookingContext.Provider
      value={{
        ...state,
        apiBase,
        selectType,
        selectProvider,
        selectDate,
        selectTime,
        setBooking,
        reset,
        goToStep,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export function useBookingContext(): BookingContextValue {
  const ctx = useContext(BookingContext)
  if (!ctx) {
    throw new Error('useBookingContext must be used within a BookingProvider')
  }
  return ctx
}
