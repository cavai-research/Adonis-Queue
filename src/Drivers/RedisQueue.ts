import BeeQueue from 'bee-queue'

export default class RedisQueue {
  private queue = new BeeQueue(this.config.name)

  constructor(private config, private app) {
    console.log('Initialized')
  }

  public async add(params) {
    return this.queue.createJob(params).save()
  }

  public process(cb) {
    this.queue.process(cb)
  }
}
