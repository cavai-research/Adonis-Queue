import { DriverContract, JobContract } from '@ioc:Cavai/Queue'

export default class MemoryQueue implements DriverContract {
  private queue = {}
  private idCounter = 0
  private booted = false
  private poller = null

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
        nextJobId++
      }
      this.poller = setTimeout(() => {
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
  public async getJob(id: string | number): Promise<JobContract<any> | null> {
    return this.queue[id] || null
  }

  public async close(): Promise<void> {
    if (!this.poller) return
    clearTimeout(this.poller)
    this.poller = null
  }
}
