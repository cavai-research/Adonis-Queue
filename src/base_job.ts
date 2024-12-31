import { Dispatcher } from './dispatcher.js'
import { QueueManager } from './queue_manager.js'

export class BaseJob {
  constructor(..._: any[]) {}

  /**
   * Nr of times job is re-tried before it is marked as failed
   */
  static retries = 0

  /**
   * Delay for retries in seconds, so other jobs get chance to run
   */
  static retryAfter = 5

  /**
   * Filesystem path to job class
   */
  static classPath: string

  /**
   * Instance of queue manager
   */
  static queueManager: QueueManager<any>

  /**
   * Sets queueManager to current job
   */
  static useQueue(queueManager: QueueManager<any>) {
    this.queueManager = queueManager
  }

  /**
   * Dispatches job to be queued up for execution
   *
   * @param data Data to pass to job class instance
   */
  static dispatch<T extends typeof BaseJob>(this: T, ...data: ConstructorParameters<T>) {
    return new Dispatcher(this, data)
  }
}
