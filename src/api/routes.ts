import type { ResolvedQuickScheduleConfig } from '../types/index.js'
import { getAvailableSlots } from './available-slots.js'
import { processBooking } from './create-booking.js'

/**
 * Creates Next.js route handlers for quickschedule API.
 * Usage in app/api/quickschedule/[...path]/route.ts:
 *
 * import { createRouteHandlers } from '@nineteenlabs/quickschedule/api'
 * import { getPayload } from 'payload'
 * import configPromise from '@payload-config'
 *
 * const { GET, POST } = createRouteHandlers(configPromise)
 * export { GET, POST }
 */
export function createRouteHandlers(payloadConfigPromise: unknown) {
  async function getPayloadInstance() {
    const { getPayload } = await import('payload')
    return getPayload({ config: payloadConfigPromise as any })
  }

  async function GET(request: Request) {
    try {
      const url = new URL(request.url)
      const pathSegments = url.pathname.split('/').filter(Boolean)
      const action = pathSegments[pathSegments.length - 1]

      const payload = await getPayloadInstance()
      const pluginConfig = (payload.config as any)._quickschedule as ResolvedQuickScheduleConfig

      if (!pluginConfig) {
        return Response.json({ error: 'QuickSchedule plugin not configured' }, { status: 500 })
      }

      switch (action) {
        case 'providers': {
          const result = await payload.find({
            collection: pluginConfig.collections.providers.slug,
            where: { active: { equals: true } },
            limit: 100,
          })
          return Response.json(result.docs)
        }

        case 'appointment-types': {
          const providerId = url.searchParams.get('providerId')
          const where: Record<string, unknown> = { active: { equals: true } }
          if (providerId) {
            where.or = [
              { provider: { equals: providerId } },
              { providers: { contains: providerId } },
            ]
          }
          const result = await payload.find({
            collection: pluginConfig.collections.appointmentTypes.slug,
            where,
            limit: 100,
          })
          return Response.json(result.docs)
        }

        case 'availability': {
          const providerId = url.searchParams.get('providerId')
          const appointmentTypeId = url.searchParams.get('appointmentTypeId')
          const date = url.searchParams.get('date')

          if (!providerId || !appointmentTypeId || !date) {
            return Response.json(
              { error: 'Missing required params: providerId, appointmentTypeId, date' },
              { status: 400 },
            )
          }

          const [provider, appointmentType, bookingsResult, blockedResult] = await Promise.all([
            payload.findByID({
              collection: pluginConfig.collections.providers.slug,
              id: providerId,
            }),
            payload.findByID({
              collection: pluginConfig.collections.appointmentTypes.slug,
              id: appointmentTypeId,
            }),
            payload.find({
              collection: pluginConfig.collections.bookings.slug,
              where: {
                provider: { equals: providerId },
                date: { equals: date },
                status: { not_equals: 'cancelled' },
              },
              limit: 100,
            }),
            payload.find({
              collection: pluginConfig.collections.blockedTimes.slug,
              where: {
                provider: { equals: providerId },
                startDate: { less_than_equal: date },
                endDate: { greater_than_equal: date },
              },
              limit: 100,
            }),
          ])

          const availability = getAvailableSlots({
            provider: provider as any,
            appointmentType: appointmentType as any,
            date,
            bookings: bookingsResult.docs as any,
            blockedTimes: blockedResult.docs as any,
            config: pluginConfig,
          })

          return Response.json(availability)
        }

        default:
          return Response.json({ error: 'Not found' }, { status: 404 })
      }
    } catch (error) {
      console.error('[quickschedule] GET error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  async function POST(request: Request) {
    try {
      const url = new URL(request.url)
      const pathSegments = url.pathname.split('/').filter(Boolean)
      const action = pathSegments[pathSegments.length - 1]

      const payload = await getPayloadInstance()
      const pluginConfig = (payload.config as any)._quickschedule as ResolvedQuickScheduleConfig

      if (!pluginConfig) {
        return Response.json({ error: 'QuickSchedule plugin not configured' }, { status: 500 })
      }

      switch (action) {
        case 'book': {
          const body = await request.json()

          const result = await processBooking(body, {
            findProvider: async (id) => {
              try {
                return (await payload.findByID({
                  collection: pluginConfig.collections.providers.slug,
                  id,
                })) as any
              } catch {
                return null
              }
            },
            findAppointmentType: async (id) => {
              try {
                return (await payload.findByID({
                  collection: pluginConfig.collections.appointmentTypes.slug,
                  id,
                })) as any
              } catch {
                return null
              }
            },
            findBookingsForDate: async (providerId, date) => {
              const r = await payload.find({
                collection: pluginConfig.collections.bookings.slug,
                where: {
                  provider: { equals: providerId },
                  date: { equals: date },
                },
                limit: 100,
              })
              return r.docs as any
            },
            findBlockedTimesForDate: async (providerId, date) => {
              const r = await payload.find({
                collection: pluginConfig.collections.blockedTimes.slug,
                where: {
                  provider: { equals: providerId },
                  startDate: { less_than_equal: date },
                  endDate: { greater_than_equal: date },
                },
                limit: 100,
              })
              return r.docs as any
            },
            createBookingRecord: async (data) => {
              return (await payload.create({
                collection: pluginConfig.collections.bookings.slug,
                data,
              })) as any
            },
            countBookingsForDate: async (providerId, date) => {
              const r = await payload.count({
                collection: pluginConfig.collections.bookings.slug,
                where: {
                  provider: { equals: providerId },
                  date: { equals: date },
                },
              })
              return r.totalDocs
            },
            config: pluginConfig,
          })

          const status = result.success ? 201 : 400
          return Response.json(result, { status })
        }

        case 'cancel': {
          const body = await request.json()
          const { bookingId, token, reason } = body

          if (!bookingId || !token) {
            return Response.json(
              { error: 'Missing bookingId and token' },
              { status: 400 },
            )
          }

          const booking = await payload.findByID({
            collection: pluginConfig.collections.bookings.slug,
            id: bookingId,
          })

          if ((booking as any).cancelToken !== token) {
            return Response.json({ error: 'Invalid token' }, { status: 403 })
          }

          await payload.update({
            collection: pluginConfig.collections.bookings.slug,
            id: bookingId,
            data: {
              status: 'cancelled',
              cancelledAt: new Date().toISOString(),
              cancelReason: reason || '',
            },
          })

          return Response.json({ success: true })
        }

        default:
          return Response.json({ error: 'Not found' }, { status: 404 })
      }
    } catch (error) {
      console.error('[quickschedule] POST error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return { GET, POST }
}
