import { join } from 'node:path'
import SuperJSON from 'superjson'
import type { Logger } from '@adonisjs/core/logger'
import type { QueueManagerFactory, QueueDriver, StoreOptions } from './types.js'

/**
 * Config for manager looks like this
 *
 * {
 *    default: 'somename',
 *    queues: {
 *       somename: () => new DatabaseDrive({
 *          table_name: 'sjdasjk',
 *       })
 *    }
 * }
 */
export class QueueManager<Mappings extends Record<string, QueueManagerFactory>> {
  #cachedDrivers: Partial<Record<keyof Mappings, QueueDriver>> = {}

  constructor(
    protected config: { default: keyof Mappings; queues: Mappings },
    protected logger: Logger,
    protected jobsRoot: string
  ) {}

  use<K extends keyof Mappings>(queue?: K): QueueDriver {
    const queueToUse = queue ?? this.config.default
    if (this.#cachedDrivers[queueToUse]) {
      return this.#cachedDrivers[queueToUse]
    }

    if (!this.config.queues[queueToUse]) {
      throw Error(`Queue not defined: "${String(queueToUse)}"`)
    }

    this.#cachedDrivers[queueToUse] = this.config.queues[queueToUse]()
    return this.#cachedDrivers[queueToUse]
  }

  /**
   * Starts up given queue jobs execution
   *
   * @param queue Queue name to start
   */
  async start<K extends keyof Mappings>(queue: K) {
    /**
     * Just log errors, but don't stop at any
     * In case of error, will keep queue process alive
     * Trying to execute next job in-line even after failure
     */
    try {
      if (this.use(queue).pollingDelay) {
        /**
         * Will keep queue running and checking for jobs infinitely
         */
        while (true) {
          await this.execute()

          // Wait before next execution loop
          await new Promise((res) => setTimeout(() => res(true), this.use(queue).pollingDelay))
        }
      } else {
        await this.execute()
      }
    } catch (error) {
      // Check if it's needed in first place
      this.logger.error(error)
    }
  }

  /**
   * Executes next job in queue
   */
  async execute() {
    let job = await this.use().getNext()

    // No job queued, continue with life
    if (!job) {
      this.logger.debug('No jobs in queue')
      return
    }

    this.logger.debug({ job }, 'Execution started')

    /**
     * Dynamically import job class on the fly
     * Node stores all imported classes in-memory
     * so queue has to be restarted if there has been
     * any change to already imported job class
     */
    const payload: any = SuperJSON.parse(job.payload)
    const jobPath = join(this.jobsRoot, job.class_path)
    const jobExports = await import(jobPath)
    const JobClass = jobExports.default
    const jobClassInstance = new JobClass(...payload.data)

    /**
     * Wrap handler to try-catch
     * it's just to deal with execution failures
     * Other cases are handled in parent Ace command
     */
    try {
      job.attempts++
      await jobClassInstance.handle()

      // After execution remove job from queue
      await this.use().remove(job.id)
    } catch (error) {
      this.logger.error(error, 'Job execution failed')

      /**
       * Check if job has depleted retries
       * if so, then mark it as failed
       */
      if (job.attempts >= JobClass.retries) {
        this.logger.error(`Job ${job.id} failed for last time after ${JobClass.retries} retries`)
        await this.use().markFailed(job)
        return
      }

      await this.use().reSchedule(job, JobClass.retryAfter)
    }
    this.logger.debug({ job }, 'Executed successfully')
  }

  /**
   * Stores job to queue for future execution
   *
   * @param path Path to class file
   * @param payload Job payload
   * @param options Store options
   */
  async store(path: string, payload: any, options?: StoreOptions) {
    return this.use().store(path, payload, options)
  }
}
