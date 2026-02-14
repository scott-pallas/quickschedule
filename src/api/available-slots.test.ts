import { describe, it, expect } from 'vitest'
import { getAvailableSlots } from './available-slots.js'
import type { Provider, AppointmentType, Booking, BlockedTime } from '../types/index.js'

const provider: Provider = {
  id: 'prov-1',
  name: 'Dr. Smith',
  email: 'smith@example.com',
  active: true,
  bufferMinutes: 0,
  schedule: [
    { dayOfWeek: '1', startTime: '09:00', endTime: '17:00' }, // Monday
    { dayOfWeek: '3', startTime: '09:00', endTime: '12:00' }, // Wednesday
  ],
}

const appointmentType: AppointmentType = {
  id: 'apt-1',
  name: 'Consultation',
  slug: 'consultation',
  duration: 30,
  active: true,
  requiresNewPatient: false,
  bufferBefore: 0,
  bufferAfter: 0,
}

describe('getAvailableSlots', () => {
  it('returns slots for a day the provider works', () => {
    // 2026-03-16 is a Monday
    const result = getAvailableSlots({
      provider,
      appointmentType,
      date: '2026-03-16',
      bookings: [],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots.length).toBeGreaterThan(0)
    expect(result.availableSlots).toContain('09:00')
    expect(result.availableSlots).toContain('16:30')
    expect(result.availableSlots).not.toContain('17:00')
  })

  it('returns empty for a day the provider does not work', () => {
    // 2026-03-17 is a Tuesday — provider only works Mon, Wed
    const result = getAvailableSlots({
      provider,
      appointmentType,
      date: '2026-03-17',
      bookings: [],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots).toEqual([])
  })

  it('removes slots that conflict with existing bookings', () => {
    const bookings: Partial<Booking>[] = [
      { time: '10:00', duration: 30, status: 'confirmed' },
    ]
    const result = getAvailableSlots({
      provider,
      appointmentType,
      date: '2026-03-16',
      bookings: bookings as Booking[],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots).not.toContain('10:00')
    expect(result.availableSlots).toContain('09:30')
    expect(result.availableSlots).toContain('10:30')
  })

  it('removes all slots for all-day blocked time', () => {
    const blockedTimes: Partial<BlockedTime>[] = [
      { allDay: true, startDate: '2026-03-16', endDate: '2026-03-16', recurring: 'none' },
    ]
    const result = getAvailableSlots({
      provider,
      appointmentType,
      date: '2026-03-16',
      bookings: [],
      blockedTimes: blockedTimes as BlockedTime[],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots).toEqual([])
  })

  it('respects provider buffer minutes', () => {
    const providerWithBuffer = { ...provider, bufferMinutes: 15 }
    const bookings: Partial<Booking>[] = [
      { time: '10:00', duration: 30, status: 'confirmed' },
    ]
    const result = getAvailableSlots({
      provider: providerWithBuffer,
      appointmentType,
      date: '2026-03-16',
      bookings: bookings as Booking[],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots).not.toContain('10:00')
  })

  it('respects maxPerDay limit', () => {
    const typeWithMax = { ...appointmentType, maxPerDay: 2 }
    const bookings: Partial<Booking>[] = [
      { time: '09:00', duration: 30, status: 'confirmed' },
      { time: '10:00', duration: 30, status: 'confirmed' },
    ]
    const result = getAvailableSlots({
      provider,
      appointmentType: typeWithMax,
      date: '2026-03-16',
      bookings: bookings as Booking[],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots).toEqual([])
  })

  it('does not count cancelled bookings against maxPerDay', () => {
    const typeWithMax = { ...appointmentType, maxPerDay: 1 }
    const bookings: Partial<Booking>[] = [
      { time: '09:00', duration: 30, status: 'cancelled' },
    ]
    const result = getAvailableSlots({
      provider,
      appointmentType: typeWithMax,
      date: '2026-03-16',
      bookings: bookings as Booking[],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots.length).toBeGreaterThan(0)
  })

  it('returns correct metadata in response', () => {
    const result = getAvailableSlots({
      provider,
      appointmentType,
      date: '2026-03-16',
      bookings: [],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.date).toBe('2026-03-16')
    expect(result.provider).toEqual({ id: 'prov-1', name: 'Dr. Smith' })
    expect(result.appointmentType).toEqual({
      id: 'apt-1',
      name: 'Consultation',
      duration: 30,
    })
  })
})
