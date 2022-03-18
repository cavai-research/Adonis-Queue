import { test } from '@japa/runner'
import { setupGroup, sleep } from '../test-helpers'

const redisHost = process.env.REDIS_HOST

test.group('Queue', (group) => {
  const redis = !redisHost ? {} : { red: { driver: 'redis', config: { host: redisHost } } }

  const configs = {
    mem: { driver: 'memory', config: { pollingDelay: 10 } },
    ...redis,
  }

  setupGroup(group, configs)

  for (const [name, config] of Object.entries(configs)) {
    test(`add reopens ${config.driver} queue if it is closed`, async ({ queues, expect }) => {
      const queue = queues.use(name)
      await queue.close()
      await expect(queue.add()).toBeTruthy()
    })

    test(`add returns job id from ${config.driver} queue`, async function ({ queues, expect }) {
      const { id } = await queues.use(name).add()
      expect(id).toBeTruthy()
    })

    test(`reports progress for ${config.driver} queue`, async ({ queues, expect }) => {
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

    test(`add resumes ${config.driver} queue`, async ({ queues, expect }) => {
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
  }
})
