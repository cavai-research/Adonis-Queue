import { test } from '@japa/runner'
import QueueProvider from '../providers/queue_provider.js'
import { AppFactory } from '@adonisjs/core/factories/app'
import { QueueManager } from '../src/queue_manager.js'

const app = new AppFactory().create(new URL('./', import.meta.url))

test.group('Queue provider', (group) => {
  test('Create instance of driver', async ({ assert }) => {
    const provider = new QueueProvider(app)
    app.useConfig({
      queue: { foo: 'bar' },
    })
    await app.init()
    await app.boot()

    provider.register()
    let manualManager = new QueueManager({ foo: 'bar' })
    let queueManager = await app.container.make(QueueManager)
    console.log(queueManager)
  })
})
