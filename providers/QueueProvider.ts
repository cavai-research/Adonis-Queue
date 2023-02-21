import { ApplicationContract } from '@ioc:Adonis/Core/Application'
// import { QueueManager } from '../src/QueueManager'
import { BaseJob } from '../src/BaseJob'

export default class QueueProvider {
  public static needsApplication = true

  constructor (protected app: ApplicationContract) { }

  public register () {
    // Register your own bindings
    this.app.container.singleton('Cavai/Adonis-Queue', () => {
      // TODO: How to add mappings to here? :thinking:
      // const queueManager = new QueueManager({
      //   default: 'db',
      //   queues: {
      //     db: () => new DatabaseDriver({
      //       tableName: 'jobs',
      //     }, db),
      //   },
      // }, this.app.logger, this.app.appRoot)
      // return queueManager
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
