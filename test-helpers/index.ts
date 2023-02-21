import { Database } from '@adonisjs/lucid/build/src/Database'
import { Logger } from '@adonisjs/logger/build'
import { Profiler } from '@adonisjs/profiler/build'
import { Emitter } from '@adonisjs/events/build/standalone'

export function createDatabase () {
  const logger = createLogger()
  const profiler = new Profiler(process.cwd(), logger, {})
  const emitter = new Emitter()
  const db = new Database({
    connection: 'pg',
    connections: {
      pg: {
        client: 'pg',
        connection: {
          host: 'localhost',
          user: 'queue_test',
          password: 'queue_test',
          database: 'queue_test',
        },
      },
    },
  }, logger, profiler, emitter)

  return db
}

export function createLogger () {
  return new Logger({
    enabled: true,
    name: 'cavai-queue',
    level: 'info',
  })
}

export async function setup () {
  // Create DB
  const db = await createDatabase()

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
    // Teardown DB
    await db.connection().schema.dropTable('jobs')
    await db.manager.closeAll()
  }
}

export function sleep (seconds: number) {
  return new Promise((res) => setTimeout(() => res(true), seconds * 1000)
  )
}
