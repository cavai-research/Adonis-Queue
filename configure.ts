import { stubsRoot } from './stubs/main.js'
import ConfigureCommand from '@adonisjs/core/commands/configure'

export async function configure(command: ConfigureCommand) {
  const codemods = await command.createCodemods()

  /**
   * Publish config file
   */
  await codemods.makeUsingStub(stubsRoot, 'config/queue.stub', {})

  /**
   * Publish provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@cavai/adonis-queue/queue_provider')
    rcFile.addCommand('@cavai/adonis-queue/commands')
  })

  /**
   * Publish migration file
   */
  await codemods.makeUsingStub(stubsRoot, 'make/migration/jobs.stub', {
    entity: command.app.generators.createEntity('adonis_jobs'),
    migration: {
      folder: 'database/migrations',
      fileName: `${new Date().getTime()}_create_adonis_jobs_table.ts`,
    },
  })
}
