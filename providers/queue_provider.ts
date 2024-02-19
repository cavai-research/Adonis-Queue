import { QueueManager } from '../src/queue_manager.js'
// import { BaseJob } from '../src/BaseJob'
// import DatabaseDriver from '../src/Drivers/Database'
// import DriversCollection from '../src/DriversCollection'
import type { ApplicationService } from '@adonisjs/core/types'

export default class QueueProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(QueueManager, () => {
      let conf = this.app.config.get('queue')
      return new QueueManager(conf)
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
