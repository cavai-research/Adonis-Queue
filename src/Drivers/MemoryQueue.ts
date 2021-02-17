import BeeQueue from 'bee-queue'

export default class MemoryQueue {
  private queue = new BeeQueue(this.config.name)

  constructor(private config, private app) {}

  public process(cb) {
    this.queue.process(cb)
  }
}
