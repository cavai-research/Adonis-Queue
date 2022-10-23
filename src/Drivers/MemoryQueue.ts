import { AddOptions, DriverContract, JobContract } from '@ioc:Cavai/Adonis-Queue'

export default class MemoryQueue implements DriverContract {
  private queue: JobContract<any>[] = []
  private index: { [k: string]: JobContract<any> } = {}
  private newJobId = 1
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
  public async add<T extends Record<string, any>>(
    payload: T,
    opts: AddOptions = {}
  ): Promise<JobContract<T>> {
    const job = {
      payload: payload || {},
      id: this.newJobId++,
      runAt: (opts.runAt && +new Date(opts.runAt)) || Date.now(),
      delayed: !!opts.runAt,
      progress: 0,
      reportProgress: function (progress) {
        this.progress = progress
      },
    }

    this.index[job.id] = job
    const { activateDelayedJobs = false } = this.config.config
    if (!job.delayed || activateDelayedJobs) {
      this.addToQueue(job)
      this.start()
    }

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
    const postpone = (ms?: number) => (this.poller = setTimeout(work, ms || pollingDelay))

    const work = async () => {
      if (!this.processor) return
      try {
        this.processing = true
        this.poller = null

        const job = this.queue[0]
        if (!job) return
        if (Date.now() < job.runAt) return postpone(job.runAt - Date.now())

        this.queue.shift()

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

  private addToQueue(job) {
    const start = this.queue.findIndex((d) => job.runAt < d.runAt)
    if (start < 0) this.queue.push(job)
    else this.queue.splice(start, 0, job)
  }

  /**
   * Gets job by ID
   *
   * @param id Job ID
   */
  public async getJob(id: string | number): Promise<JobContract<any> | null> {
    return this.index[id] || null
  }

  public async close(): Promise<void> {
    if (!this.poller) return
    clearTimeout(this.poller)
    this.poller = null
  }
}
