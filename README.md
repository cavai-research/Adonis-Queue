# AdonisJS Queue

> Basic AdonisJS queue provider

It provides in-memory and Redis based queues to run jobs in

It's relatively basic currently and doesn't support job timeouts, retries etc. Supports extending it, adding jobs to queue, processing them and reporting their status

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Memory queue (default)](#memory-queue-default)
- [Redis queue](#redis-queue)
- [Usage](#usage)
  - [Define job](#define-job)
  - [Add job to queue](#add-job-to-queue)
  - [Get job by it's ID](#get-job-by-its-id)
  - [Report job progress](#report-job-progress)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

- Run `npm install @cavai/queue` to install it
- Run `node ace invoke @cavai/queue` to generate configuration files

## Configuration

Queue configuration file is in `config/queue.ts`

## Memory queue (default)

Memory queue is the most basic queue. It runs jobs async in the background and is recommended for testing and developing or for some really basic use-cases

It doesn't require any additional setup, but having some heavy running job can stop whole NodeJS event loop, thus making whole application unresponsive. Since whole queue and job state are stored in memory, they will be wiped in case of application restarts / crashes

Default memory queue configuration:

```ts
export default {
  exampleQueue: {
    name: 'exampleQueue',
    driver: 'memory',
    config: {
      pollingDelay: 500,
    },
  },
}
```

- **name** is just name of queue. It's nice to have it the same as queue object
- **driver** is the driver to use. In current case it's `memory`
- **config** additional configuration specific for memory queue. Currently only contains `pollingDelay` which is delay how often queue is checked for new jobs

## Redis queue

Redis queue users lightweight [BeeQueue](https://github.com/bee-queue/bee-queue) under the hood

Redis version is better for production, since it doesn't have the problems that memory queue have. Data is persisted in Redis and in case of application crashes or restarts it's not lost.

Redis queue job processing is also ran as separate NodeJS instance, so any job can't block main application event loop and vice-versa

Downside of this queue is slightly harder setup, since it requires Redis to be installed and slightly higher resource consumption. There will be another instance of NodeJS and Redis also running, instead of just single NodeJS instance

Default Redis queue configuration:

```ts
export default {
  exampleQueue: {
    name: 'exampleQueue',
    driver: 'redis',
    config: {
      redis: {
        host: '127.0.0.1',
        port: 6379,
      },
    },
  },
}
```

- **name** is just name of queue. It's nice to have it the same as queue object
- **driver** is the driver to use. In current case it's `redis`
- **config** additional configuration specific for redis queue. Config object is passed down to BeeQueue, check [BeeQueue documentation](https://github.com/bee-queue/bee-queue#settings) for all options

## Usage

For different kinds of jobs there will be different kinds of queues. For example for emails you might have `signupEmailQueue` while for notifications you might have `discordNotificationQueue`. Jobs from different queues can run in parallel (sharing event loop), while jobs in single queue are executed in order

### Define job

By default jobs are defined in `start/jobs.ts`

```ts
import Queue from '@ioc:Cavai/Queue'
import Mail from '@ioc:Adonis/Addons/Mail'

// Defining job in 'signupEmailQueue'
Queue.use('signupEmailQueue').process(async (job) => {
  // Send signup email
  await Mail.send((message) => {
    message
      .from('info@example.com')
      .to(job.payload.email)
      .subject('Welcome Onboard!')
      .htmlView('emails/welcome', { name: job.payload.name })
    })
})
```

### Add job to queue

Adding jobs to queue can be done everywhere in application. Just need to import queue

```ts
import Queue from '@ioc:Cavai/Queue'

// Add job to signupEmailQueue
// With payload as our nice fake new user
let job = Queue.use('signupEmailQueue').add({
  email: 'foo@bar.com',
  name: 'FooBar',
})
```

### Get job by it's ID

```ts
import Queue from '@ioc:Cavai/Queue'

let job = await Queue.use('signupEmailQueue').getJob(10)
```

### Reporting job progress

Job progress can be reported with `job.reportProgress(any)`

```ts
import Queue from '@ioc:Cavai/Queue'
import Mail from '@ioc:Adonis/Addons/Mail'

// Defining job in 'signupEmailQueue'
Queue.use('signupEmailQueue').process(async (job) => {
  // Report job progress
  job.reportProgress('Sending mail')

  // Send signup email
  await Mail.send((message) => {
    message
      .from('info@example.com')
      .to(job.payload.email)
      .subject('Welcome Onboard!')
      .htmlView('emails/welcome', { name: job.payload.name })
    })
  
  // Report job progress
  job.reportProgress('Mail sent')
})
```
