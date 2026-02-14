import { describe, it, expect } from 'vitest'
import { validateBookingInput, isTimeInPast } from './validation.js'

describe('validateBookingInput', () => {
  const validInput = {
    appointmentTypeId: 'apt-1',
    providerId: 'prov-1',
    date: '2026-12-15',
    time: '10:00',
    patient: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-123-4567',
    },
  }

  it('accepts valid input', () => {
    const result = validateBookingInput(validInput)
    expect(result.valid).toBe(true)
  })

  it('rejects missing patient name', () => {
    const result = validateBookingInput({
      ...validInput,
      patient: { ...validInput.patient, name: '' },
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Patient name is required')
  })

  it('rejects missing email when required', () => {
    const result = validateBookingInput({
      ...validInput,
      patient: { ...validInput.patient, email: '' },
    }, { requireEmail: true })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Patient email is required')
  })

  it('rejects missing phone when required', () => {
    const result = validateBookingInput({
      ...validInput,
      patient: { ...validInput.patient, phone: '' },
    }, { requirePhone: true })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Patient phone is required')
  })

  it('rejects invalid date format', () => {
    const result = validateBookingInput({
      ...validInput,
      date: '15-12-2026',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Invalid date format')
  })

  it('rejects invalid time format', () => {
    const result = validateBookingInput({
      ...validInput,
      time: '25:00',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Invalid time format')
  })
})

describe('isTimeInPast', () => {
  it('returns true for past dates', () => {
    expect(isTimeInPast('2020-01-01', '09:00', 0)).toBe(true)
  })

  it('returns false for far future dates', () => {
    expect(isTimeInPast('2099-12-31', '09:00', 0)).toBe(false)
  })
})
