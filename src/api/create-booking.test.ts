import { describe, it, expect, vi } from 'vitest'
import { processBooking } from './create-booking.js'

describe('processBooking', () => {
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

  const mockDeps = {
    findProvider: vi.fn().mockResolvedValue({
      id: 'prov-1',
      name: 'Dr. Smith',
      email: 'smith@example.com',
      active: true,
      bufferMinutes: 0,
      schedule: [{ dayOfWeek: '2', startTime: '09:00', endTime: '17:00' }],
    }),
    findAppointmentType: vi.fn().mockResolvedValue({
      id: 'apt-1',
      name: 'Consultation',
      slug: 'consultation',
      duration: 30,
      active: true,
      requiresNewPatient: false,
      bufferBefore: 0,
      bufferAfter: 0,
    }),
    findBookingsForDate: vi.fn().mockResolvedValue([]),
    findBlockedTimesForDate: vi.fn().mockResolvedValue([]),
    createBookingRecord: vi.fn().mockResolvedValue({
      id: 'booking-1',
      confirmationNumber: 'QS-2026-1215-001',
    }),
    countBookingsForDate: vi.fn().mockResolvedValue(0),
    config: {
      slotInterval: 30,
      minNotice: 0,
      timezone: 'UTC',
      validation: {},
    },
  }

  it('creates a booking for a valid request', async () => {
    const result = await processBooking(validInput, mockDeps)
    expect(result.success).toBe(true)
    expect(result.booking).toBeDefined()
    expect(mockDeps.createBookingRecord).toHaveBeenCalled()
  })

  it('rejects when provider not found', async () => {
    const deps = { ...mockDeps, findProvider: vi.fn().mockResolvedValue(null) }
    const result = await processBooking(validInput, deps)
    expect(result.success).toBe(false)
    expect(result.error).toBe('provider_not_found')
  })

  it('rejects when appointment type not found', async () => {
    const deps = { ...mockDeps, findAppointmentType: vi.fn().mockResolvedValue(null) }
    const result = await processBooking(validInput, deps)
    expect(result.success).toBe(false)
    expect(result.error).toBe('appointment_type_not_found')
  })

  it('rejects when slot is unavailable', async () => {
    const deps = {
      ...mockDeps,
      findBookingsForDate: vi.fn().mockResolvedValue([
        { time: '10:00', duration: 30, status: 'confirmed' },
      ]),
    }
    const result = await processBooking(validInput, deps)
    expect(result.success).toBe(false)
    expect(result.error).toBe('slot_unavailable')
  })

  it('rejects invalid input', async () => {
    const result = await processBooking(
      { ...validInput, patient: { ...validInput.patient, name: '' } },
      mockDeps,
    )
    expect(result.success).toBe(false)
    expect(result.error).toBe('validation_error')
  })
})
