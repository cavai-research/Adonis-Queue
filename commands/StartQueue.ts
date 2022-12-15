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
    const Queue = this.application.container.use('Cavai/Adonis-Queue')

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await Queue.execute()
      } catch (error) {
        // Log error and continue
        console.error(error)
      }

      // Anti self DDoS
      await new Promise(res => setTimeout(() => res(true), 2000))
    }
  }
}
