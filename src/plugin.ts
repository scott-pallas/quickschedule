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

    const result = {
      ...incomingConfig,
      collections: [...(incomingConfig.collections || []), ...collections],
    }
    // Store resolved config for route handlers to access
    ;(result as any)._quickschedule = config
    return result
  }
