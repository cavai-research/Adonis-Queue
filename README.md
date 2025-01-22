# Adonis Queue

> Queue for AdonisJS 5

NPM: https://www.npmjs.com/package/@cavai/adonis-queue

Github: https://github.com/cavai-research/Adonis-Queue

## Why queue?

When application grows big there might be CPU heavy tasks that should be thrown
off from main event loop, long-running tasks outside of HTTP context or certain
jobs should be executed at certain time, then queueing jobs is perfect solution

Adonis queue provider makes using queues a lot easier and cleaner

## About queue

It provides database based queue to run jobs and works out-of-box with Lucid

Supports running jobs in queue, retries, scheduling, re-scheduling, basic
failure tracking and delaying job execution

## Prerequisites

- [Adonis Lucid](https://docs.adonisjs.com/guides/database/introduction) to be installed and configured

## Installation

- Install package `npm install @cavai/adonis-queue`
- Generate base files `node ace configure @cavai/adonis-queue`
  - app/jobs/example_job.ts
  - config/queue.ts
  - database/migrations/TIMESTAMP_adonis_queue.ts
- Run database migrations `node ace migration:run`

## Configuration

Queue configuration file is in `config/queue.ts` Most parameters are documented
in there

### Jobs themselves

Jobs have multiple configurable parameters

- `retries` - Nr of times job is re-tried before it is marked as failed,
  `defaults to 0`
- `retryAfter` - Delay for retries in seconds, so other jobs get chance to run,
  `defaults to 5` sec
- `classPath` - Filesystem path to job class, defaults to
  `app.relativePath(fileURLToPath(new URL('./', import.meta.url)))`

### Driver - database

Database driver is currently only driver, others (memory, Redis etc.) will be
added soon.

It offers great persistence, is good to use both in dev and in production
environments and powerful enough for most applications.

There's no need for extra deployments to manage queue supportive tooling like
Redis, Kafka, MemCache etc

Deployments are easy as just restarting queue. Since NodeJS caches files to memory it's needed to restart to load in latest job classes from last release

## Usage

Usage is relatively similar to events

### Creating jobs

New job can be made with `node ace make:job JobName`, where `JobName` is name of
the job, for example `node ace make:job EncodeVideo` which will be made to
`app/Jobs`

Job can be made or moved manually wherever. Might have to change `classPath`
accordingly if default dynamic one fails to work

Example job:

```ts
import { fileURLToPath } from 'node:url'
import app from '@adonisjs/core/services/app'
import { BaseJob } from '@cavai/adonis-queue'

export default class ExampleJob extends BaseJob {
  /**
   * Nr of times job is re-tried before it is marked as failed
   */
  // static retries = 0

  /**
   * Delay for retries in seconds, so other jobs get chance to run
   */
  // static retryAfter = 5

  /**
   * Filesystem path to job class
   */
  static classPath = app.relativePath(fileURLToPath(new URL('./', import.meta.url)))

  /**
   * Jobs accept additional payload that can be typed for easier usage
   */
  constructor(public payload: { name: string; id: number; signup_date: Date }) {
    super()
  }

  /**
   *  Job handler function, write your own code in here
   */
  async handle() {
    // Code...
  }
}
```

### Dispatching job

Once job class is made, and it's ready to be used, you can **dispatch** job to
queue up for execution

```js
// First have to import job we want to queue up
import MailJob from '#jobs/mail_job'

// And then dispatch it with optional payload
const job = await MailJob.dispatch({
  name: '123',
  id: 123,
  signup_date: new Date(),
})
console.log(job) // { id: 7902 }
```

Awaiting dispatch does **not** wait for execution, it waits for job to be stored
to queue

`.dispatch()` accepts payload that will be accessible in job class `handle()`
method. They will be added to class instance, so in current example `name` will
be accessible with `this.payload.name`

Job dispatch returns object with job ID, which can be later used for job progress tracking

### Delaying job

Job execution can be delayed with `.delay(NOT_BEFORE_TIME)`

```ts
// First have to import job we want to queue up
import MailJob from '#jobs/mail_job'
// Import DateTime from Luxon for easier date management
import { DateTime } from 'luxon'

// Dispatch job and delay it's execution for one day
await MailJob.dispatch().delay(DateTime.now().plus({ days: 1 }))

// You can also specify date as string
// This job won't execute before given date
await MailJob.dispatch().delay('2025-02-24 15:30:00')
```

### Start the queue

> It's not needed for sync memory queue, since it will use share NodeJS event
> loop with main application

It's good to start queue as separate process, especially in production
environment, to not block main event loop

To start (default) queue run `node ace queue:start` and keep it running in the background

Or in case of multiple queues can specify which queue to start by providing Ace
command a name `node ace queue:start mailQueue`, will start mailQueue

### Scaling queue

To scale queue to multiple runners, just start new instances with
`node ace queue:start`. Jobs are locked by default, so there's no worry about
multiple runners picking up same job

### Extending with custom drivers

Let's say we want to have driver for testing that never runs jobs,
just deletes them as soon as they are dispatched

First off, need to create new queue driver, for that let's create `providers/never_queue/driver.ts`

This driver needs to extend abstract `QueueDriver` to ensure everything works correctly

```ts
// never_queue/driver.ts
import { QueueDriver } from '@cavai/adonis-queue/types'

export class NeverQueueDriver extends QueueDriver {
  /**
   * Do nothing, NeverQueue will never store any jobs
   */
  async store() {
    console.log('Stored nothing')
  }

  /**
   * Just return null, since there is never going to be job to return
   */
  async getNext() {
    return null
  }

  /**
   * Always return null, since there are no jobs
   */
  async getJob() {
    return null
  }

  /**
   * Keeping on with never having jobs theme
   */
  async reSchedule() {}

  /**
   * Do nothing
   */
  async markFailed() {}

  /**
   * Do nothing
   */
  async remove() {}
}
```

Now also need to make provider, that loads in this new driver

`node ace make:provider never_queue/queue_provider`

Inside provider `register()` method we are going to register our own driver

```ts
// never_queue/queue_provider.ts
import { DriversCollection } from '@cavai/adonis-queue'
import { ApplicationService } from '@adonisjs/core/types'
import { NeverQueueDriver } from './driver.js'

export default class NeverQueueProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    // Register your own bindings
    DriversCollection.extend('never', () => {
      // TS error, solution below
      return new NeverQueueDriver()
    })
  }
}
```

Even tho our new queue is working now and we can configure it to be used inside `config/queue.ts`, we are going to get some TypeScript errors, about `never` queue not acceptable queue

> Argument of type '"never"' is not assignable to parameter of type '"database"'.ts(2345)

To fix that, need to create TS typings file: `contracts/queue.ts`

```ts
// contracts/queue.ts

// Importing in new queue
import { NeverQueueDriver } from '#providers/never_queue/driver'

declare module '@cavai/adonis-queue' {
  export interface QueueDriverList {
    // Appending it to drivers list and naming it
    never: () => NeverQueueDriver
  }
}
```

Now last thing to do is to update config inside `config/queue.ts` adding new queue to there with it's custom driver

```ts
/**
 * Queue configuration file, all queue config variables are in here
 */
import { defineConfig } from '@cavai/adonis-queue'

export default defineConfig({
  /**
   * Which driver to use by default
   */
  default: 'neverQueue',

  queues: {
    database: {
      ...
    },

    // Added new custom driver to here
    neverQueue: {
      driver: 'never',
    },
  },
})
```

## TODO:

- Add memory queue
- Add more tests
