import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class QueueServiceProvider {
  constructor(protected app: ApplicationContract) {}
  // Not sure about that yet, moist most likely will need
  // public static needsApplication = true

  /**
   * Register queue to the container
   */
  public register() {
    const config = this.app.config.get('queue', {})
    this.app.container.singleton('@cavai/adonis-queue', () => {
      const { Queue } = require('../src/Queue')
      return new Queue(config)
    })
  }

  public boot() {}
}
