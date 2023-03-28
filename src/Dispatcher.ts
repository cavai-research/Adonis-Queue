import { DateTime } from "luxon";

export default class Dispatcher implements Promise<void> {
  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  public catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Promise<T | TResult> {
    return this.exec().catch(onrejected);
  }

  public finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this.exec().finally(onfinally);
  }

  private availableAt: DateTime;

  constructor(
    private classPath,
    private name,
    private queueManager,
    private data
  ) {}

  public async exec() {
    if (!this.classPath) {
      throw new Error(`classPath param missing in ${this.name}`);
    }

    let payload = {
      classPath: this.classPath,
      data: this.data,
      version: "v1",
    };

    await this.queueManager.store(this.classPath, payload, {
      availableAt: this.availableAt,
    });
  }

  /**
   * Delay job execution until given time
   *
   * @param time Time after what job will be available for execution
   */
  public delay(time) {
    this.availableAt = time;
    return this;
  }
}
