import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import SuperJSON from 'superjson'
import { QueueManagerFactory, QueueDriver, StoreOptions } from './types'

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
  protected driver: QueueDriver

  constructor(
    protected config: { default: keyof Mappings; queues: Mappings },
    protected logger: LoggerContract,
    protected jobsRoot: string
  ) {
    // Setup default driver
    this.driver = this.use(config.default)
  }

  public use<K extends keyof Mappings>(queue: K): QueueDriver {
    if (!this.config.queues[queue]) {
      throw Error(`Queue not defined: "${String(queue)}"`)
    }
    return this.config.queues[queue]()
  }

  /**
   * Starts up given queue jobs execution
   *
   * @param queue Queue name to start
   */
  public async start<K extends keyof Mappings>(queue: K) {
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
        // eslint-disable-next-line no-constant-condition
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
  public async execute() {
    let job = await this.driver.getNext()

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
    let payload: any = SuperJSON.parse(job.payload)
    let jobPath = `${this.jobsRoot}/${job.class_path}`
    const JobClass = (await import(jobPath)).default
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
      await this.driver.remove(job.id)
    } catch (error) {
      this.logger.error(error, 'Job execution failed')

      /**
       * Check if job has depleted retries
       * if so, then mark it as failed
       */
      if (job.attempts >= JobClass.retries) {
        this.logger.error(`Job ${job.id} failed for last time after ${JobClass.retries} retries`)
        await this.driver.markFailed(job)
        return
      }

      await this.driver.reSchedule(job, JobClass.retryAfter)
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
  public async store(path, payload, options?: StoreOptions) {
    return this.driver.store(path, payload, options)
  }
}
