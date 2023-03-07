import { defineConfig } from './src/DefineConfig'
import { QueueManager } from './src/QueueManager'
export { BaseJob } from './src/BaseJob'
export { QueueManager }

declare module '@ioc:Adonis/Core/Application' {
  export interface ContainerBindings {
    'Cavai/Adonis-Queue': QueueManager<any>
  }
}

export { defineConfig }

export default class {}
