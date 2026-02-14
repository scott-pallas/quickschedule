'use client'

import React, { useState, type ReactNode } from 'react'
import { useCreateBooking } from './hooks/useBooking.js'

interface FormField {
  name: string
  label: string
  type?: string
  required?: boolean
}

interface RenderFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error: string | null
}

interface RenderSubmitProps {
  isSubmitting: boolean
  submit: () => void
}

export interface BookingFormProps {
  fields?: FormField[]
  renderField?: (props: RenderFieldProps) => ReactNode
  renderSubmit?: (props: RenderSubmitProps) => ReactNode
  onSuccess?: () => void
}

const defaultFields: FormField[] = [
  { name: 'name', label: 'Full Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true },
  { name: 'notes', label: 'Notes', type: 'textarea' },
]

export function BookingForm({
  fields = defaultFields,
  renderField,
  renderSubmit,
  onSuccess,
}: BookingFormProps) {
  const { book, isBooking } = useCreateBooking()
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}
    for (const field of fields) {
      if (field.required && !values[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    const result = await book({
      name: values.name || '',
      email: values.email || '',
      phone: values.phone || '',
      notes: values.notes,
    })

    if (result.success) {
      onSuccess?.()
    }
  }

  const defaultRenderField = ({ field, value, onChange, error }: RenderFieldProps) => (
    <div key={field.name}>
      <label>{field.label}</label>
      {field.type === 'textarea' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={field.type || 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <span>{error}</span>}
    </div>
  )

  const defaultRenderSubmit = ({ isSubmitting, submit }: RenderSubmitProps) => (
    <button onClick={submit} disabled={isSubmitting}>
      {isSubmitting ? 'Booking...' : 'Confirm Booking'}
    </button>
  )

  return (
    <div>
      {fields.map((field) =>
        (renderField ?? defaultRenderField)({
          field,
          value: values[field.name] || '',
          onChange: (val) => setValues((prev) => ({ ...prev, [field.name]: val })),
          error: errors[field.name] || null,
        }),
      )}
      {(renderSubmit ?? defaultRenderSubmit)({
        isSubmitting: isBooking,
        submit: handleSubmit,
      })}
    </div>
  )
}
