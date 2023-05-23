import DriversCollection from './src/DriversCollection'
import { QueueManager } from './src/QueueManager'

declare module '@ioc:Adonis/Core/Application' {
  export interface ContainerBindings {
    'Cavai/Adonis-Queue': QueueManager<any>
  }
}

export { QueueManager }
export { BaseJob } from './src/BaseJob'
export { defineConfig } from './src/DefineConfig'
export { Dispatcher } from './src/Dispatcher'
export { DriversCollection }

export * from './src/types'

import QueueProvider from './providers/QueueProvider'
export default QueueProvider
