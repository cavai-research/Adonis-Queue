import { test } from '@japa/runner'
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
          user: 'postgres',
          password: 'postgres',
          database: 'postgres',
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

    assert.exists(driver.store)
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

    assert.isNotNull(job)
    assert.containsSubset(job, {
      attempts: 0,
      class_path: 'test',
      failed: false,
    })

    await db.manager.closeAll()
  })

  test('Get next job', async ({ assert }) => {
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

    assert.isNotNull(job)
    assert.containsSubset(job, {
      attempts: 0,
      classPath: 'test',
      failed: false,
    })

    // Job that's gotten with "getNext" must be released back to queue
    await job!.release()
  })

  test('Payload serialization is OK', async ({ assert }) => {
    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db,
      logger
    )

    let randomPayload = Math.random()
    await driver.store('test', {
      foo: 'bar',
      randomPayload,
    })

    let job = await driver.getNext()
    assert.isNotNull(job)

    assert.deepEqual(job!.payload, {
      foo: 'bar',
      randomPayload,
    })

    await job?.release()
  })

  test('Get job by ID', async ({ assert }) => {
    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db,
      logger
    )

    await driver.store('test', { foo: 'bar' })
    // Get next job
    let nextJob = await driver.getNext()
    assert.isNotNull(nextJob)
    await nextJob?.release()

    // Use that same job ID to get it by ID
    const job = await driver.getJob(nextJob!.id)
    assert.isNotNull(job)

    assert.isNotNull(job)
    assert.deepEqual(job!.payload, nextJob!.payload)
    assert.deepEqual(job!.id, nextJob!.id)
  })

  test('Get non existing job', async ({ assert }) => {
    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db,
      logger
    )

    // Get next job
    let nextJob = await driver.getNext()
    assert.isNull(nextJob)
    await nextJob?.release()
  })

  test('Re schedule job', async ({ assert }) => {
    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db,
      logger
    )

    await driver.store('test', { foo: 'bar' })
    let nextJob = await driver.getNext()
    assert.isNotNull(nextJob)

    assert.equal(nextJob!.attempts, 0)
    await nextJob!.reSchedule(2)

    await setTimeout(3000)

    const reScheduled = await driver.getNext()
    assert.isNotNull(reScheduled)

    await reScheduled!.release()
    assert.isNotNull(reScheduled)
    assert.equal(reScheduled!.attempts, 1)

    // Test doesn't finish without manual close
    // Group level close doesn't work, coz that's another instance
    // await db.manager.closeAll()
  }).timeout(5000)

  test('Mark job as failed', async ({ assert }) => {
    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db,
      logger
    )

    await driver.store('test', { foo: 'bar' })
    let nextJob = await driver.getNext()
    assert.isNotNull(nextJob)
    assert.isFalse(nextJob!.failed)

    await nextJob!.markFailed()

    const job = await driver.getJob(nextJob!.id)
    assert.isNotNull(job)

    assert.isNotNull(job!.id)
    assert.isTrue(job!.failed)
  })

  test('Delete job', async ({ assert }) => {
    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db,
      logger
    )

    await driver.store('test', { foo: 'bar' })
    let nextJob = await driver.getNext()
    assert.isNotNull(nextJob)
    assert.isFalse(nextJob!.failed)
    await nextJob!.remove()

    const job = await driver.getJob(nextJob!.id)
    assert.isNull(job)
  })
})
