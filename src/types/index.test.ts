import { describe, it, expectTypeOf } from 'vitest'
import type {
  QuickScheduleConfig,
  Provider,
  AppointmentType,
  Booking,
  BookingInput,
  AvailabilityResponse,
} from './index.js'

describe('types', () => {
  it('QuickScheduleConfig accepts empty object', () => {
    const config: QuickScheduleConfig = {}
    expectTypeOf(config).toMatchTypeOf<QuickScheduleConfig>()
  })

  it('BookingInput has required fields', () => {
    expectTypeOf<BookingInput>().toHaveProperty('appointmentTypeId')
    expectTypeOf<BookingInput>().toHaveProperty('providerId')
    expectTypeOf<BookingInput>().toHaveProperty('date')
    expectTypeOf<BookingInput>().toHaveProperty('time')
    expectTypeOf<BookingInput>().toHaveProperty('patient')
  })
})
