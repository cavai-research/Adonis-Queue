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
}

// export default async function instructions(
//   _projectRoot: string,
//   app: ApplicationContract,
//   sink: typeof sinkStatic,
// ) {
//   // Copy over ExampleJob.ts
//   new sink.files.MustacheFile(
//     app.makePath("app"),
//     "Jobs/ExampleJob.ts",
//     join(__dirname, "templates/ExampleJob.txt"),
//   )
//     .apply({ name: "TestJob", filename: "TestJob", useMustache: true })
//     .commit();

//   // Copy over Migration
//   new sink.files.TemplateLiteralFile(
//     app.makePath("database"),
//     `migrations/${Date.now()}_queue_migration.ts`,
//     join(__dirname, "templates/queue_migration.txt"),
//   )
//     .apply({})
//     .commit();
// }
