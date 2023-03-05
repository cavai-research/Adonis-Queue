import { QueueDriverList } from './DriversCollection'

export function defineConfig<KnownQueues extends Record<string, {
  [K in keyof QueueDriverList]: { driver: K } & Parameters<QueueDriverList[K]>[0]
}[keyof QueueDriverList]
>> (config: {
  default: keyof KnownQueues
  list: KnownQueues
}) {

}
