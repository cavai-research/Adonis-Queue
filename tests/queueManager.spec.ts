import { test } from '@japa/runner'
import DatabaseDriver from '../src/Drivers/Database'
import { QueueManager } from '../src/QueueManager'
import { createDatabase, createLogger, setup } from '../test-helpers'

test.group('QueueManager', (group) => {
  group.each.setup(setup)

  test('Create instance of QueueManager', async ({ expectTypeOf }) => {
    // Test logic goes here
    const db = createDatabase()
    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db
    )

    const queueManager = new QueueManager(
      {
        default: 'db',
        queues: {
          db: () => driver,
        },
      },
      createLogger(),
      '/tmp/place'
    )

    // Test types
    expectTypeOf(queueManager.use).parameter(0).toEqualTypeOf<'db'>()
  })
})
