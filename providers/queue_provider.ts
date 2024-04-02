import { QueueManager } from '../src/queue_manager.js'
import type { ApplicationService } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils'

export default class QueueProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(QueueManager, async (resolver) => {
      const queueConfigProvider = await this.app.config.get('queue')
      const config = await configProvider.resolve<any>(this.app, queueConfigProvider)

      let logger = await resolver.make('logger')

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/queue.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      return new QueueManager(config, logger, 'app/jobs')
    })
  }

  // async boot() {
  //   // IoC container is ready
  //   DriversCollection.extend('database', (config) => {
  //     return new DatabaseDriver(config, this.app.container.use('Adonis/Lucid/Database'))
  //   })

  //   BaseJob.useQueue(this.app.container.use('Cavai/Adonis-Queue'))
  // }

  // async ready() {
  //   // App is ready
  // }

  async shutdown() {}
}
