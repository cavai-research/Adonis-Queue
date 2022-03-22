import { test } from '@japa/runner'
import MemoryQueue from '../src/Drivers/MemoryQueue'
import { setupGroup, sleep, capitalize } from '../test-helpers'

const redisHost = process.env.REDIS_HOST

const redis = !redisHost ? {} : { red: { driver: 'redis', config: { host: redisHost } } }

const configs = {
  mem: { driver: 'memory', config: { pollingDelay: 10 } },
  ...redis,
}

for (const [name, config] of Object.entries(configs))
  test.group(`${capitalize(config.driver)}Queue`, (group) => {
    setupGroup(group, configs)

    test(`missing queue name throws exception`, async ({ queues, expect }) => {
      expect(queues.use).toThrow(Error)
    })

    test(`getJob returns null for missing id`, async ({ queues, expect }) => {
      const queue = queues.use(name)
      const id = await queue.getJob(111)
      expect(id).toBeNull()
    })

    test(`single job is executed`, async ({ queues, expect }) => {
      const queue = queues.use(name)
      let done = false

      queue.process(async () => {
        done = true
      })
      await queue.add({})
      await sleep(100)
      expect(done).toBe(true)
    })

    test(`payload is passed to processor`, async ({ queues, expect }) => {
      const queue = queues.use(name)
      const inpPayload = { name: 'test' }
      let outPayload

      queue.process((job) => (outPayload = job.payload))
      await queue.add(inpPayload)
      await sleep(100)
      expect(outPayload).toEqual(inpPayload)
    })

    test(`default payload is object`, async ({ queues, expect }) => {
      const queue = queues.use(name)
      let payload

      queue.process((job) => (payload = job.payload))
      await queue.add({})
      await sleep(100)
      expect(payload).toEqual({})
    })

    test(`add reopens queue if it is closed`, async ({ queues, expect }) => {
      const queue = queues.use(name)
      await queue.close()
      await expect(queue.add({})).toBeTruthy()
    })

    test(`add returns job id`, async function ({ queues, expect }) {
      const { id } = await queues.use(name).add({})
      expect(id).toBeTruthy()
    })

    test(`reports progress`, async ({ queues, expect }) => {
      const queue = queues.use(name)

      queue.process(async (job) => {
        job.reportProgress('started')
        await sleep(100)
        job.reportProgress('finished')
      })

      const job = await queue.add({})

      await sleep(50)
      const started = (await queue.getJob(job.id))?.progress
      await sleep(100)
      const finished = (await queue.getJob(job.id))?.progress

      expect(started).toBe('started')
      expect(finished).toBe('finished')
    })

    test(`add resumes queue`, async ({ queues, expect }) => {
      const queue = queues.use(name)
      let counter = 0

      queue.process(async () => {
        counter++
      })

      await queue.add({})
      await queue.add({})
      await sleep(100)

      await queue.close()
      await queue.add({})
      await sleep(100)
      expect(counter).toBe(3)
    })

    test(`queue use returns the same queue`, async ({ queues, expect }) => {
      const queue1 = queues.use(name)
      const queue2 = queues.use(name)
      const { id } = await queue1.add({})
      const job = await queue2.getJob(id)
      expect(job).toBeTruthy
    })
  })

test.group(`ExtendedQueue`, (group) => {
  setupGroup(group, {
    ext: { driver: 'extended', config: { pollingDelay: 10 } },
  })

  test(`allows extensions`, async function ({ queues, expect }) {
    expect(() => queues.use('ext')).toThrow()
    queues.extend('extended', (cfg, app) => new MemoryQueue(cfg, app))
    expect(() => queues.use('ext')).toBeTruthy()
  })

  test(`extensions work`, async function ({ queues, expect }) {
    queues.extend('extended', (cfg, app) => new MemoryQueue(cfg, app))
    const queue = queues.use('ext')
    const { id } = await queue.add({})
    const job = await queue.getJob(id)
    expect(job).toBeTruthy()
  })
})
