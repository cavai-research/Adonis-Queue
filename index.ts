import { QueueManager } from './src/QueueManager'
export { BaseJob } from './src/BaseJob'
export { QueueManager }

declare module '@ioc:Adonis/Core/Application' {
  export interface ContainerBindings {
    'Cavai/Adonis-Queue': QueueManager
  }
}

export default class {}
