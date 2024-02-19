// import { DatabaseContract, TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { Database } from '@adonisjs/lucid/database'
import { DateTime } from 'luxon'
import SuperJSON from 'superjson'
import { DatabaseDriverConfig, JobRecord, QueueDriver, StoreOptions } from '../types.js'
import { Job } from '../job.js'
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
  async store(path: string, payload: any, options?: StoreOptions): Promise<Job> {
    const job: JobRecord[] = await this.database
      .table(this.config.tableName)
      .insert({
        class_path: path,
        payload: SuperJSON.serialize(payload),
        available_at: options?.availableAt || DateTime.now().toSQL({ includeOffset: false }),
      })
      .returning('*')

    return new Job(
      job[0].id,
      DateTime.fromSQL(job[0].created_at),
      DateTime.fromSQL(job[0].available_at),
      job[0].attempts,
      job[0].failed,
      job[0].class_path,
      this,
      SuperJSON.parse(job[0].payload)
    )
  }

  /**
   * Get next job from database
   */
  async getNext(): Promise<Job | null> {
    this.#trx = await this.database.transaction()
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

    return new Job(
      job.id,
      job.created_at,
      job.available_at,
      job.attempts,
      job.failed,
      job.class_path,
      this,
      SuperJSON.parse(job.payload)
    )
  }

  /**
   * Get job from database by its ID
   */
  async getJob(id: number | string): Promise<Job | null> {
    let jobRecord = await this.database
      .from(this.config.tableName)
      .where('available_at', '<', DateTime.now().toSQL({ includeOffset: false }))
      .where({ id: id })
      .first()

    if (!jobRecord) {
      return null
    }

    return new Job(
      jobRecord.id,
      jobRecord.created_at,
      jobRecord.available_at,
      jobRecord.attempts,
      jobRecord.failed,
      jobRecord.class_path,
      this,
      SuperJSON.parse(jobRecord.payload)
    )
  }

  /**
   * Re-schedule job (update attempts and available_at) in Database
   */
  async reSchedule(job: Job, retryAfter: number) {
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
  async remove(id: number | string): Promise<void> {
    await this.#trx!.from(this.config.tableName).where({ id: id }).delete()
    await this.#trx!.commit()
  }

  async release() {
    await this.#trx?.commit()
  }
}
