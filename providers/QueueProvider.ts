import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import Queue from '../src/Queue'

export default class QueueProvider {
  public static needsApplication = true

  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
    this.app.container.singleton('Cavai/Adonis-Queue', () => {
      return new Queue(this.app.container.use('Adonis/Core/Config').get('queue'), this.app)
    })
  }

  public async boot() {
    // IoC container is ready
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    await this.app.container.resolveBinding('Cavai/Adonis-Queue').closeAll()
  }
}
