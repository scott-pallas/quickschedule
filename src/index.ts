export { quickschedulePlugin } from './plugin.js'
export { resolveConfig } from './defaults.js'

// Re-export commonly used types
export type {
  QuickScheduleConfig,
  ResolvedQuickScheduleConfig,
  Provider,
  AppointmentType,
  Booking,
  BlockedTime,
  BookingInput,
  AvailabilityResponse,
  BookingResponse,
} from './types/index.js'
