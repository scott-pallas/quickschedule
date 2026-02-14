import type { CollectionConfig } from 'payload'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'

export function createProvidersCollection(config: ResolvedQuickScheduleConfig): CollectionConfig {
  const { slug, fields: extraFields } = config.collections.providers

  return {
    slug,
    admin: {
      useAsTitle: 'name',
      group: 'Scheduling',
    },
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'photo', type: 'upload', relationTo: 'media' },
      { name: 'bio', type: 'richText' },
      { name: 'active', type: 'checkbox', defaultValue: true },
      {
        name: 'schedule',
        type: 'array',
        fields: [
          {
            name: 'dayOfWeek',
            type: 'select',
            required: true,
            options: [
              { label: 'Sunday', value: '0' },
              { label: 'Monday', value: '1' },
              { label: 'Tuesday', value: '2' },
              { label: 'Wednesday', value: '3' },
              { label: 'Thursday', value: '4' },
              { label: 'Friday', value: '5' },
              { label: 'Saturday', value: '6' },
            ],
          },
          { name: 'startTime', type: 'text', required: true },
          { name: 'endTime', type: 'text', required: true },
        ],
      },
      { name: 'bufferMinutes', type: 'number', defaultValue: 0 },
      { name: 'timezone', type: 'text' },
      ...extraFields,
    ],
  }
}
