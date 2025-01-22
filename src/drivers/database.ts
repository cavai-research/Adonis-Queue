import { DateTime } from 'luxon'
import SuperJSON from 'superjson'
import type { Database } from '@adonisjs/lucid/database'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { DatabaseDriverConfig, JobRecord, QueueDriver, StoreOptions } from '../types.js'

export default class DatabaseDriver implements QueueDriver {
  #trx?: TransactionClientContract
  #database: Database
  pollingDelay: number

  constructor(
    protected config: DatabaseDriverConfig,
    database: Database
  ) {
    this.pollingDelay = config.pollingDelay || 2000
    this.#database = database
  }

  /**
   * Store job to database
   */
  async store(path: string, payload: any, options?: StoreOptions) {
    const job = await this.#database
      .table(this.config.tableName)
      .insert({
        class_path: path,
        payload: SuperJSON.serialize(payload),
        available_at: options?.availableAt || DateTime.now().toSQL({ includeOffset: false }),
      })
      .returning('id')

    return {
      id: job[0].id,
    }
  }

  /**
   * Get next job from database
   */
  async getNext(): Promise<JobRecord | null> {
    this.#trx = await this.#database.transaction()
    const job = await this.#trx
      .from(this.config.tableName)
      .where('available_at', '<', DateTime.now().toSQL({ includeOffset: false }))
      .where({ failed: false })
      .forUpdate()
      .skipLocked()
      .first()

    if (!job) {
      await this.#trx.commit()
      return null
    }

    return job
  }

  /**
   * Get job from database by its ID
   */
  getJob(id: number | string): Promise<JobRecord | null> {
    return this.#database
      .from(this.config.tableName)
      .where('available_at', '<', DateTime.now().toSQL({ includeOffset: false }))
      .where({ id: id })
      .first()
  }

  /**
   * Re-schedule job (update attempts and available_at) in Database
   */
  async reSchedule(job: JobRecord, retryAfter: number) {
    if (!this.#trx) {
      throw new Error('Cannot reschedule job without an active transaction')
    }

    await this.#trx
      .from(this.config.tableName)
      .where({ id: job.id })
      .update({
        attempts: job.attempts + 1,
        available_at: DateTime.now().plus({ seconds: retryAfter }),
      })
    await this.#trx.commit()
  }

  /**
   * Mark job as failed in database
   */
  async markFailed(job: JobRecord) {
    if (!this.#trx) {
      throw new Error('Cannot mark job as failed without an active transaction')
    }

    await this.#trx.from(this.config.tableName).where({ id: job.id }).update({
      failed: true,
      attempts: job.attempts,
    })
    await this.#trx.commit()
  }

  /**
   * Remove job from database
   */
  async remove(id: number | string): Promise<void> {
    if (!this.#trx) {
      throw new Error('Cannot remove job without an active transaction')
    }

    await this.#trx.from(this.config.tableName).where({ id: id }).delete()
    await this.#trx.commit()
  }
}
