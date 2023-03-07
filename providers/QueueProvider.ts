import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { QueueManager } from '../src/QueueManager'
import { BaseJob } from '../src/BaseJob'
import DatabaseDriver from '../src/Drivers/Database'
import DriversCollection from '../src/DriversCollection'

export default class QueueProvider {
  public static needsApplication = true

  constructor (protected app: ApplicationContract) { }

  public register () {
    // Register your own bindings
    this.app.container.singleton('Cavai/Adonis-Queue', () => {
      // TODO: How to add mappings to here? :thinking:
      const config = this.app.container.use('Adonis/Core/Config').get('queue')
      const queueManager = new QueueManager(config, this.app.logger, this.app.appRoot)
      return queueManager
    })
  }

  public async boot () {
    // IoC container is ready
    DriversCollection.extend('db', (config) => {
      return new DatabaseDriver(config, this.app.container.use('Adonis/Lucid/Database'))
    })

    BaseJob.useQueue(this.app.container.use('Cavai/Adonis-Queue'))
  }

  public async ready () {
    // App is ready
  }

  public async shutdown () {
  }
}
