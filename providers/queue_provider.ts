import '@adonisjs/lucid/database_provider'
import { ApplicationService } from '@adonisjs/core/types'

import { BaseJob } from '../src/base_job.js'
import type { QueueService } from '../src/types.js'
import { QueueManager } from '../src/queue_manager.js'
import DatabaseDriver from '../src/drivers/database.js'
import DriversCollection from '../src/drivers_collection.js'

/**
 * Extending the container with a custom service
 */
declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    'cavai.queue': QueueService
  }
}

export default class QueueProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('cavai.queue', async (resolver) => {
      const config = this.app.config.get<any>('queue')
      const logger = await resolver.make('logger')

      const queueManager = new QueueManager(config, logger, this.app.makePath())

      return queueManager
    })
  }

  async boot() {
    const db = await this.app.container.make('lucid.db')
    const queue = await this.app.container.make('cavai.queue')

    DriversCollection.extend('database', (config) => {
      return new DatabaseDriver(config, db)
    })

    BaseJob.useQueue(queue)
  }
}
