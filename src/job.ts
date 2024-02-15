import { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DatabaseDriverConfig, JobRecord, QueueDriver } from './types.js'
import { DateTime } from 'luxon'
import type DatabaseDriver from './drivers/database.js'

export class Job {
  constructor(
    public id: string | number,
    public createdAt: DateTime,
    public availableAt: DateTime,
    public attempts: number,
    public failed: boolean,
    public driver: QueueDriver,
    // public record: JobRecord,
    // public driver: QueueDriver
    // public config: DatabaseDriverConfig,
    // public trx: TransactionClientContract
    ..._: any[]
  ) {}

  /**
   * Re-schedule job (update attempts and available_at) in Database
   */
  async reSchedule(retryAfter: number) {
    this.attempts++
    this.driver.reSchedule(this.record, retryAfter)
  }

  /**
   * Mark job as failed in database
   */
  async markFailed() {
    this.driver.markFailed(this.record)
  }

  /**
   * Remove job from database
   */
  async remove(): Promise<void> {
    await this.trx.from(this.config.tableName).where({ id: this.record.id }).delete()
    await this.trx.commit()
  }

  async release() {
    await this.trx.commit()
  }
}
