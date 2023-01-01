import { QueueManager } from '../src/QueueManager'

export class BaseJob {
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
  public static jobsPath: string

  /**
   * Instance of queue manager
   */
  public static queueManager: QueueManager

  /**
   * Sets queueManager to current job
   */
  public static useQueue (queueManager) {
    this.queueManager = queueManager
  }

  /**
   * Dispatches job to be queued up for execution
   *
   * @param data Data to pass to job class instance
   */
  public static async dispatch<T extends typeof BaseJob>(this: T, ...data: ConstructorParameters<T>) {
    if (!this.jobsPath) {
      throw new Error(`jobPath param missing in ${this.name}`)
    }

    let payload = {
      jobsPath: this.jobsPath,
      data,
      version: 'v1',
    }

    await this.queueManager.store(this.jobsPath, payload)
  }
}
