import BeeQueue from 'bee-queue'

export default class MemoryQueue {
  private queue = new BeeQueue(this.config.name)

  constructor(private config, private app) {
    console.log('Initialized memory queue')
  }

  public process(cb) {
    this.queue.process(cb)
  }

  public async add(params) {
    return this.queue.createJob(params).save()
  }

  public getJob(id) {
    return this.queue.getJob(id)
  }
}
