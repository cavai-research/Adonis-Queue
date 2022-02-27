import { Expect } from '@japa/expect'

declare module '@japa/runner' {
  interface TestContext {
    // notify TypeScript about custom context properties
    expect: Expect
  }

  interface Test<Context, TestData> {
    // notify TypeScript about custom test properties
  }
}
