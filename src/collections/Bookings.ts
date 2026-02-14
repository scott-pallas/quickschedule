import type { CollectionConfig } from 'payload'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'

export function createBookingsCollection(config: ResolvedQuickScheduleConfig): CollectionConfig {
  const providerSlug = config.collections.providers.slug
  const appointmentTypeSlug = config.collections.appointmentTypes.slug
  const { slug, fields: extraFields, hooks: extraHooks } = config.collections.bookings

  return {
    slug,
    admin: {
      useAsTitle: 'summary',
      group: 'Scheduling',
      defaultColumns: ['date', 'time', 'patientName', 'appointmentType', 'status'],
    },
    hooks: {
      ...(extraHooks || {}),
    },
    fields: [
      {
        name: 'summary',
        type: 'text',
        admin: { readOnly: true },
        hooks: {
          beforeChange: [
            ({ data }) => {
              if (data?.patientName && data?.date && data?.time) {
                return `${data.patientName} - ${data.date} ${data.time}`
              }
              return data?.summary
            },
          ],
        },
      },
      { name: 'appointmentType', type: 'relationship', relationTo: appointmentTypeSlug, required: true },
      { name: 'provider', type: 'relationship', relationTo: providerSlug, required: true },
      { name: 'date', type: 'date', required: true },
      { name: 'time', type: 'text', required: true },
      { name: 'duration', type: 'number', required: true },
      { name: 'endTime', type: 'text' },
      { name: 'patientName', type: 'text', required: true },
      { name: 'patientEmail', type: 'email', required: true },
      { name: 'patientPhone', type: 'text', required: true },
      { name: 'notes', type: 'textarea' },
      {
        name: 'status',
        type: 'select',
        defaultValue: 'confirmed',
        options: [
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Completed', value: 'completed' },
          { label: 'No Show', value: 'no-show' },
        ],
      },
      { name: 'confirmationSent', type: 'checkbox', defaultValue: false },
      { name: 'reminderSent', type: 'checkbox', defaultValue: false },
      { name: 'cancelledAt', type: 'date' },
      { name: 'cancelReason', type: 'text' },
      { name: 'confirmationNumber', type: 'text', admin: { readOnly: true } },
      { name: 'cancelToken', type: 'text', admin: { hidden: true } },
      ...extraFields,
    ],
  }
}
