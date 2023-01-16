# Adonis Queue

> Queue for AdonisJS 5

## Why queue?

When application grows big there might be CPU heavy tasks that should be thrown
off from main event loop, long running tasks outside of HTTP context or certain
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
- Generate base files `node ace invoke @cavai/adonis-queue`
  - app/Jobs/ExampleJob.ts
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
  `defaults to 5`sec
- `jobPath` - Filesystem path to job class, defaults to
  `path.relative(Application.appRoot, __filename)`

### Driver - database

Database driver is currently only driver, others (memory, Redis etc) will be
added soon.

It offers great persistance, is good to use both in dev and in production
environments and powerful enough for most applications.

There's no need for extra deployments to manage queue supportive tooling like
Redis, Kafka, MemCache etc

Deployments are easy as just restarting queue to pick up new jobs, since NodeJS
caches all files to memory

## Usage

Usage is relatively simple to events

### Creating jobs

New job can be made with `node ace make:job JobName`, where `JobName` is name of
the job, for example `node ace make:job EncodeVideo` which will be made to
`app/Jobs`

Job can be made or moved manually wherever. Might have to change `jobPath`
accordingly if default dynamic one fails to work

Example job:

```ts
import { BaseJob } from "@cavai/adonis-queue";
import Application from "@ioc:Adonis/Core/Application";
import path from "path";

export default class ExampleJob extends BaseJob {
  /**
   * Nr of times job is re-tried before it is marked as failed
   */
  // public static retries = 0

  /**
   * Delay for retries in seconds, so other jobs get chance to run
   */
  // public static retryAfter = 5

  /**
   * Filesystem path to job class
   */
  public static jobPath = path.relative(Application.appRoot, __filename);

  /**
   * Jobs accept additional payload that can be typed for easier usage
   */
  constructor(public payload: { name: string; id: number; signup_date: Date }) {
    super();
  }

  /**
   *  Job handler function, write your own code in here
   */
  public async handle() {
    // Code...
  }
}
```

### Dispatching job

Once job class is made and it's ready to be used you can **dispatch** job to
queue up for execution

```js
// First have to import job we want to queue up
import MailJob from "App/Jobs/Mails/MailJob";

// And then dispatch it with optional payload
await MailJob.dispatch({ name: "123", id: 123, signup_date: new Date() });
```

Awaiting dispatch does **not** wait for execution, it waits for job to be stored
to queue

`.dispatch()` accepts payload that will be accessible in job class `handle()`
method. They will be added to class instance, so in current example `name` will
be accessible with `this.payload.name`

### Start the queue

> It's not needed for sync memory queue, since it will use share NodeJS event
> loop with main application

It's good to start queue as separate process, especially in production
environment, to not block main event loop

To start queue run `node ace queue:start` and keep it running in the background

### Scaling queue

To scale queue to multiple runners, just start new instances with
`node ace queue:start`. Jobs are locked by default, so there's no worry about
multiple runners picking up same job

## TODO:

- Add migration files
- Add make:job command
- Add memory queue
- Add tests
