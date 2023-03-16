/**
 * Queue configuration file, all queue config variables are in here
 */
import { defineConfig } from '@cavai/adonis-queue/build'

export default defineConfig({
  /**
   * Which driver to use by default
   */
  default: 'database',

  queues: {
    database: {
      driver: 'database',
      /**
       * Table name where jobs are queued, stored and managed
       * Has to be the same as table name in migration file
       */
      tableName: 'adonis_jobs',
      /**
       * Delay how often database is polled to check new jobs
       * Smaller delay reduces time between job executions
       * but increases load on database server
       * Delay is in milliseconds
       */
      pollingDelay: 2000,
    },
  },
})

