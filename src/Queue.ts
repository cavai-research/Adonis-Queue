import RedisQueue from './Drivers/RedisQueue'
import MemoryQueue from './Drivers/MemoryQueue'
import { QueueContract, DriverContract, ExtendCallback, Config } from '@ioc:Cavai/Adonis-Queue'

export default class Queue implements QueueContract {
  /**
   * Cache for extended drivers, to keep them in memory
   */
  private extendedDrivers: Dictionary<ExtendCallback> = {}
  /**
   * Cache to keep already existing mappings in the memory
   */
  private mappingsCache: Dictionary<DriverContract> = {}

  constructor(private config: Config, private app) {}

  /**
   * Defines queue driver mapping to use
   * In case given mapping does exist it creates create new queue
   */
  public use(mappingName: string): DriverContract {
    if (!this.config[mappingName]) {
      throw new Error(`Unknown mapping: ${mappingName}`)
    }
    if (this.mappingsCache[mappingName]) {
      return this.mappingsCache[mappingName]
    }
    const driverInstance = this.createDriver(
      this.config[mappingName],
      this.config[mappingName].driver
    )
    this.mappingsCache[mappingName] = driverInstance

    return driverInstance
  }

  public extend(driverName: string, callBack: ExtendCallback) {
    this.extendedDrivers[driverName] = callBack
  }

  /**
   * Creates queue driver
   */
  protected createDriver(config: Config, driverName: string): DriverContract {
    switch (driverName) {
      case 'redis':
        return new RedisQueue(config, this.app)
      case 'memory':
        return new MemoryQueue(config, this.app)
      default:
        return this.makeExtendedDriver(config, driverName)
    }
  }

  /**
   * Creates extended driver
   */
  protected makeExtendedDriver(config: Config, driverName: string): DriverContract {
    if (this.extendedDrivers[driverName]) {
      return this.extendedDrivers[driverName](config, this.app)
    }

    throw new Error(`Unknown driver ${driverName}`)
  }

  public async closeAll(): Promise<void> {
    const drivers = Object.values(this.mappingsCache)
    await Promise.all(drivers.map((driver) => driver.close()))
  }
}
