import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class StartQueue extends BaseCommand {
  static settings: CommandOptions = {
    staysAlive: true,
    startApp: true,
  }

  /**
   * Command Name is used to run the command
   */
  static commandName = 'queue:start'

  /**
   * Command Name is displayed in the "help" output
   */
  static description = 'Run the queue'

  /**
   * Name of queue to run
   */
  @args.string({ description: 'Queue name to run', required: false })
  declare name: string

  async run() {
    const QueueManager = await this.app.container.make('cavai.queue')
    await QueueManager.start(this.name || this.app.config.get<string>('queue.default'))
  }
}
