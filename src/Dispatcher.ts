import { DateTime } from 'luxon'
import { BaseJob } from './BaseJob'

type DispatcherResult = void

export class Dispatcher<T extends typeof BaseJob> implements Promise<DispatcherResult> {
  public then<TResult1 = DispatcherResult, TResult2 = never>(
    onfulfilled?:
      | ((value: DispatcherResult) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected)
  }

  public catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<DispatcherResult | TResult> {
    return this.exec().catch(onrejected)
  }

  public finally(onfinally?: (() => void) | undefined | null): Promise<DispatcherResult> {
    return this.exec().finally(onfinally)
  }

  /**
   * Required when Promises are extended
   */
  public get [Symbol.toStringTag]() {
    return this.constructor.name
  }

  private availableAt: DateTime

  constructor(private job: T, private data: ConstructorParameters<T>) {}

  public async exec() {
    if (!this.job.classPath) {
      throw new Error(`classPath param missing in ${this.job.name}`)
    }

    let payload = {
      classPath: this.job.classPath,
      data: this.data,
      version: 'v1',
    }

    await this.job.queueManager.store(this.job.classPath, payload, {
      availableAt: this.availableAt,
    })
  }

  /**
   * Delay job execution until given time
   *
   * @param time Time after what job will be available for execution
   */
  public delay(time) {
    this.availableAt = time
    return this
  }
}
