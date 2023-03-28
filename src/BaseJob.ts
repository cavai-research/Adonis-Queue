import { DateTime } from 'luxon'
import Dispatcher from './Dispatcher'
import { QueueManager } from './QueueManager'

export class BaseJob {
  constructor(..._: any[]) {}

  /**
   * Nr of times job is re-tried before it is marked as failed
   */
  public static retries = 0

  /**
   * Delay for retries in seconds, so other jobs get chance to run
   */
  public static retryAfter = 5

  /**
   * Filesystem path to job class
   */
  public static classPath: string

  /**
   * After what time job will become available for execution
   */
  protected static availableAt?: DateTime

  /**
   * Instance of queue manager
   */
  public static queueManager: QueueManager<any>

  /**
   * Sets queueManager to current job
   */
  public static useQueue(queueManager) {
    this.queueManager = queueManager
  }

  /**
   * Dispatches job to be queued up for execution
   *
   * @param data Data to pass to job class instance
   */
  public static dispatch<T extends typeof BaseJob>(this: T, ...data: ConstructorParameters<T>) {
    return new Dispatcher(this.classPath, this.name, this.queueManager, data)
  }
}
