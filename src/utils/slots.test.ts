import { describe, it, expect } from 'vitest'
import { generateSlots, filterConflicts } from './slots.js'

describe('generateSlots', () => {
  it('generates 30-minute slots within a time range', () => {
    const slots = generateSlots('09:00', '12:00', 30)
    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'])
  })

  it('generates 60-minute slots within a time range', () => {
    const slots = generateSlots('09:00', '12:00', 60)
    expect(slots).toEqual(['09:00', '10:00', '11:00'])
  })

  it('returns empty array if range is too small', () => {
    const slots = generateSlots('09:00', '09:15', 30)
    expect(slots).toEqual([])
  })

  it('handles end-of-day boundary', () => {
    const slots = generateSlots('16:00', '17:00', 30)
    expect(slots).toEqual(['16:00', '16:30'])
  })
})

describe('filterConflicts', () => {
  it('removes slots that overlap with existing bookings', () => {
    const slots = ['09:00', '09:30', '10:00', '10:30', '11:00']
    const bookings = [
      { time: '09:30', duration: 30 },
      { time: '10:30', duration: 60 },
    ]
    const result = filterConflicts(slots, 30, bookings, [])
    expect(result).toEqual(['09:00', '10:00'])
  })

  it('removes all slots for all-day blocked times', () => {
    const slots = ['09:00', '09:30', '10:00']
    const blockedTimes = [{ allDay: true, startTime: undefined, endTime: undefined }]
    const result = filterConflicts(slots, 30, [], blockedTimes)
    expect(result).toEqual([])
  })

  it('removes slots that overlap with partial-day blocked times', () => {
    const slots = ['09:00', '09:30', '10:00', '10:30', '11:00']
    const blockedTimes = [{ allDay: false, startTime: '09:30', endTime: '10:30' }]
    const result = filterConflicts(slots, 30, [], blockedTimes)
    expect(result).toEqual(['09:00', '10:30', '11:00'])
  })

  it('applies buffer minutes around bookings', () => {
    const slots = ['09:00', '09:30', '10:00', '10:30', '11:00']
    const bookings = [{ time: '10:00', duration: 30 }]
    const result = filterConflicts(slots, 30, bookings, [], 30)
    expect(result).toEqual(['09:00', '11:00'])
  })

  it('returns all slots when no conflicts', () => {
    const slots = ['09:00', '09:30', '10:00']
    const result = filterConflicts(slots, 30, [], [])
    expect(result).toEqual(['09:00', '09:30', '10:00'])
  })
})
