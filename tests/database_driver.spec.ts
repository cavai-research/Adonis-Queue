import { test } from '@japa/runner'
import SuperJSON from 'superjson'
import DatabaseDriver from '../src/drivers/database.js'
import { createDatabase, setup, sleep } from '../test-helpers/index.js'

test.group('Database driver', () => {
  test('Create instance of driver', async ({ assert, cleanup }) => {
    const db = createDatabase()
    cleanup(await setup(db))

    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db
    )

    assert.exists(driver.store)
    assert.exists(driver.getNext)
    assert.exists(driver.getJob)
    assert.exists(driver.remove)
    assert.exists(driver.reSchedule)
    assert.exists(driver.markFailed)
  })

  test('Store job', async ({ assert, expectTypeOf, cleanup }) => {
    const db = createDatabase()
    cleanup(await setup(db))

    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db
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

  test('Get next job', async ({ assert, cleanup }) => {
    const db = createDatabase()
    cleanup(await setup(db))

    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db
    )

    await driver.store('test', {
      foo: 'bar',
    })
    const job = await driver.getNext()

    assert.isNotNull(job)
    assert.containsSubset(job, {
      attempts: 0,
      class_path: 'test',
      failed: false,
    })

    await driver.remove(job!.id)
  })

  test('Payload serialization is OK', async ({ assert, cleanup }) => {
    const db = createDatabase()
    cleanup(await setup(db))

    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db
    )

    let randomPayload = Math.random()
    await driver.store('test', {
      foo: 'bar',
      randomPayload,
    })

    let nextJob = await driver.getNext()
    await driver.remove(nextJob!.id)

    const payload = SuperJSON.parse(nextJob!.payload)
    assert.deepEqual(payload, {
      foo: 'bar',
      randomPayload,
    })
  })

  test('Get job by ID', async ({ assert, cleanup }) => {
    const db = createDatabase()
    cleanup(await setup(db))

    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db
    )

    await driver.store('test', { foo: 'bar' })
    let nextJob = await driver.getNext()

    const job = await driver.getJob(nextJob!.id)
    assert.isNotNull(job)
    assert.isNotNull(job!.id)

    await driver.remove(nextJob!.id)
  })

  test('Re schedule job', async ({ assert, cleanup }) => {
    const db = createDatabase()
    cleanup(await setup(db))

    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db
    )

    await driver.store('test', { foo: 'bar' })
    let nextJob = await driver.getNext()

    assert.equal(nextJob!.attempts, 0)
    await driver.reSchedule(nextJob!, 2)

    await sleep(3)

    const reScheduled = await driver.getNext()
    await driver.remove(reScheduled!.id)
    assert.isNotNull(reScheduled)
    assert.equal(reScheduled!.attempts, 1)
  }).timeout(5000)

  test('Mark job as failed', async ({ assert, cleanup }) => {
    const db = createDatabase()
    cleanup(await setup(db))

    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db
    )

    await driver.store('test', { foo: 'bar' })
    let nextJob = await driver.getNext()

    assert.isFalse(nextJob!.failed)
    await driver.markFailed(nextJob!)

    const job = await driver.getJob(nextJob!.id)
    assert.isNotNull(job)
    assert.isNotNull(job!.id)
    assert.isTrue(job!.failed)
  })

  test('Delete job', async ({ assert, cleanup }) => {
    const db = createDatabase()
    cleanup(await setup(db))

    const driver = new DatabaseDriver(
      {
        tableName: 'jobs',
        pollingDelay: 500,
      },
      db
    )

    await driver.store('test', { foo: 'bar' })
    let nextJob = await driver.getNext()

    assert.isFalse(nextJob!.failed)

    await driver.remove(nextJob!.id)

    const job = await driver.getJob(nextJob!.id)
    assert.isNull(job)
  })
})
