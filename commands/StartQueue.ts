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

  public async run() {
    await import(this.application.startPath('jobs'))
  }
}
