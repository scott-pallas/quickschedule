import type { CollectionConfig } from 'payload'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'
import { createProvidersCollection } from './Providers.js'
import { createAppointmentTypesCollection } from './AppointmentTypes.js'
import { createBookingsCollection } from './Bookings.js'
import { createBlockedTimesCollection } from './BlockedTimes.js'

export function createCollections(config: ResolvedQuickScheduleConfig): CollectionConfig[] {
  return [
    createProvidersCollection(config),
    createAppointmentTypesCollection(config),
    createBookingsCollection(config),
    createBlockedTimesCollection(config),
  ]
}

export { createProvidersCollection } from './Providers.js'
export { createAppointmentTypesCollection } from './AppointmentTypes.js'
export { createBookingsCollection } from './Bookings.js'
export { createBlockedTimesCollection } from './BlockedTimes.js'
