import { test } from '@japa/runner'
import SuperJSON from 'superjson'
import DatabaseDriver from '../src/drivers/database.js'
import { Database } from '@adonisjs/lucid/database'
import { LoggerFactory } from '@adonisjs/core/factories/logger'
import { EmitterFactory } from '@adonisjs/core/factories/events'
import { AppFactory } from '@adonisjs/core/factories/app'
import { setTimeout } from 'node:timers/promises'

const logger = new LoggerFactory().create()
const app = new AppFactory().create(new URL('./', import.meta.url))
const emitter = new EmitterFactory().create(app)
const db = new Database(
  {
    connection: 'pg',
    connections: {
      pg: {
        client: 'pg',
        connection: {
          host: 'localhost',
          user: 'relancer',
          password: 'relancer',
          database: 'queue_test',
        },
      },
    },
  },
  logger,
  emitter
)

async function setup() {
  // Create DB
  await db.connection().schema.createTable('jobs', (table) => {
    table.bigIncrements('id').unsigned()
    table.string('class_path').notNullable()
    table.text('payload').nullable()

    table.timestamp('created_at').defaultTo(db.knexRawQuery('NOW()'))
    table.timestamp('available_at').defaultTo(db.knexRawQuery('NOW()'))

    table.integer('attempts').defaultTo(0)
    table.boolean('failed').defaultTo(false)
  })

  return async () => {
    // Teardown DB
    await db.connection().schema.dropTable('jobs')
    await db.manager.closeAll()
  }
}

test.group('Database driver', (group) => {
  group.each.setup(setup)
  group.teardown(async () => {
    await db.manager.closeAll()
  })

  test('Create instance of driver', async ({ assert }) => {
    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db,
      logger
    )
    console.log('DB driver made')

    assert.exists(driver.store)
    assert.exists(driver.getNext)
    assert.exists(driver.getJob)
  })

  test('Store job', async ({ assert, expectTypeOf }) => {
    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db,
      logger
    )

    expectTypeOf(driver.store).parameter(0).toEqualTypeOf<string>()

    await driver.store('test', { foo: 'bar' })

    let job = await db.from('jobs').first()
    console.log(job)

    assert.isNotNull(job)
    assert.containsSubset(job, {
      attempts: 0,
      class_path: 'test',
      failed: false,
    })
    console.log('Job made')

    // Test doesn't finish without manual close
    // Group level close doesn't work, coz that's another instance
    await db.manager.closeAll()
  })

  test('Get next job', async ({ assert }) => {
    try {
      const driver = new DatabaseDriver(
        {
          tableName: 'jobs',
          pollingDelay: 500,
        },
        db,
        logger
      )

      await driver.store('test', ['foo', { bar: 'baz' }])

      const job = await driver.getNext()
      console.log('Got next!')
      console.log(job)

      assert.isNotNull(job?.record)
      assert.containsSubset(job?.record, {
        attempts: 0,
        class_path: 'test',
        failed: false,
      })
      console.log('Gonna rlease?')

      await job!.release()
    } catch (error) {
      console.log(error)
    }
  }).pin()

  // test('Payload serialization is OK', async ({ assert }) => {
  //   const driver = new DatabaseDriver(
  //     {
  //       tableName: 'jobs',
  //       pollingDelay: 500,
  //     },
  //     db,
  //     logger
  //   )

  //   let randomPayload = Math.random()
  //   await driver.store('test', {
  //     foo: 'bar',
  //     randomPayload,
  //   })
  //   let job = await driver.getNext()
  //   await job?.release()

  //   const payload = SuperJSON.parse(job!.record.payload.data)
  //   assert.deepEqual(payload, {
  //     foo: 'bar',
  //     randomPayload,
  //   })

  //   // Test doesn't finish without manual close
  //   // Group level close doesn't work, coz that's another instance
  //   // await db.manager.closeAll()
  // })
  // // .pin()

  // test('Get job by ID', async ({ assert }) => {
  //   const driver = new DatabaseDriver(
  //     {
  //       tableName: 'jobs',
  //       pollingDelay: 500,
  //     },
  //     db,
  //     logger
  //   )

  //   await driver.store('test', { foo: 'bar' })
  //   let nextJob = await driver.getNext()
  //   await nextJob?.release()

  //   const job = await driver.getJob(nextJob!.record.payload.id)
  //   await job!.release()
  //   assert.isNotNull(job)
  //   assert.isNotNull(job!.record.payload.id)
  //   // Test doesn't finish without manual close
  //   // Group level close doesn't work, coz that's another instance
  //   // await db.manager.closeAll()
  // })

  // test('Re schedule job', async ({ assert }) => {
  //   const driver = new DatabaseDriver(
  //     {
  //       tableName: 'jobs',
  //       pollingDelay: 500,
  //     },
  //     db,
  //     logger
  //   )

  //   await driver.store('test', { foo: 'bar' })
  //   let nextJob = await driver.getNext()

  //   assert.equal(nextJob!.record.payload.attempts, 0)
  //   await nextJob!.reSchedule(2)

  //   await setTimeout(3000)

  //   const reScheduled = await driver.getNext()
  //   await reScheduled?.release()
  //   assert.isNotNull(reScheduled)
  //   assert.equal(reScheduled!.record.payload.attempts, 1)

  //   // Test doesn't finish without manual close
  //   // Group level close doesn't work, coz that's another instance
  //   // await db.manager.closeAll()
  // }).timeout(5000)

  // test('Mark job as failed', async ({ assert }) => {
  //   const driver = new DatabaseDriver(
  //     {
  //       tableName: 'jobs',
  //       pollingDelay: 500,
  //     },
  //     db,
  //     logger
  //   )

  //   await driver.store('test', { foo: 'bar' })
  //   let nextJob = await driver.getNext()

  //   assert.isFalse(nextJob!.record.payload.failed)
  //   await nextJob!.markFailed()

  //   const job = await driver.getJob(nextJob!.record.payload.id)
  //   assert.isNotNull(job)
  //   assert.isNotNull(job!.record.payload.id)
  //   assert.isTrue(job!.record.payload.failed)
  //   await job?.release()
  // })

  // test('Delete job', async ({ assert }) => {
  //   const driver = new DatabaseDriver(
  //     {
  //       tableName: 'jobs',
  //       pollingDelay: 500,
  //     },
  //     db,
  //     logger
  //   )

  //   await driver.store('test', { foo: 'bar' })
  //   let nextJob = await driver.getNext()

  //   assert.isFalse(nextJob!.record.payload.failed)

  //   await nextJob!.remove()

  //   const job = await driver.getJob(nextJob!.record.payload.id)
  //   await job?.release()
  //   assert.isNull(job)
  // })
})
