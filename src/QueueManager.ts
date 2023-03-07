import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import SuperJSON from 'superjson'
import DatabaseDriver from './Drivers/Database'
import { QueueDriverFactory, QueueDriver } from './types'

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
export class QueueManager<
  Mappings extends Record<string, QueueDriverFactory>
> {
  protected database: DatabaseContract
  protected driver: DatabaseDriver
  // protected logger: LoggerContract

  constructor (
    protected config: { default: keyof Mappings, queues: Mappings },
    protected logger: LoggerContract,
    protected jobsRoot: string
  ) {}

  public use<K extends keyof Mappings>(queue: K): QueueDriver {
    return this.config.queues[queue]()
  }

  /**
   * Executes next job in queue
   */
  public async execute () {
    let job = await this.driver.getNext()

    // No job queued, continue with life
    if (!job) {
      this.logger.debug('Jon jobs in queue')
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
    const jobClass = new ((await import(jobPath)).default)(...payload.data)

    /**
     * Wrap handler to try-catch
     * it's just to deal with execution failures
     * Other cases are handled in parent Ace command
     */
    try {
      await jobClass.handle()

      // After execution remove job from queue
      await this.driver.remove(job.id)
    } catch (error) {
      /**
       * Handler failed
       * Log error to logger
       * Deal with job retries
       * And mark job as failed
       */
      this.logger.error({ error }, 'Job execution failed')

      /**
       * Check if job has depleted retries
       * if so, then mark it as failed
       */
      if (job.attempts >= jobClass.retries) {
        await this.driver.markFailed(job.id)
        return
      }

      await this.driver.reSchedule(job, jobClass.retryAfter)
    }
    this.logger.debug({ job }, 'Executed successfully')
  }

  /**
   * Stores job to queue for future execution
   *
   * @param path Path to class file
   * @param payload Job payload
   */
  public async store (path, payload) {
    return this.driver.store(path, payload)
  }
}
