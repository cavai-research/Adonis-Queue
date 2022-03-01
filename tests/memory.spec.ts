import { test } from '@japa/runner'
import Queue from '../src/Queue'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import { fs, setupApp, sleep } from '../test-helpers'
import { JobContract } from '@ioc:Cavai/Queue'

const redisHost = process.env.REDIS_HOST || 'localhost'

test.group('Queue', (group) => {
  let app: ApplicationContract
  let queues: Queue

  const configs = {
    mem: { driver: 'memory', config: { pollingDelay: 10 } },
    red: { driver: 'redis', config: { host: redisHost } },
  }

  group.each.setup(async () => {
    app = await setupApp()
    queues = new Queue(configs, app)
  })

  group.each.teardown(async () => {
    await app.shutdown()
    await queues.closeAll()
    await fs.cleanup()
  })

  for (const [name, config] of Object.entries(configs))
    test(`reports progress for ${config.driver} queue`, async ({ expect }) => {
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
})
