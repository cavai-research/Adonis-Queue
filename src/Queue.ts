import MemoryQueue from './drivers/MemoryQueue'
// import NullQueue from './drivers/NullQueue'
const { Worker } = require('worker_threads')

export default class Queue {
  public queue
  public worker

  constructor(private config) {
    // TODO: Add actual queue manager
    // Also there might be cases where consumers have multiple queues, quite like with DB connections
    // Something like Queue.get('redis').enqueue('foobar') or Queue('redis').enqueue('foobar')
    // would come handy
    this.queue = new MemoryQueue()
    this.queue.push('test', 'foobar', {})
    this.worker = new Worker('./worker')
  }

  // Based on queue driver

  public async run() {
    let job = await this.queue.pop()
  }
}
