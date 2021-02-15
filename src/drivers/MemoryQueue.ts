interface QueuedJob {
  job: any
  payload: any
  config: any
}

export default class MemoryQueue {
  protected queue: { [key: string]: QueuedJob[] }
  /**
   * Get the size of the queue
   */
  public async size(queue) {
    this.queue['foo']
    return this.queue[queue].length
  }

  /**
   * Push job into queue
   */
  public async push(job, payload, config) {
    this.queue[config.queue].push({ job, payload, config })
  }

  /**
   * Get next job from the queue
   */
  public async pop(queue) {
    return this.queue[queue].pop()
  }
}
