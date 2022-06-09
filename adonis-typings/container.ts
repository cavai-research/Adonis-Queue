declare module '@ioc:Adonis/Core/Application' {
  import Queue from '@ioc:Cavai/Adonis-Queue'

  export interface ContainerBindings {
    'Cavai/Adonis-Queue': typeof Queue
  }
}
