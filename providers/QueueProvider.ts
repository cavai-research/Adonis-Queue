import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { QueueManager } from '../src/QueueManager'
import { BaseJob } from '../src/BaseJob'

export default class QueueProvider {
  public static needsApplication = true

  constructor (protected app: ApplicationContract) { }

  public register () {
    // Register your own bindings
    this.app.container.singleton('Cavai/Adonis-Queue', () => {
      return new QueueManager(this.app.container.use('Adonis/Core/Config').get('queue'), this.app)
    })
  }

  public async boot () {
    // IoC container is ready
    BaseJob.useQueue(this.app.container.use('Cavai/Adonis-Queue'))
  }

  public async ready () {
    // App is ready
  }

  public async shutdown () {
  }
}
