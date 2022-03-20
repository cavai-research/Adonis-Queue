import { test } from '@japa/runner'
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

    test(`single job is executed`, async ({ queues, expect }) => {
      const queue = queues.use(name)
      let done = false

      queue.process(() => (done = true))
      await queue.add()
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
      await queue.add()
      await sleep(100)
      expect(payload).toEqual({})
    })

    test(`add reopens queue if it is closed`, async ({ queues, expect }) => {
      const queue = queues.use(name)
      await queue.close()
      await expect(queue.add()).toBeTruthy()
    })

    test(`add returns job id`, async function ({ queues, expect }) {
      const { id } = await queues.use(name).add()
      expect(id).toBeTruthy()
    })

    test(`reports progress`, async ({ queues, expect }) => {
      const queue = queues.use(name)

      queue.process(async (job) => {
        job.reportProgress('started')
        await sleep(100)
        job.reportProgress('finished')
      })

      const job = await queue.add()

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

      queue.process(() => counter++)

      await queue.add()
      await queue.add()
      await sleep(100)

      await queue.close()
      await queue.add()
      await sleep(100)
      expect(counter).toBe(3)
    })
  })
