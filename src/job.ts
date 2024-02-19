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
    public classPath: string,
    public driver: QueueDriver,
    public payload: any
    // public record: JobRecord,
    // public driver: QueueDriver
    // public config: DatabaseDriverConfig,
    // public trx: TransactionClientContract
    // ..._: any[]
  ) {}

  /**
   * Re-schedule job (update attempts and available_at) in Database
   */
  async reSchedule(retryAfter: number) {
    this.attempts++
    this.driver.reSchedule(this, retryAfter)
  }

  /**
   * Mark job as failed in database
   */
  async markFailed() {
    await this.driver.markFailed(this)
  }

  /**
   * Remove job from database
   */
  async remove(): Promise<void> {
    await this.driver.remove(this.id)
  }

  async release() {
    await this.driver.release()
  }
}
