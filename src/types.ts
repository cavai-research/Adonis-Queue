import { DateTime } from 'luxon'
import DatabaseDriver from './drivers/database.js'
import type { Job } from './job.js'

export interface JobRecord {
  id: number | string
  class_path: string
  payload: any
  created_at: string
  available_at: string
  attempts: number
  failed: boolean
}

export interface StoreOptions {
  availableAt?: DateTime
  [key: string | number | symbol]: any
}

export abstract class QueueDriver {
  /**
   * Delay in ms how often to check for new jobs
   * or keep calling execute()
   */
  pollingDelay? = 2000

  /**
   * Stores job to storage for future processing
   *
   * @param path Path to job class
   * @param payload Additional job payload
   * @param options Additional driver specific options
   */
  abstract store(path: string, payload: any, options?: StoreOptions): Promise<JobRecord>

  /**
   * Get next job from the queue
   *
   * @param options Additional driver specific options
   * @returns Next job or null
   */
  abstract getNext(options?: any): Promise<Job | null>

  /**
   * Find job by its ID
   *
   * @param id Job ID
   * @param options Additional driver specific options
   * @returns Found job or null
   */
  abstract getJob(id: number | string, options?: any): Promise<Job | null>

  /**
   * Re-schedule job for later execution
   *
   * @param job Job record
   * @param retryAfter Seconds after what to re-try execution
   * @param options Additional driver specific options
   */
  abstract reSchedule(job: Job, retryAfter: number, options?: any): Promise<void>

  /**
   * Mark job as failed
   *
   * @param id Job ID
   * @param options Additional driver specific options
   */
  abstract markFailed(job: Job, options?: any): Promise<void>

  /**
   * Removes job from queue
   *
   * @param id Job ID
   * @param options Additional driver specific options
   */
  abstract remove(id: number | string, options?: any): Promise<void>
}

/**
 * Config needed by the database driver config
 */
export type DatabaseDriverConfig = {
  tableName: string
  pollingDelay: number
}

/**
 * A list of drivers with a unique name.
 */
export interface QueueDriverList {
  database: (config: DatabaseDriverConfig) => DatabaseDriver
}

export type QueueManagerFactory = () => QueueDriver
