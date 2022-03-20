import { Expect } from '@japa/expect'
import Queue from '../src/Queue'

declare module '@japa/runner' {
  interface TestContext {
    // notify TypeScript about custom context properties
    expect: Expect
    queues: Queue
  }

  interface Test<Context, TestData> {
    // notify TypeScript about custom test properties
  }
}
