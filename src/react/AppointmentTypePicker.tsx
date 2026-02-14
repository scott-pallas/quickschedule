'use client'

import React, { useEffect, useState, type ReactNode } from 'react'
import type { AppointmentType } from '../types/index.js'
import { useBookingContext } from './BookingProvider.js'

interface RenderTypeProps {
  type: AppointmentType
  isSelected: boolean
  select: () => void
}

export interface AppointmentTypePickerProps {
  providerId?: string
  renderType?: (props: RenderTypeProps) => ReactNode
  renderLoading?: () => ReactNode
  renderEmpty?: () => ReactNode
}

export function AppointmentTypePicker({
  providerId,
  renderType,
  renderLoading,
  renderEmpty,
}: AppointmentTypePickerProps) {
  const { apiBase, selectedType, selectType, selectProvider } = useBookingContext()
  const [types, setTypes] = useState<AppointmentType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (providerId) params.set('providerId', providerId)

    fetch(`${apiBase}/appointment-types?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setTypes(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [apiBase, providerId])

  if (isLoading) return <>{renderLoading?.() ?? null}</>
  if (types.length === 0) return <>{renderEmpty?.() ?? null}</>

  const defaultRender = ({ type, isSelected, select }: RenderTypeProps) => (
    <button key={type.id} onClick={select} data-selected={isSelected}>
      {type.name} ({type.duration} min)
    </button>
  )

  const render = renderType ?? defaultRender

  return (
    <>
      {types.map((type) =>
        render({
          type,
          isSelected: selectedType?.id === type.id,
          select: () => {
            selectType(type)
            const provider = type.provider
            if (provider && typeof provider === 'object') {
              selectProvider(provider)
            }
          },
        }),
      )}
    </>
  )
}
