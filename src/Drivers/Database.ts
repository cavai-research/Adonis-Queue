import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import SuperJSON from 'superjson'

export default class DatabaseDriver {
  protected database: DatabaseContract

  constructor (protected config, private app: ApplicationContract) {
    // Get database instance from IoC container
    this.database = <DatabaseContract>this.app.container.use('Adonis/Lucid/Database')
  }

  /**
   * Get next job from queue
   */
  public getNext () {
    return this.database
      .from(this.config.tableName)
      .where('available_at', '<', DateTime.now().toSQL())
      .where({ failed: false })
      .forUpdate()
      .first()
  }

  /**
   * Removes job from queue
   *
   * @param job Job to be removed
   */
  public remove (job) {
    return this.database
      .from(this.config.tableName)
      .where({ id: job.id })
      .delete()
  }

  /**
   * Re-schedules job for future execution
   *
   * @param job Job instance from database
   * @param instance Job class instance
   */
  public reSchedule (job, instance) {
    return this.database
      .from(this.config.tableName)
      .where({ id: job.id })
      .update({
        attempts: job.attempts += 1,
        available_at: DateTime.now().plus({ seconds: instance.retryAfter }),
      })
  }

  /**
   * Marks given job as failed
   *
   * @param job Job to be marked as failed
   */
  public markFailed (job) {
    return this.database
      .from(this.config.tableName)
      .where({ id: job.id })
      .update({
        failed: true,
      })
  }

  /**
   * Stores job to queue for future execution
   *
   * @param path Path to class file
   * @param payload Job payload
   */
  public store (path, payload) {
    return this.database.table(this.config.tableName)
      .insert({
        class_path: path,
        payload: SuperJSON.serialize(payload),
      })
  }
}
