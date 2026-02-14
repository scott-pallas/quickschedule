import type { QuickScheduleConfig, ResolvedQuickScheduleConfig } from './types/index.js'

export function resolveConfig(config: QuickScheduleConfig): ResolvedQuickScheduleConfig {
  return {
    slotInterval: config.slotInterval ?? 30,
    bookingWindow: config.bookingWindow ?? 60,
    minNotice: config.minNotice ?? 24,
    timezone: config.timezone ?? 'UTC',
    email: config.email ?? {},
    notifications: {
      sendConfirmation: config.notifications?.sendConfirmation ?? true,
      sendReminder: config.notifications?.sendReminder ?? false,
      reminderHours: config.notifications?.reminderHours ?? 24,
      notifyProvider: config.notifications?.notifyProvider ?? false,
      notifyEmail: config.notifications?.notifyEmail ?? '',
    },
    collections: {
      providers: {
        slug: config.collections?.providers?.slug ?? 'qs-providers',
        fields: config.collections?.providers?.fields ?? [],
        hooks: config.collections?.providers?.hooks,
      },
      appointmentTypes: {
        slug: config.collections?.appointmentTypes?.slug ?? 'qs-appointment-types',
        fields: config.collections?.appointmentTypes?.fields ?? [],
        hooks: config.collections?.appointmentTypes?.hooks,
      },
      bookings: {
        slug: config.collections?.bookings?.slug ?? 'qs-bookings',
        fields: config.collections?.bookings?.fields ?? [],
        hooks: config.collections?.bookings?.hooks,
      },
      blockedTimes: {
        slug: config.collections?.blockedTimes?.slug ?? 'qs-blocked-times',
        fields: config.collections?.blockedTimes?.fields ?? [],
        hooks: config.collections?.blockedTimes?.hooks,
      },
    },
    routePrefix: config.routePrefix ?? '/api/quickschedule',
    validation: config.validation ?? {},
  }
}
