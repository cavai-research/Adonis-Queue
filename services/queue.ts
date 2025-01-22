import app from '@adonisjs/core/services/app'
import type { QueueService } from '../src/types.js'

let queue: QueueService

/**
 * Returns a singleton instance of the DriveManager class from the
 * container.
 */
await app.booted(async () => {
  queue = await app.container.make('cavai.queue')
})

export { queue as default }
