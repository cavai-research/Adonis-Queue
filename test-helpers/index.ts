import { Logger } from '@adonisjs/core/logger'
import { Database } from '@adonisjs/lucid/database'
import { AppFactory } from '@adonisjs/core/factories/app'
import { EmitterFactory } from '@adonisjs/core/factories/events'

export function createDatabase() {
  const app = new AppFactory().create(new URL('./', import.meta.url))
  const emitter = new EmitterFactory().create(app)
  const logger = createLogger()
  const db = new Database(
    {
      connection: 'pg',
      connections: {
        pg: {
          client: 'pg',
          connection: {
            host: 'localhost',
            user: 'postgres',
            password: '',
            database: 'queue_test',
          },
        },
      },
    },
    logger,
    emitter
  )

  return db
}

export function createLogger() {
  return new Logger({
    enabled: true,
    name: 'cavai-queue',
    level: 'info',
  })
}

export async function setup(db: Database) {
  await db.connection().schema.createTable('jobs', (table) => {
    table.bigIncrements('id').unsigned()
    table.string('class_path').notNullable()
    table.text('payload').nullable()

    table.timestamp('created_at').defaultTo(db.knexRawQuery('NOW()'))
    table.timestamp('available_at').defaultTo(db.knexRawQuery('NOW()'))

    table.integer('attempts').defaultTo(0)
    table.boolean('failed').defaultTo(false)
  })

  return async () => {
    await db.connection().schema.dropTable('jobs')
    await db.manager.closeAll()
  }
}

export function sleep(seconds: number) {
  return new Promise((res) => setTimeout(() => res(true), seconds * 1000))
}
