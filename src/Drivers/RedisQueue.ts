import BeeQueue from 'bee-queue'
import { DriverContract, JobContract } from '@ioc:Cavai/Queue'

export default class RedisQueue implements DriverContract {
  private queue = new BeeQueue(this.config.name)

  constructor(private config, private app) {
    console.log('Initialized')
  }

  public async add<T extends Record<string, any>>(params: T): Promise<JobContract<T>> {
    const job = await this.queue.createJob<T>(params).save()
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
