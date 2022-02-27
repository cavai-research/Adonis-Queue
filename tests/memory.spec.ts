import { test } from '@japa/runner'
import Queue from '../src/Queue'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import { fs, setupApp, sleep } from '../test-helpers'
import { JobContract } from '@ioc:Cavai/Queue'

const redisHost = process.env.REDIS_HOST || 'localhost'

test.group('Queue', (group) => {
  let app: ApplicationContract
  let queue: Queue

  const config = {
    mem: { driver: 'memory', config: { pollingDelay: 10 } },
    red: { driver: 'redis', config: { host: redisHost } },
  }

  group.each.setup(async () => {
    app = await setupApp()
    queue = new Queue(config, app)
  })

  group.each.teardown(async () => {
    await app.shutdown()
    await queue.closeAll()
    await fs.cleanup()
  })

  test('reports progress for memory queue', async ({ expect }) => {
    const memoryQueue = queue.use('mem')

    memoryQueue.process(async (job: JobContract<any>) => {
      job.reportProgress('started')
      await sleep(100)
      job.reportProgress('finished')
    })

    const job = await memoryQueue.add()

    await sleep(50)
    const started = (await memoryQueue.getJob(job.id))?.progress
    await sleep(100)
    const finished = (await memoryQueue.getJob(job.id))?.progress

    expect(started).toBe('started')
    expect(finished).toBe('finished')
  })

  test('reports progress for redis queue', async ({ expect }) => {
    const redisQueue = queue.use('red')

    redisQueue.process(async (job: JobContract<any>) => {
      job.reportProgress('started')
      await sleep(100)
      job.reportProgress('finished')
    })

    const job = await redisQueue.add()

    await sleep(50)
    const started = (await redisQueue.getJob(job.id))?.progress
    await sleep(100)
    const finished = (await redisQueue.getJob(job.id))?.progress

    expect(started).toBe('started')
    expect(finished).toBe('finished')
  })
})
