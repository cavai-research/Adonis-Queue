import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import SuperJSON from 'superjson'
import { DatabaseDriverConfig, JobRecord, QueueDriver } from '../types'

export default class DatabaseDriver implements QueueDriver {
  constructor (protected config: DatabaseDriverConfig, private database: DatabaseContract) {}

  /**
   * Store job to database
   */
  public async store (path: string, payload: any) {
    await this.database.table(this.config.tableName)
      .insert({
        class_path: path,
        payload: SuperJSON.serialize(payload),
      })
  }

  /**
   * Get next job from database
   */
  public getNext (): Promise<JobRecord | null> {
    return this.database
      .from(this.config.tableName)
      .where('available_at', '<', DateTime.now().toSQL())
      .where({ failed: false })
      .forUpdate()
      .first()
  }

  /**
   * Get job from database by its ID
   */
  public getJob (id: number): Promise<JobRecord | null> {
    return this.database
      .from(this.config.tableName)
      .where('available_at', '<', DateTime.now().toSQL())
      .where({ id: id })
      .first()
  }

  /**
   * Re-schedule job (update attempts and available_at) in Database
   */
  public async reSchedule (job: JobRecord, retryAfter: number) {
    await this.database
      .from(this.config.tableName)
      .where({ id: job.id })
      .update({
        attempts: job.attempts += 1,
        available_at: DateTime.now().plus({ seconds: retryAfter }),
      })
  }

  /**
   * Mark job as failed in database
   */
  public async markFailed (id: number) {
    await this.database
      .from(this.config.tableName)
      .where({ id: id })
      .update({ failed: true })
  }

  /**
   * Remove job from database
   */
  public async remove (id: number): Promise<void> {
    await this.database
      .from(this.config.tableName)
      .where({ id: id })
      .delete()
  }
}
