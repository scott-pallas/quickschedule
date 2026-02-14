'use client'

import { useState, useEffect } from 'react'
import type { AvailabilityResponse } from '../../types/index.js'
import { useBookingContext } from '../BookingProvider.js'

interface UseAvailableSlotsResult {
  slots: string[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useAvailableSlots(): UseAvailableSlotsResult {
  const { apiBase, selectedProvider, selectedType, selectedDate } = useBookingContext()
  const [slots, setSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchCount, setFetchCount] = useState(0)

  useEffect(() => {
    if (!selectedProvider?.id || !selectedType?.id || !selectedDate) {
      setSlots([])
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams({
      providerId: selectedProvider.id,
      appointmentTypeId: selectedType.id,
      date: selectedDate,
    })

    fetch(`${apiBase}/availability?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch availability')
        return res.json() as Promise<AvailabilityResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setSlots(data.availableSlots)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [apiBase, selectedProvider?.id, selectedType?.id, selectedDate, fetchCount])

  const refetch = () => setFetchCount((c) => c + 1)

  return { slots, isLoading, error, refetch }
}
