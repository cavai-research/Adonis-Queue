import { join } from "path";
import { BaseCommand, args } from "@adonisjs/ace";

export default class StartQueue extends BaseCommand {
  public static settings = {
    stayAlive: false,
    loadApp: false,
  };

  /**
   * Command Name is used to run the command
   */
  public static commandName = "make:job";

  /**
   * Command Name is displayed in the "help" output
   */
  public static description = "Make a new job file for queue";

  /**
   * The name of the job file.
   */
  @args.string({ description: "Name of the job class" })
  public name: string;

  public async run() {
    const stub = join(__dirname, "..", "templates", "ExampleJob.txt");

    const path = this.application.rcFile.directories.jobs;

    this.generator
      .addFile(this.name, { pattern: "pascalcase", form: "singular" })
      .stub(stub)
      .destinationDir(path || "app/Jobs")
      .useMustache()
      .appRoot(this.application.cliCwd || this.application.appRoot);

    await this.generator.run();
  }
}
