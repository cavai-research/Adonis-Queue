import DatabaseDriver from './Drivers/Database.js'

export interface JobRecord {
  id: number
  class_path: string
  payload: any
  created_at: Date
  available_at: Date
  attempts: number
  failed: boolean
}

export abstract class QueueDriver {
  /**
   * Stores job to storage for future processing
   *
   * @param path Path to job class
   * @param payload Additional job payload
   */
  public abstract store (path: string, payload: any): Promise<void>

  /**
   * Get next job from the queue
   *
   * @returns Next job or null
   */
  public abstract getNext (): Promise<JobRecord | null>

  /**
   * Find job by its ID
   *
   * @param id Job ID
   * @returns Found job or null
   */
  public abstract getJob (id: number): Promise<JobRecord | null>

  /**
   * Re-schedule job for later execution
   *
   * @param job Job record
   * @param retryAfter Seconds after what to re-try execution
   */
  public abstract reSchedule (job: JobRecord, retryAfter: number): Promise<void>

  /**
   * Mark job as failed
   *
   * @param id Job ID
   */
  public abstract markFailed (id: number): Promise<void>

  /**
   * Removes job from queue
   *
   * @param id Job ID
   */
  public abstract remove (id: number): Promise<void>
}

/**
 * Config needed bu the database driver config
 */
export type DatabaseDriverConfig = {
  tableName: string
}

/**
 * A list of drivers with a unique name.
 */
export interface QueueDriverList {
  db: (config: DatabaseDriverConfig) => DatabaseDriver
}

export type QueueManagerFactory = () => QueueDriver
