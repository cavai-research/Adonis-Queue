import RedisQueue from './Drivers/RedisQueue'
import MemoryQueue from './Drivers/MemoryQueue'

export default class Queue {
  /**
   * Cache for extended drivers, to keep them in memory
   */
  private extendedDrivers: any = {}
  /**
   * Cache to keep already existing mappings in the memory
   */
  private mappingsCache: any = {}

  constructor(private config, private app) {}

  /**
   * Defines queue driver mapping to use
   * In case given mapping does exist it creates create new queue
   */
  public use(mappingName: string) {
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

  /**
   * Creates queue driver
   */
  protected createDriver(config, driverName) {
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
   * @TODO: Not implemented
   */
  protected makeExtendedDriver(config, driverName) {
    if (this.extendedDrivers[driverName]) {
      return this.extendedDrivers[driverName](config, this.app)
    }

    throw new Error(`Unknown driver ${driverName}`)
  }
}
