import BeeQueue from 'bee-queue'
import { DriverContract, JobContract } from '@ioc:Cavai/Queue'

export default class RedisQueue implements DriverContract {
  private queue = new BeeQueue(this.config.name)

  // @ts-ignore unused app variable
  constructor(private config, private app) {}

  public async add<T extends Record<string, any>>(payload: T): Promise<JobContract<T>> {
    const job = await this.queue.createJob<T>(payload).save()
    return {
      id: job.id,
      payload: job.data,
    }
  }

  public process(cb) {
    this.queue.process(cb)
  }

  public async getJob(id: string | number): Promise<JobContract<any>> {
    const job = await this.queue.getJob(String(id))

    return {
      id: job.id,
      payload: job.data,
    }
  }
}
