import { parseTime, formatTime } from './time.js'

export function generateSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number,
): string[] {
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  const slots: string[] = []

  for (let time = start; time + intervalMinutes <= end; time += intervalMinutes) {
    slots.push(formatTime(time))
  }

  return slots
}

interface BookingConflict {
  time: string
  duration: number
}

interface BlockedTimeConflict {
  allDay: boolean
  startTime?: string
  endTime?: string
}

export function filterConflicts(
  slots: string[],
  appointmentDuration: number,
  bookings: BookingConflict[],
  blockedTimes: BlockedTimeConflict[],
  bufferMinutes: number = 0,
): string[] {
  if (blockedTimes.some((bt) => bt.allDay)) {
    return []
  }

  return slots.filter((slotTime) => {
    const slotStart = parseTime(slotTime)
    const slotEnd = slotStart + appointmentDuration

    for (const booking of bookings) {
      const bookingStart = parseTime(booking.time)
      const bookingEnd = bookingStart + booking.duration
      const bufferedStart = bookingStart - bufferMinutes
      const bufferedEnd = bookingEnd + bufferMinutes

      if (slotStart < bufferedEnd && slotEnd > bufferedStart) {
        return false
      }
    }

    for (const blocked of blockedTimes) {
      if (!blocked.allDay && blocked.startTime && blocked.endTime) {
        const blockedStart = parseTime(blocked.startTime)
        const blockedEnd = parseTime(blocked.endTime)

        if (slotStart < blockedEnd && slotEnd > blockedStart) {
          return false
        }
      }
    }

    return true
  })
}
