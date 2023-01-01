import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import SuperJSON from 'superjson'
import DatabaseDriver from './Drivers/Database'

export class QueueManager {
  protected database: DatabaseContract
  protected driver: DatabaseDriver
  protected logger: LoggerContract

  constructor (protected config, private app: ApplicationContract) {
    this.database = <DatabaseContract>this.app.container.use('Adonis/Lucid/Database')
    this.logger = app.logger
    if (this.config.driver === 'database') {
      this.driver = new DatabaseDriver(this.config[this.config.driver], this.app)
    }
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
    let jobPath = `${this.app.appRoot}/${payload!.jobsPath}`
    const jobClass = new ((await import(jobPath)).default)(...payload.data)

    /**
     * Wrap handler to try-catch
     * it's just to deal with execution failures
     * Other cases are handled in parent Ace command
     */
    try {
      await jobClass.handle()

      // After execution remove job from queue
      await this.driver.remove(job)
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
        await this.driver.markFailed(job)
        return
      }

      await this.driver.reSchedule(job, jobClass)
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
