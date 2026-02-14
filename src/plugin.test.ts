import { describe, it, expect } from 'vitest'
import { quickschedulePlugin } from './plugin.js'
import { resolveConfig } from './defaults.js'

describe('resolveConfig', () => {
  it('applies defaults for empty config', () => {
    const resolved = resolveConfig({})
    expect(resolved.slotInterval).toBe(30)
    expect(resolved.bookingWindow).toBe(60)
    expect(resolved.minNotice).toBe(24)
    expect(resolved.timezone).toBe('UTC')
    expect(resolved.routePrefix).toBe('/api/quickschedule')
  })

  it('overrides defaults with user config', () => {
    const resolved = resolveConfig({
      slotInterval: 15,
      timezone: 'America/Detroit',
    })
    expect(resolved.slotInterval).toBe(15)
    expect(resolved.timezone).toBe('America/Detroit')
  })

  it('uses default collection slugs', () => {
    const resolved = resolveConfig({})
    expect(resolved.collections.providers.slug).toBe('qs-providers')
    expect(resolved.collections.appointmentTypes.slug).toBe('qs-appointment-types')
    expect(resolved.collections.bookings.slug).toBe('qs-bookings')
    expect(resolved.collections.blockedTimes.slug).toBe('qs-blocked-times')
  })

  it('allows custom collection slugs', () => {
    const resolved = resolveConfig({
      collections: {
        providers: { slug: 'staff' },
      },
    })
    expect(resolved.collections.providers.slug).toBe('staff')
    expect(resolved.collections.bookings.slug).toBe('qs-bookings')
  })
})

describe('quickschedulePlugin', () => {
  it('returns a function', () => {
    const plugin = quickschedulePlugin({})
    expect(typeof plugin).toBe('function')
  })

  it('adds 4 collections to config', () => {
    const plugin = quickschedulePlugin({})
    const result = plugin({
      collections: [],
    } as any)
    expect((result as any).collections).toHaveLength(4)
  })

  it('preserves existing collections', () => {
    const plugin = quickschedulePlugin({})
    const existing = { slug: 'pages', fields: [] }
    const result = plugin({
      collections: [existing],
    } as any)
    expect((result as any).collections).toHaveLength(5)
    expect((result as any).collections[0]).toBe(existing)
  })

  it('returns config unchanged when enabled=false', () => {
    const plugin = quickschedulePlugin({ enabled: false })
    const input = { collections: [{ slug: 'pages', fields: [] }] } as any
    const result = plugin(input)
    expect(result).toBe(input)
  })
})
