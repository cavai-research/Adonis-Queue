import { BaseCommand, args } from '@adonisjs/ace'

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

  /**
   * Name of queue to run
   */
  @args.string({ description: 'Queue name to run', required: false })
  public name: string

  public async run() {
    const QueueManager = this.application.container.use('Cavai/Adonis-Queue')
    const Config = this.application.container.use('Adonis/Core/Config')

    /**
     * We need to commit routes, otherwise might get issues,
     * since @adonisjs/drive tries to register it's routes at startup
     * without commiting routes trying to use Drive inside job will might errors
     * Especially when also using @adonisjs/attachment-lite
     */
    const router = this.application.container.resolveBinding('Adonis/Core/Route')
    router.commit()

    await QueueManager.start(this.name || Config.get('queue.default'))
  }
}
