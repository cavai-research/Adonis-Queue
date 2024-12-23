import { BaseCommand, args } from "@adonisjs/core/ace";
import { stubsRoot } from "../stubs/main.js";

export default class MakeJobCommand extends BaseCommand {
  /**
   * Command Name is used to run the command
   */
  static commandName = "make:job";

  /**
   * Command Name is displayed in the "help" output
   */
  static description = "Make a new job file for queue";

  /**
   * The name of the job file.
   */
  @args.string({ description: "Name of the job class" })
  declare name: string;

  async run() {
    const codemods = await this.createCodemods();
    await codemods.makeUsingStub(stubsRoot, "make/job/main.stub", {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    });
  }
}
