import { BaseCommand } from '@adonisjs/ace'

export default class StartQueue extends BaseCommand {
  public static settings = {
    stayAlive: true,
    loadApp: true,
  }

  /**
   * Command Name is used to run the command
   */
  public static commandName = 'queue:start'

  /**
   * Command Name is displayed in the "help" output
   */
  public static description = 'Run the queue'

  public async run () {
    const QueueManager = this.application.container.use('Cavai/Adonis-Queue')
    const Config = this.application.container.use('Adonis/Core/Config')

    /**
     * Will keep queue running and checking for jobs infinitly
     */
    // eslint-disable-next-line no-constant-condition
    while (true) {
      /**
       * Just log errors, but don't stop at any
       * In case of error, will keep queue process alive
       * Trying to execute next job in-line even after failure
       */
      try {
        await QueueManager.execute()
      } catch (error) {
        this.logger.error(error)
      }

      /**
       * Wait some time after next job execution
       * To avoid infinit loop consuming whole thread
       *
       * @todo Make it delay from last execution start, not after execution
       */
      const pollingDelay = Config.get('queue.database.config.pollingDelay') || 2000
      await new Promise(res => setTimeout(() => res(true), pollingDelay))
    }
  }
}
