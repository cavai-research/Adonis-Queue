import { DriverContract, JobContract } from '@ioc:Cavai/Queue'

export default class MemoryQueue implements DriverContract {
  private queue = {}
  private idCounter = 0
  private booted = false

  constructor(private config, private app) {
    this.boot()
  }

  /**
   * Initializes memory queue
   */
  public async boot() {
    if (this.booted) {
      return
    }
    await import(this.app.startPath('jobs'))
    this.booted = true
  }

  /**
   * Adds job to queue to be processed
   *
   * @param payload Payload to queue for processing
   */
  public async add<T extends Record<string, any>>(payload: T): Promise<JobContract<T>> {
    this.idCounter++
    const job = {
      payload,
      id: this.idCounter,
      progress: 0,
      reportProgress: function (progress) {
        this.progress = progress
      },
    }
    this.queue[this.idCounter] = job
    return job
  }

  /**
   * Starts processing queued jobs. If no jobs in queue,
   * then starts polling queue for new ones
   *
   * @param cb Callback to execute. Callback is the job executor
   * which receives queued job
   */
  public process(cb: (job: JobContract<any>) => void) {
    const work = async (nextJobId) => {
      if (this.queue[nextJobId] && this.queue[nextJobId].status !== 'done') {
        await cb(this.queue[nextJobId])
        this.queue[nextJobId].status === 'done'
        // delete this.queue[nextJobId]
        nextJobId++
      }
      setTimeout(() => {
        work(nextJobId++)
      }, this.config.config.pollingDelay || 200)
    }
    work(1)
  }

  /**
   * Gets job by ID
   *
   * @param id Job ID
   */
  public async getJob(id: string | number): Promise<JobContract<any>> {
    return this.queue[id]
  }
}
