'use client'

import { useState, useCallback } from 'react'
import type { BookingInput, BookingResponse } from '../../types/index.js'
import { useBookingContext } from '../BookingProvider.js'

interface UseCreateBookingResult {
  book: (patient: BookingInput['patient']) => Promise<BookingResponse>
  isBooking: boolean
  error: string | null
}

export function useCreateBooking(): UseCreateBookingResult {
  const { apiBase, selectedProvider, selectedType, selectedDate, selectedTime, setBooking } =
    useBookingContext()
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const book = useCallback(
    async (patient: BookingInput['patient']): Promise<BookingResponse> => {
      if (!selectedProvider || !selectedType || !selectedDate || !selectedTime) {
        const errResponse: BookingResponse = {
          success: false,
          error: 'incomplete_selection',
          message: 'Please complete all booking steps first',
        }
        return errResponse
      }

      setIsBooking(true)
      setError(null)

      try {
        const response = await fetch(`${apiBase}/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentTypeId: selectedType.id,
            providerId: selectedProvider.id,
            date: selectedDate,
            time: selectedTime,
            patient,
          }),
        })

        const result: BookingResponse = await response.json()

        if (result.success) {
          setBooking(result)
        } else {
          setError(result.message || 'Booking failed')
        }

        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error'
        setError(message)
        return { success: false, error: 'network_error', message }
      } finally {
        setIsBooking(false)
      }
    },
    [apiBase, selectedProvider, selectedType, selectedDate, selectedTime, setBooking],
  )

  return { book, isBooking, error }
}
