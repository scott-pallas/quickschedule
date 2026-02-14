import type {
  BookingInput,
  BookingResponse,
  Provider,
  AppointmentType,
  Booking,
  BlockedTime,
} from '../types/index.js'
import { validateBookingInput } from '../utils/validation.js'
import { getAvailableSlots } from './available-slots.js'
import { generateCancelToken, generateConfirmationNumber, formatTime, parseTime } from '../utils/time.js'

interface BookingDeps {
  findProvider: (id: string) => Promise<Provider | null>
  findAppointmentType: (id: string) => Promise<AppointmentType | null>
  findBookingsForDate: (providerId: string, date: string) => Promise<Booking[]>
  findBlockedTimesForDate: (providerId: string, date: string) => Promise<BlockedTime[]>
  createBookingRecord: (data: Record<string, unknown>) => Promise<Booking>
  countBookingsForDate: (providerId: string, date: string) => Promise<number>
  config: {
    slotInterval: number
    minNotice: number
    timezone: string
    validation: {
      requirePhone?: boolean
      requireEmail?: boolean
      customValidation?: (booking: BookingInput) => Promise<{ valid: boolean; message?: string }>
    }
  }
}

export async function processBooking(
  input: BookingInput,
  deps: BookingDeps,
): Promise<BookingResponse> {
  // 1. Validate input
  const validation = validateBookingInput(input, {
    requireEmail: deps.config.validation.requireEmail,
    requirePhone: deps.config.validation.requirePhone,
  })
  if (!validation.valid) {
    return {
      success: false,
      error: 'validation_error',
      message: validation.errors.join(', '),
    }
  }

  // 2. Custom validation
  if (deps.config.validation.customValidation) {
    const custom = await deps.config.validation.customValidation(input)
    if (!custom.valid) {
      return {
        success: false,
        error: 'validation_error',
        message: custom.message || 'Custom validation failed',
      }
    }
  }

  // 3. Find provider
  const provider = await deps.findProvider(input.providerId)
  if (!provider) {
    return {
      success: false,
      error: 'provider_not_found',
      message: 'Provider not found',
    }
  }

  // 4. Find appointment type
  const appointmentType = await deps.findAppointmentType(input.appointmentTypeId)
  if (!appointmentType) {
    return {
      success: false,
      error: 'appointment_type_not_found',
      message: 'Appointment type not found',
    }
  }

  // 5. Check slot availability
  const bookings = await deps.findBookingsForDate(input.providerId, input.date)
  const blockedTimes = await deps.findBlockedTimesForDate(input.providerId, input.date)

  const availability = getAvailableSlots({
    provider,
    appointmentType,
    date: input.date,
    bookings,
    blockedTimes,
    config: {
      slotInterval: deps.config.slotInterval,
      minNotice: deps.config.minNotice,
      timezone: deps.config.timezone,
    },
  })

  if (!availability.availableSlots.includes(input.time)) {
    return {
      success: false,
      error: 'slot_unavailable',
      message: 'This time slot is no longer available',
    }
  }

  // 6. Create booking
  const sequence = (await deps.countBookingsForDate(input.providerId, input.date)) + 1
  const cancelToken = generateCancelToken()
  const confirmationNumber = generateConfirmationNumber(input.date, sequence)

  const booking = await deps.createBookingRecord({
    appointmentType: input.appointmentTypeId,
    provider: input.providerId,
    date: input.date,
    time: input.time,
    duration: appointmentType.duration,
    endTime: computeEndTime(input.time, appointmentType.duration),
    patientName: input.patient.name,
    patientEmail: input.patient.email,
    patientPhone: input.patient.phone,
    notes: input.patient.notes,
    status: 'confirmed',
    confirmationNumber,
    cancelToken,
  })

  return {
    success: true,
    booking,
    token: cancelToken,
  }
}

function computeEndTime(startTime: string, durationMinutes: number): string {
  const totalMinutes = parseTime(startTime) + durationMinutes
  return formatTime(totalMinutes)
}
