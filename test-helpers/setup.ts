import { join } from 'path'
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@adonisjs/application'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

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
