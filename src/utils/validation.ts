import type { BookingInput } from '../types/index.js'

interface ValidationResult {
  valid: boolean
  errors: string[]
}

interface ValidationOptions {
  requireEmail?: boolean
  requirePhone?: boolean
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export function validateBookingInput(
  input: BookingInput,
  options: ValidationOptions = {},
): ValidationResult {
  const errors: string[] = []

  if (!input.appointmentTypeId) errors.push('Appointment type is required')
  if (!input.providerId) errors.push('Provider is required')

  if (!input.date || !DATE_REGEX.test(input.date)) {
    errors.push('Invalid date format')
  }

  if (!input.time || !TIME_REGEX.test(input.time)) {
    errors.push('Invalid time format')
  }

  if (!input.patient?.name) errors.push('Patient name is required')

  if (options.requireEmail !== false && !input.patient?.email) {
    errors.push('Patient email is required')
  }

  if (options.requirePhone && !input.patient?.phone) {
    errors.push('Patient phone is required')
  }

  return { valid: errors.length === 0, errors }
}

export function isTimeInPast(
  date: string,
  time: string,
  minNoticeHours: number,
): boolean {
  const appointmentTime = new Date(`${date}T${time}:00`)
  const now = new Date()
  const minNoticeMs = minNoticeHours * 60 * 60 * 1000
  return appointmentTime.getTime() - now.getTime() < minNoticeMs
}
