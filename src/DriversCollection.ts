// Check up stuff from https://github.com/adonisjs/core/blob/next/modules/hash/drivers_collection.ts

import DatabaseDriver from './Drivers/Database'

export interface QueueDriverList {
  db: (config: any) => DatabaseDriver
}

/**
 * A singleton collection of drivers for the entire lifecycle of
 * the application.
 */
class DriversCollection {
  public list: Partial<QueueDriverList> = {
  }

  public extend<Name extends keyof QueueDriverList> (driverName: Name, factoryCallback: QueueDriverList[Name]) {
    this.list[driverName] = factoryCallback
    return this
  }

  public create<Name extends keyof QueueDriverList> (name: Name, config: Parameters<QueueDriverList[Name]>[0]) {
    const driverFactory = this.list[name]

    if (!driverFactory) {
      throw new Error(
        `Unknown queue driver "${String(name)}". Make sure the driver is registered`
      )
    }

    return driverFactory(config as any)
  }
}

export default new DriversCollection()
