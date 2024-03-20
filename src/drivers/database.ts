// import { DatabaseContract, TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { Database } from '@adonisjs/lucid/database'
import { DateTime } from 'luxon'
import SuperJSON from 'superjson'
import { DatabaseDriverConfig, JobMeta, JobRecord, QueueDriver, StoreOptions } from '../types.js'
import type { Logger } from '@adonisjs/core/logger'

export default class DatabaseDriver implements QueueDriver {
  pollingDelay: number
  /**
   * Get next opens up transaction
   * That transaction must be open until lifetime of job
   * And must be closed when
   * - Job crashes
   * - Job is finished
   * - Job is re-queued
   */
  #trx?: TransactionClientContract

  constructor(
    protected config: DatabaseDriverConfig,
    protected database: Database,
    protected logger: Logger
  ) {
    this.pollingDelay = this.config.pollingDelay || 2000
  }

  /**
   * Store job to database
   */
  async store(path: string, payload: any, options?: StoreOptions) {
    const job: JobRecord[] = await this.database
      .table(this.config.tableName)
      .insert({
        class_path: path,
        payload: SuperJSON.serialize(payload),
        available_at: options?.availableAt || DateTime.now().toSQL({ includeOffset: false }),
      })
      .returning('*')

    return job[0]
  }

  /**
   * Get next job from database
   */
  async getNext() {
    this.#trx = await this.database.transaction()
    const job: JobRecord | null = await this.#trx
      .from(this.config.tableName)
      .where('available_at', '<', DateTime.now().toSQL({ includeOffset: false }))
      .where({ failed: false })
      .forUpdate()
      .skipLocked()
      .first()

    if (!job) {
      // If there's no job to execute, we don't need to keep transaction with lock
      await this.#trx.commit()
    }

    return job
  }

  /**
   * Get job from database by its ID
   */
  async getJob(id: JobRecord['id']) {
    let job: JobRecord | null = await this.database
      .from(this.config.tableName)
      .where('available_at', '<', DateTime.now().toSQL({ includeOffset: false }))
      .where({ id: id })
      .first()

    return job
  }

  /**
   * Re-schedule job (update attempts and available_at) in Database
   */
  async reSchedule(job: JobRecord, retryAfter: number) {
    await this.#trx!.from(this.config.tableName)
      .where({ id: job.id })
      .update({
        attempts: job.attempts,
        available_at: DateTime.now().plus({ seconds: retryAfter }),
      })
    await this.#trx!.commit()
  }

  /**
   * Mark job as failed in database
   */
  async markFailed(job: JobRecord) {
    await this.#trx!.from(this.config.tableName).where({ id: job.id }).update({
      failed: true,
      attempts: job.attempts,
    })

    await this.#trx!.commit()
  }

  /**
   * Remove job from database
   */
  async remove(id: JobRecord['id']) {
    await this.#trx!.from(this.config.tableName).where({ id: id }).delete()
    await this.#trx!.commit()
  }

  /**
   * Release job lock. This allows other queue instances to pick up same job
   * Useful for testing and debugging
   */
  async release() {
    await this.#trx?.commit()
  }
}
