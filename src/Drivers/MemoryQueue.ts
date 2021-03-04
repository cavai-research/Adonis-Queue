import { DriverContract, JobContract } from '@ioc:Cavai/Queue'

const QUEUE_POLLING_DELAY = 200

export default class MemoryQueue implements DriverContract {
  private queue = {}
  private idCounter = 0

  constructor(private config, private app) {
    console.log('Initialized memory queue')
    import(this.app.startPath('jobs'))
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
    }
    this.queue[this.idCounter] = job
    return job
  }

  /**
   * Starts processing queued jobs. If no jobs in queue,
   * then starts polling queue for new ones
   *
   * @param cb Callback to execute. Callback is the job executor
   * which receives queued job payload
   */
  public process(cb) {
    const work = () => {
      const nextJobId = Object.keys(this.queue)[0]
      if (nextJobId) {
        cb(this.queue[nextJobId])
        delete this.queue[nextJobId]
      }
      setTimeout(() => {
        work()
      }, QUEUE_POLLING_DELAY)
    }
    work()
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
