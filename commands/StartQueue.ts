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

    await QueueManager.start(this.name || Config.get('queue.default'))
  }
}
