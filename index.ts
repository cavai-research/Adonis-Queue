export { BaseJob } from './src/BaseJob'
import { QueueManager } from './src/QueueManager'
export { QueueManager }

declare module '@ioc:Adonis/Core/Application' {
  export interface ContainerBindings {
    'Cavai/Adonis-Queue': QueueManager
  }
}

export default class {}
