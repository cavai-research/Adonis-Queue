import * as sinkStatic from '@adonisjs/sink'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { join } from 'path'

export default async function instructions (
  _projectRoot: string,
  app: ApplicationContract,
  sink: typeof sinkStatic
) {
  // Copy over ExampleJob.ts
  new sink.files.TemplateLiteralFile(
    app.makePath('app/Jobs'),
    'ExampleJob.ts',
    join(__dirname, 'templates/ExampleJob.txt')
  ).apply({}).commit()
}
