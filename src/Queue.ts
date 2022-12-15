import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import SuperJSON from 'superjson'
import DatabaseDriver from './Drivers/Database'

export default class Queue {
  protected database: DatabaseContract
  protected driver: DatabaseDriver

  constructor (protected config, private app: ApplicationContract) {
    this.database = <DatabaseContract>this.app.container.use('Adonis/Lucid/Database')

    if (this.config.driver === 'database') {
      this.driver = new DatabaseDriver(this.config[this.config.driver], this.app)
    }
  }

  /**
   * TODO: Write comment
   */
  public async execute () {
    // Get one available job
    let job = await this.driver.getNext()

    // No job queued, continue with life
    if (!job) {
      console.log('No job :(')
      return
    }

    console.log('Found job!')

    /**
     * Dynamically import job class on the fly
     * Node stores all imported classes in-memory
     * so queue has to be restarted if there has been
     * any change to already imported job class
     */
    let jobPath = `${this.app.appRoot}/${job.class}`
    let payload = SuperJSON.parse(job.payload)
    const jobClass = new ((await import(jobPath)).default)(payload)

    /**
     * Wrap handler to try-catch
     * it's just to deal with execution failures
     * Other cases are handled in parent Ace command
     */
    try {
      await jobClass.handle()

      // After execution remove job from table
      await this.driver.remove(job)
    } catch (error) {
      /**
       * Handler failed
       * Log error to logger
       * Deal with job retries
       * And mark job as failed
       */
      console.log('JOB FAILED')
      console.log(error)

      // Check if job has depleted retries
      // if so, then mark it as failed
      if (job.attempts >= jobClass.retries) {
        console.log('PERMA FAILED!')
        await this.driver.markFailed(job)
        return
      }

      console.log('RE-SCHEDULED')
      await this.driver.reSchedule(job, jobClass)
    }
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
