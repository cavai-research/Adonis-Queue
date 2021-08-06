declare module '@ioc:Cavai/Queue' {
  export type ExtendCallback = (queue: QueueContract) => DriverContract

  export interface QueueContract {
    use(mappingName: string): DriverContract
    extend(driverName: string, callback: ExtendCallback)
  }

  export interface JobContract<T extends Record<string, any>> {
    id: string | number
    payload: T
    progress?: any
  }

  export interface DriverContract {
    add<T extends Record<string, any>>(payload: T): Promise<JobContract<T>>
    // This proccess has wrong typings
    process(callback: (job: JobContract<any>) => Promise<void>): void
    getJob(id: number | string): Promise<JobContract<any>>
  }

  const Queue: QueueContract
  export default Queue
}
