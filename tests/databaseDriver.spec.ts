import { test } from '@japa/runner'
import SuperJSON from 'superjson'
import DatabaseDriver from '../src/Drivers/Database'
import { createDatabase, setup, sleep } from '../test-helpers'

test.group('Database driver', (group) => {
  group.each.setup(setup)

  test('Create instance of driver', async ({ assert }) => {
    const db = createDatabase()
    const driver = new DatabaseDriver({
      tableName: 'jobs',
    }, db)

    assert.exists(driver.store)
    assert.exists(driver.getNext)
    assert.exists(driver.getJob)
    assert.exists(driver.remove)
    assert.exists(driver.reSchedule)
    assert.exists(driver.markFailed)
  })

  test('Store job', async ({ assert, expectTypeOf }) => {
    const db = createDatabase()
    const driver = new DatabaseDriver({
      tableName: 'jobs',
    }, db)

    expectTypeOf(driver.store)
      .parameter(0)
      .toEqualTypeOf<string>()

    await driver.store('test', { foo: 'bar' })

    let job = await db.from('jobs').first()
    assert.isNotNull(job)
    assert.containsSubset(job, {
      attempts: 0,
      class_path: 'test',
      failed: false,
    })

    // Test doesn't finish without manual close
    // Group level close doesn't work, coz that's another instance
    await db.manager.closeAll()
  })

  test('Get next job', async ({ assert }) => {
    const db = createDatabase()
    const driver = new DatabaseDriver({
      tableName: 'jobs',
    }, db)

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

    // Test doesn't finish without manual close
    // Group level close doesn't work, coz that's another instance
    await db.manager.closeAll()
  })

  test('Payload serialization is OK', async ({ assert }) => {
    const db = createDatabase()
    const driver = new DatabaseDriver({
      tableName: 'jobs',
    }, db)

    let randomPayload = Math.random()
    await driver.store('test', {
      foo: 'bar',
      randomPayload,
    })
    let nextJob = await driver.getNext()

    const payload = SuperJSON.parse(nextJob!.payload)
    assert.deepEqual(payload, {
      foo: 'bar',
      randomPayload,
    })

    // Test doesn't finish without manual close
    // Group level close doesn't work, coz that's another instance
    await db.manager.closeAll()
  })

  test('Get job by ID', async ({ assert }) => {
    const db = createDatabase()
    const driver = new DatabaseDriver({
      tableName: 'jobs',
    }, db)

    await driver.store('test', { foo: 'bar' })
    let nextJob = await driver.getNext()

    const job = await driver.getJob(nextJob!.id)
    assert.isNotNull(job)
    assert.isNotNull(job!.id)

    // Test doesn't finish without manual close
    // Group level close doesn't work, coz that's another instance
    await db.manager.closeAll()
  })

  test('Re schedule job', async ({ assert }) => {
    const db = createDatabase()
    const driver = new DatabaseDriver({
      tableName: 'jobs',
    }, db)

    await driver.store('test', { foo: 'bar' })
    let nextJob = await driver.getNext()

    assert.equal(nextJob!.attempts, 0)

    await driver.reSchedule(nextJob!, 2)

    await sleep(3)

    const reScheduled = await driver.getNext()
    assert.isNotNull(reScheduled)
    assert.equal(reScheduled!.attempts, 1)

    // Test doesn't finish without manual close
    // Group level close doesn't work, coz that's another instance
    await db.manager.closeAll()
  }).timeout(5000)

  test('Mark job as failed', async ({ assert }) => {
    const db = createDatabase()
    const driver = new DatabaseDriver({
      tableName: 'jobs',
    }, db)

    await driver.store('test', { foo: 'bar' })
    let nextJob = await driver.getNext()

    assert.isFalse(nextJob!.failed)

    await driver.markFailed(nextJob!.id)

    const job = await driver.getJob(nextJob!.id)
    assert.isNotNull(job)
    assert.isNotNull(job!.id)
    assert.isTrue(job!.failed)

    // Test doesn't finish without manual close
    // Group level close doesn't work, coz that's another instance
    await db.manager.closeAll()
  })

  test('Delete job', async ({ assert }) => {
    const db = createDatabase()
    const driver = new DatabaseDriver({
      tableName: 'jobs',
    }, db)

    await driver.store('test', { foo: 'bar' })
    let nextJob = await driver.getNext()

    assert.isFalse(nextJob!.failed)

    await driver.remove(nextJob!.id)

    const job = await driver.getJob(nextJob!.id)
    assert.isNull(job)

    // Test doesn't finish without manual close
    // Group level close doesn't work, coz that's another instance
    await db.manager.closeAll()
  })
})
