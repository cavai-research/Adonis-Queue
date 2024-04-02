import { DateTime } from 'luxon'
import { BaseJob } from './base_job.js'

type DispatcherResult = { id: number | string }

export class Dispatcher<T extends typeof BaseJob> implements Promise<DispatcherResult> {
  then<TResult1 = DispatcherResult, TResult2 = never>(
    onfulfilled?:
      | ((value: DispatcherResult) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<DispatcherResult | TResult> {
    return this.exec().catch(onrejected)
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<DispatcherResult> {
    return this.exec().finally(onfinally)
  }

  /**
   * Required when Promises are extended
   */
  get [Symbol.toStringTag]() {
    return this.constructor.name
  }

  /**
   * Set time before what job is not available for execution
   */
  #availableAt?: DateTime

  constructor(
    private job: T,
    private data: ConstructorParameters<T>
  ) {}

  /**
   * Execute promise, storing job to storage using defined driver
   */
  async exec() {
    if (!this.job.classPath) {
      throw new Error(`classPath param missing in ${this.job.name}`)
    }

    let payload = {
      classPath: this.job.classPath,
      data: this.data,
      version: 'v1',
    }

    return this.job.queueManager.store(this.job.classPath, payload, {
      availableAt: this.#availableAt,
    })
  }

  /**
   * Delay job execution until given time
   *
   * @param time Time after what job will be available for execution
   */
  delay(time: DateTime) {
    this.#availableAt = time
    return this
  }
}
