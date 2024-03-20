import { Dispatcher } from './dispatcher.js'
import { QueueManager } from './queue_manager.js'
import { JobMeta } from './types.js'

export class BaseJob {
  #meta!: JobMeta

  setMeta(meta: JobMeta) {
    this.#meta = meta
  }

  get id() {
    return this.#meta.id
  }

  get attempts() {
    return this.#meta.attempts
  }

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

  /**
   * Re-schedule job (update attempts and available_at) in Database
   */
  async reSchedule(retryAfter: number) {
    this.#meta.attempts++
    this.queueManager.reSchedule(this, retryAfter)
  }

  /**
   * Mark job as failed in database
   */
  async markFailed() {
    await this.queueManager.markFailed(this)
  }

  /**
   * Remove job from database
   */
  async remove(): Promise<void> {
    await this.queueManager.remove(this.id)
  }

  async release() {
    await this.queueManager.release()
  }
}
