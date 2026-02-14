import type { Config, Plugin } from 'payload'
import type { QuickScheduleConfig } from './types/index.js'
import { resolveConfig } from './defaults.js'
import { createCollections } from './collections/index.js'

export const quickschedulePlugin =
  (pluginConfig: QuickScheduleConfig): Plugin =>
  (incomingConfig: Config): Config => {
    if (pluginConfig.enabled === false) {
      return incomingConfig
    }

    const config = resolveConfig(pluginConfig)
    const collections = createCollections(config)

    return {
      ...incomingConfig,
      collections: [...(incomingConfig.collections || []), ...collections],
    }
  }
