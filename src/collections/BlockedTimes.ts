import type { CollectionConfig } from 'payload'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'

export function createBlockedTimesCollection(config: ResolvedQuickScheduleConfig): CollectionConfig {
  const providerSlug = config.collections.providers.slug
  const { slug, fields: extraFields } = config.collections.blockedTimes

  return {
    slug,
    admin: {
      useAsTitle: 'reason',
      group: 'Scheduling',
    },
    fields: [
      { name: 'provider', type: 'relationship', relationTo: providerSlug, required: true },
      { name: 'reason', type: 'text' },
      { name: 'startDate', type: 'date', required: true },
      { name: 'endDate', type: 'date', required: true },
      { name: 'allDay', type: 'checkbox', defaultValue: true },
      {
        name: 'startTime',
        type: 'text',
        admin: { condition: (data) => !data.allDay },
      },
      {
        name: 'endTime',
        type: 'text',
        admin: { condition: (data) => !data.allDay },
      },
      {
        name: 'recurring',
        type: 'select',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
        ],
        defaultValue: 'none',
      },
      ...extraFields,
    ],
  }
}
