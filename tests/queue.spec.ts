import { test } from '@japa/runner'
import Queue from '../src/Queue'

import { setupGroup, sleep } from '../test-helpers'
import { JobContract } from '@ioc:Cavai/Queue'

const redisHost = process.env.REDIS_HOST

test.group('Queue', (group) => {
  const redis = !redisHost ? {} : { red: { driver: 'redis', config: { host: redisHost } } }

  const configs = {
    mem: { driver: 'memory', config: { pollingDelay: 10 } },
    ...redis,
  }

  setupGroup(group, configs)

  for (const [name, config] of Object.entries(configs)) {
    test(`add rejects if ${config.driver} queue is closed`, async ({ queues, expect }) => {
      const queue = queues.use(name)
      await queue.close()
      await expect(queue.add()).rejects.toThrow()
    })

    test(`add returns job id from ${config.driver} queue`, async function ({ queues, expect }) {
      const { id } = await queues.use(name).add()
      expect(id).toBeTruthy()
    })

    test(`reports progress for ${config.driver} queue`, async ({ queues, expect }) => {
      const queue = queues.use(name)

      queue.process(async (job: JobContract<any>) => {
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
  }
})
