import { describe, it, expect } from 'vitest'
import { createCollections } from './index.js'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'

const defaultConfig: ResolvedQuickScheduleConfig = {
  slotInterval: 30,
  bookingWindow: 60,
  minNotice: 24,
  timezone: 'UTC',
  email: {},
  notifications: {
    sendConfirmation: true,
    sendReminder: false,
    reminderHours: 24,
    notifyProvider: false,
    notifyEmail: '',
  },
  collections: {
    providers: { slug: 'qs-providers', fields: [] },
    appointmentTypes: { slug: 'qs-appointment-types', fields: [] },
    bookings: { slug: 'qs-bookings', fields: [] },
    blockedTimes: { slug: 'qs-blocked-times', fields: [] },
  },
  routePrefix: '/api/quickschedule',
  validation: {},
}

describe('createCollections', () => {
  it('returns 4 collections', () => {
    const collections = createCollections(defaultConfig)
    expect(collections).toHaveLength(4)
  })

  it('uses configured slugs', () => {
    const collections = createCollections(defaultConfig)
    const slugs = collections.map((c) => c.slug)
    expect(slugs).toContain('qs-providers')
    expect(slugs).toContain('qs-appointment-types')
    expect(slugs).toContain('qs-bookings')
    expect(slugs).toContain('qs-blocked-times')
  })

  it('uses custom slugs when configured', () => {
    const config = {
      ...defaultConfig,
      collections: {
        ...defaultConfig.collections,
        providers: { slug: 'staff', fields: [] },
      },
    }
    const collections = createCollections(config)
    const slugs = collections.map((c) => c.slug)
    expect(slugs).toContain('staff')
  })

  it('includes extra fields when configured', () => {
    const config = {
      ...defaultConfig,
      collections: {
        ...defaultConfig.collections,
        providers: {
          slug: 'qs-providers',
          fields: [{ name: 'licenseNumber', type: 'text' as const }],
        },
      },
    }
    const collections = createCollections(config)
    const providers = collections.find((c) => c.slug === 'qs-providers')!
    const fieldNames = providers.fields.map((f: any) => f.name).filter(Boolean)
    expect(fieldNames).toContain('licenseNumber')
  })

  it('providers collection has schedule array field', () => {
    const collections = createCollections(defaultConfig)
    const providers = collections.find((c) => c.slug === 'qs-providers')!
    const fieldNames = providers.fields.map((f: any) => f.name).filter(Boolean)
    expect(fieldNames).toContain('schedule')
  })

  it('bookings collection has status field', () => {
    const collections = createCollections(defaultConfig)
    const bookings = collections.find((c) => c.slug === 'qs-bookings')!
    const fieldNames = bookings.fields.map((f: any) => f.name).filter(Boolean)
    expect(fieldNames).toContain('status')
  })
})
