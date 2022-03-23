import { DriverContract, JobContract } from '@ioc:Cavai/Queue'

export default class MemoryQueue implements DriverContract {
  private queue = {}
  private newJobId = 1
  private nextJobId = 1
  private booted = false
  private poller: NodeJS.Timeout | null = null
  private processing: boolean = false
  private processor: ((job: JobContract<any>) => void) | null = null

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
    const job = {
      payload: payload || {},
      id: this.newJobId++,
      progress: 0,
      reportProgress: function (progress) {
        this.progress = progress
      },
    }
    this.queue[job.id] = job
    this.start()

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
    this.processor = cb
    this.start()
  }

  private start() {
    if (this.poller || this.processing) return
    if (!this.processor) return

    const { pollingDelay = 200 } = this.config.config
    const postpone = () => (this.poller = setTimeout(work, pollingDelay))

    const work = async () => {
      if (!this.processor) return
      try {
        this.processing = true
        this.poller = null

        const job = this.queue[this.nextJobId]
        if (!job) return

        this.nextJobId++

        if (job.status !== 'done') {
          await this.processor(job)
          job.status = 'done'
        }

        postpone()
      } catch {
        postpone()
      } finally {
        this.processing = false
      }
    }

    postpone()
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
