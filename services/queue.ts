import app from '@adonisjs/core/services/app'
import type { QueueService } from '../src/types.js'

let drive: QueueService

/**
 * Returns a singleton instance of the DriveManager class from the
 * container.
 */
await app.booted(async () => {
  drive = await app.container.make('cavai.queue')
})

export { drive as default }
