interface Dictionary<T> {
  [key: string]: T
}

declare module '@ioc:Cavai/Adonis-Queue' {
  export type Config = any

  export type ExtendCallback = (config: Config, app) => DriverContract

  export interface QueueContract {
    use(mappingName: string): DriverContract
    extend(driverName: string, callback: ExtendCallback)
    closeAll(): Promise<void>
  }

  export interface JobContract<T extends Record<string, any>> {
    id: string | number
    runAt: number
    delayed: boolean
    payload: T
    progress?: any
    reportProgress(progress: any): void
  }

  export interface AddOptions {
    runAt?: number
  }

  export interface DriverContract {
    add<T extends Record<string, any>>(payload: T, options?: AddOptions): Promise<JobContract<T>>
    process(callback: (job: JobContract<any>) => Promise<void>): void
    getJob(id: number | string): Promise<JobContract<any> | null>
    close(): Promise<void>
  }

  const Queue: QueueContract
  export default Queue
}
