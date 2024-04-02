import { configProvider } from '@adonisjs/core'
import type { ConfigProvider } from '@adonisjs/core/types'
import { DatabaseDriverConfig, QueueManagerFactory } from './types.js'
import type { DatabaseDriver } from './drivers/database.js'

/**
 * Helper to remap known queue to factory functions
 */
type ResolvedConfig<KnownQueues extends Record<string, QueueManagerFactory>> = {
  default?: keyof KnownQueues
  queues: {
    [K in keyof KnownQueues]: KnownQueues[K] extends ConfigProvider<infer A> ? A : KnownQueues[K]
  }
}

/**
 * Helper function to define config for the queue service
 */
export function defineConfig<KnownQueues extends Record<string, QueueManagerFactory>>(config: {
  default?: keyof KnownQueues
  queues: {
    [K in keyof KnownQueues]: ConfigProvider<KnownQueues[K]> | KnownQueues[K]
  }
}): ConfigProvider<ResolvedConfig<KnownQueues>> {
  return configProvider.create(async (app) => {
    const { queues, default: defaultQueue, ...rest } = config
    const queueNames = Object.keys(queues)
    const drivers = {} as Record<string, QueueManagerFactory>

    for (let queueName of queueNames) {
      const queue = queues[queueName]
      if (typeof queue === 'function') {
        drivers[queueName] = queue
      } else {
        drivers[queueName] = await queue.resolver(app)
      }
    }

    return {
      default: defaultQueue,
      queues: drivers,
      ...rest,
    } as ResolvedConfig<KnownQueues>
  })
}

/**
 * Config helpers to create a reference for inbuilt queue drivers
 */
export const drivers: {
  database: (config: DatabaseDriverConfig) => ConfigProvider<() => DatabaseDriver>
} = {
  database(config) {
    return configProvider.create(async (app) => {
      const { DatabaseDriver } = await import('./drivers/database.js')
      const logger = await app.container.make('logger')
      const database = await app.container.make('lucid.db')

      return () => new DatabaseDriver(config, database, logger)
    })
  },
}
