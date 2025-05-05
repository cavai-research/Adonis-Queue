import { QueueManagerFactory, QueueDriverList } from './types'
import DriversCollection from './DriversCollection'

type GetConfig<T extends any[]> = T extends [] ? {} : T[0]

/**
 * Define config looks like this
 *
 * I will take this
 * {
 *    default: 'somename',
 *    logLevel: 'info',
 *    queues: {
 *       somename: {
 *         driver: 'db',
 *         table_name: 'sjkadakjs'
 *      }
 *    }
 * }
 *
 * And return this
 * {
 *    default: 'somename',
 *    logLevel: 'info',
 *    queues: {
 *       somename: () => new DatabaseDrive({
 *          table_name: 'sjdasjk',
 *       })
 *    }
 * }
 */
export function defineConfig<
  KnownQueues extends Record<
    string,
    {
      [K in keyof QueueDriverList]: { driver: K } & GetConfig<Parameters<QueueDriverList[K]>>
    }[keyof QueueDriverList]
  >
>(config: { default: keyof KnownQueues; queues: KnownQueues; logLevel?: string }) {
  /**
   * Queues queues should always be provided
   */
  if (!config.queues) {
    throw new Error('Missing "queues" property in queue config')
  }

  /**
   * The default queue should be mentioned in the queues
   */
  if (config.default && !config.queues[config.default]) {
    throw new Error(
      `Missing "queues.${String(
        config.default
      )}" in queue config. It is referenced by the "default" property`
    )
  }

  /**
   * Converting queues config to a collection that queue manager can use
   */
  const managerQueues = Object.keys(config.queues).reduce((result, disk: keyof KnownQueues) => {
    const queueConfig = config.queues[disk]
    result[disk] = () => DriversCollection.create(queueConfig.driver, queueConfig)
    return result
  }, {} as { [K in keyof KnownQueues]: QueueManagerFactory })

  return {
    default: config.default,
    logLevel: config.logLevel,
    queues: managerQueues,
  }
}
