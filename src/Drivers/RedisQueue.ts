import BeeQueue from 'bee-queue'
import { DriverContract, JobContract } from '@ioc:Cavai/Queue'

const unwrap = (job) => ({
  id: job.id,
  payload: job.data,
  progress: job.progress,
  reportProgress(progress) {
    this.progress = progress
    return job.reportProgress(progress)
  },
})

export default class RedisQueue implements DriverContract {
  private queue: BeeQueue | null = null

  // @ts-ignore unused app variable
  constructor(private config, private app) {}

  private getQueue(): BeeQueue {
    if (this.queue) return this.queue

    this.queue = new BeeQueue(this.config.name)
    return this.queue
  }

  /**
   * Adds job to queue to be processed
   *
   * @param payload Payload to queue for processing
   */
  public async add<T extends Record<string, any>>(payload: T): Promise<JobContract<T>> {
    const job = await this.getQueue().createJob<T>(payload).save()
    return unwrap(job)
  }

  /**
   * Starts processing queued jobs
   *
   * @param cb Callback to execute. Callback is the job executor
   * which receives queued job
   */
  public process(cb) {
    // BeeQueue breaks if callback is NOT async
    const remappedCallback = async (job) => await cb(unwrap(job))
    this.getQueue().process(remappedCallback)
  }

  /**
   * Gets job by ID
   *
   * @param id Job ID
   */
  public async getJob(id: string | number): Promise<JobContract<any> | null> {
    const job = await this.getQueue().getJob(String(id))
    return !job ? null : unwrap(job)
  }

  public async close(): Promise<void> {
    if (!this.queue) return
    await this.queue.close()
    this.queue = null
  }
}
