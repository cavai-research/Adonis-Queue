import { expect } from '@japa/expect'
import { specReporter } from '@japa/spec-reporter'
import { runFailedTests } from '@japa/run-failed-tests'
import { processCliArgs, configure, run } from '@japa/runner'

configure({
  ...processCliArgs(process.argv.slice(2)),
  ...{
    files: ['tests/**/*.spec.ts'],
    plugins: [expect(), runFailedTests()],
    reporters: [specReporter()],
    importer: (filePath: string) => import(filePath),
  },
})

run()
