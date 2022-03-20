import 'dotenv/config'
import { join } from 'path'
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@adonisjs/application'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { Group, TestContext } from '@japa/core'

import Queue from '../src/Queue'

const SECRET = 'asecureandlongrandomsecret'
export const fs = new Filesystem(join(__dirname, '__app'))

/**
 * Setup application files for testing
 */
async function setupApplicationFiles() {
  await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))

  await fs.add(
    '.adonisrc.json',
    JSON.stringify({
      autoloads: {
        App: './app',
      },
      providers: [],
    })
  )

  await fs.add(
    'config/app.ts',
    `
    export const appKey = '${SECRET}'
    export const http = {
      trustProxy: () => true,
      cookie: {}
    }
  `
  )

  await fs.add('config/queue.ts', ``)
  await fs.add('start/jobs.ts', ``)
}

/**
 * Setup application for testing
 */
export async function setupApp(additionalProviders?: string[]): Promise<ApplicationContract> {
  await setupApplicationFiles()

  const app = new Application(fs.basePath, 'test', {
    aliases: { App: './app' },
    providers: ['@adonisjs/core'].concat(additionalProviders || []),
  })

  await app.setup()
  await app.registerProviders()
  await app.bootProviders()

  return app
}

export function setupGroup(group: Group<TestContext>, configs: any) {
  let app: ApplicationContract

  group.setup(async () => {
    app = await setupApp()
  })

  group.teardown(async () => {
    await app.shutdown()
    await fs.cleanup()
  })

  group.each.setup(async ({ context }) => {
    const configCopy = JSON.parse(JSON.stringify(configs))
    for (const value of Object.values(configCopy)) value.name = Math.random()

    context.queues = new Queue(configCopy, app)
  })

  group.each.teardown(async ({ context }) => {
    await context.queues.closeAll()
  })
}
