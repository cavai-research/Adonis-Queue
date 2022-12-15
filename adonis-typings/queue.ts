declare module '@ioc:Cavai/Adonis-Queue' {
  import { InsertQueryBuilderContract } from '@ioc:Adonis/Lucid/Database'

  export type Config = any

  export interface QueueContract {
    execute(payload?: any): void
    store(classPath, payload?: any): Promise<any>
  }

  const Queue: QueueContract
  export default Queue
}
