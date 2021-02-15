export default class NullQueue {
  /**
   * Get the size of the queue
   * It's always 0 for NullQueue
   */
  public async size(queue = null) {
    return 0
  }

  /**
   * Push job into queue
   */
  public async push(job, payload, config) {
    // Do nothing
  }
}
