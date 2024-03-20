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
    assert.exists(driver.getNext)
    assert.exists(driver.getJob)
    assert.exists(driver.reSchedule)
    assert.exists(driver.markFailed)
    assert.exists(driver.remove)
    assert.exists(driver.release)
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

    assert.exists(job.id)
    assert.exists(job.created_at)
    assert.exists(job.available_at)
    assert.containsSubset(job, {
      attempts: 0,
      class_path: 'test',
      failed: false,
      payload: '{"json":{"foo":"bar"}}',
    })
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
    // Job that's gotten with "getNext" must be executed or released back to queue
    await driver.release()

    assert.isNotNull(job)
    assert.exists(job!.id)
    assert.exists(job!.created_at)
    assert.exists(job!.available_at)
    assert.containsSubset(job, {
      attempts: 0,
      class_path: 'test',
      failed: false,
      payload: '{"json":["foo",{"bar":"baz"}]}',
    })
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
    await driver.release()

    // Use that same job ID to get it by ID
    const job = await driver.getJob(nextJob!.id)
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
    // No need to release, if there's no job
    // Since there's no job to be executed
    // await driver.release()
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
    nextJob!.attempts++
    await driver.reSchedule(nextJob!, 2)

    await setTimeout(3000)

    const reScheduled = await driver.getNext()
    assert.isNotNull(reScheduled)

    await driver.release()
    assert.isNotNull(reScheduled)
    assert.equal(reScheduled!.attempts, 1)
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

    await driver.markFailed(nextJob!)

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
    await driver.remove(nextJob!.id)

    const job = await driver.getJob(nextJob!.id)
    assert.isNull(job)
  })
})
