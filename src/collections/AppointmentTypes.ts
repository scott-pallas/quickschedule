import type { CollectionConfig } from 'payload'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'

export function createAppointmentTypesCollection(config: ResolvedQuickScheduleConfig): CollectionConfig {
  const providerSlug = config.collections.providers.slug
  const { slug, fields: extraFields } = config.collections.appointmentTypes

  return {
    slug,
    admin: {
      useAsTitle: 'name',
      group: 'Scheduling',
    },
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'description', type: 'textarea' },
      { name: 'duration', type: 'number', required: true },
      { name: 'price', type: 'number' },
      { name: 'provider', type: 'relationship', relationTo: providerSlug },
      { name: 'providers', type: 'relationship', relationTo: providerSlug, hasMany: true },
      { name: 'color', type: 'text' },
      { name: 'active', type: 'checkbox', defaultValue: true },
      { name: 'maxPerDay', type: 'number' },
      { name: 'requiresNewPatient', type: 'checkbox', defaultValue: false },
      { name: 'bufferBefore', type: 'number', defaultValue: 0 },
      { name: 'bufferAfter', type: 'number', defaultValue: 0 },
      ...extraFields,
    ],
  }
}
