import type {
  Provider,
  AppointmentType,
  Booking,
  BlockedTime,
  AvailabilityResponse,
} from '../types/index.js'
import { generateSlots, filterConflicts } from '../utils/slots.js'
import { getDayOfWeek } from '../utils/time.js'

interface GetAvailableSlotsInput {
  provider: Provider
  appointmentType: AppointmentType
  date: string
  bookings: Booking[]
  blockedTimes: BlockedTime[]
  config: {
    slotInterval: number
    minNotice: number
    timezone: string
  }
}

export function getAvailableSlots(input: GetAvailableSlotsInput): AvailabilityResponse {
  const { provider, appointmentType, date, bookings, blockedTimes, config } = input

  const dayOfWeek = getDayOfWeek(date)
  const daySchedule = provider.schedule.filter((s) => s.dayOfWeek === String(dayOfWeek))

  if (daySchedule.length === 0) {
    return buildResponse(input, [])
  }

  const activeBookings = bookings.filter((b) => b.status !== 'cancelled')
  if (appointmentType.maxPerDay && activeBookings.length >= appointmentType.maxPerDay) {
    return buildResponse(input, [])
  }

  let allSlots: string[] = []
  for (const schedule of daySchedule) {
    const slots = generateSlots(schedule.startTime, schedule.endTime, config.slotInterval)
    allSlots = [...allSlots, ...slots]
  }

  const bookingConflicts = activeBookings.map((b) => ({
    time: b.time,
    duration: b.duration,
  }))

  const blockedConflicts = blockedTimes.map((bt) => ({
    allDay: bt.allDay,
    startTime: bt.startTime,
    endTime: bt.endTime,
  }))

  const totalBuffer = provider.bufferMinutes + appointmentType.bufferBefore + appointmentType.bufferAfter

  const available = filterConflicts(
    allSlots,
    appointmentType.duration,
    bookingConflicts,
    blockedConflicts,
    totalBuffer,
  )

  return buildResponse(input, available)
}

function buildResponse(input: GetAvailableSlotsInput, slots: string[]): AvailabilityResponse {
  return {
    date: input.date,
    provider: {
      id: input.provider.id,
      name: input.provider.name,
    },
    appointmentType: {
      id: input.appointmentType.id,
      name: input.appointmentType.name,
      duration: input.appointmentType.duration,
    },
    availableSlots: slots,
  }
}
