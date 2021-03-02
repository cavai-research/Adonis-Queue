declare module '@ioc:Adonis/Core/Application' {
  import Queue from '@ioc:Cavai/Queue'

  export interface ContainerBindings {
    'Cavai/Queue': typeof Queue
  }
}
