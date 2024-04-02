/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "ConfigureCommand"
| instance and you can use codemods to modify the source files.
|
*/

import ConfigureCommand from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'

export async function configure(_command: ConfigureCommand) {
  let mod = await _command.createCodemods()
  // Updating RC file, not actual provider implementation
  mod.updateRcFile((rcFile) => {
    // Points to exports in package.json
    rcFile.addProvider('@cavai/adonis-queue/queue_provider')
    rcFile.addCommand('@cavai/adonis-queue/commands')
  })

  await mod.makeUsingStub(stubsRoot, 'config/queue.stub', { queue: 'database' })

  // Register / copy metafiles, configs etc
}
