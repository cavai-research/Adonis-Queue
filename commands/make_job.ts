import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { stubsRoot } from '../stubs/main.js'
import path from 'node:path'

export default class StartQueue extends BaseCommand {
  static options: CommandOptions = {
    // startApp: true,
    // staysAlive: true,
  }

  /**
   * Command Name is used to run the command
   */
  static commandName = 'make:job'

  /**
   * Command Name is displayed in the "help" output
   */
  static description = 'Make a new job file for queue'

  /**
   * The name of the job file.
   */
  @args.string({ description: 'Name of the job file' })
  declare name: string

  async run() {
    const codemods = await this.createCodemods()
    let jobPath = this.app.makePath('app/jobs')

    await codemods.makeUsingStub(stubsRoot, 'job.stub', {
      filename: this.app.generators.commandName(this.name),
      entity: this.app.generators.createEntity(this.name),
      path: path.join(jobPath, this.app.generators.commandFileName(this.name)),
    })
  }
}
