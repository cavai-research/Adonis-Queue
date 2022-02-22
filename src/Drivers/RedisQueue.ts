import BeeQueue from 'bee-queue'
import { DriverContract, JobContract } from '@ioc:Cavai/Queue'

export default class RedisQueue implements DriverContract {
  private queue = new BeeQueue(this.config.name)

  // @ts-ignore unused app variable
  constructor(private config, private app) {}

  /**
   * Adds job to queue to be processed
   *
   * @param payload Payload to queue for processing
   */
  public async add<T extends Record<string, any>>(payload: T): Promise<JobContract<T>> {
    const job = await this.queue.createJob<T>(payload).save()
    return {
      id: job.id,
      payload: job.data,
      progress: job.progress,
      reportProgress: job.reportProgress,
    }
  }

  /**
   * Starts processing queued jobs
   *
   * @param cb Callback to execute. Callback is the job executor
   * which receives queued job
   */
  public process(cb) {
    const remappedCallback = (data) => {
      return cb({
        id: data.id,
        payload: data.data,
        progress: data.progress,
      })
    }

    this.queue.process(remappedCallback)
  }

  /**
   * Gets job by ID
   *
   * @param id Job ID
   */
  public async getJob(id: string | number): Promise<JobContract<any> | null> {
    const job = await this.queue.getJob(String(id))
    if (!job) {
      return null
    }

    return {
      id: job.id,
      payload: job.data,
      progress: job.progress,
      reportProgress: job.reportProgress,
    }
  }
}
