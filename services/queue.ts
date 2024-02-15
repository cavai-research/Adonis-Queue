import { QueueManager } from '../src/queue_manager.js'
import app from '@adonisjs/core/services/app'

let queue: QueueManager

/**
 * Returns a singleton instance of the QueueManager class from the
 * container.
 */
await app.booted(async () => {
  queue = await app.container.make(QueueManager)
})

export { queue as default }
