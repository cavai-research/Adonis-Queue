import * as sinkStatic from "@adonisjs/sink";
import { ApplicationContract } from "@ioc:Adonis/Core/Application";
import { join } from "path";

export default async function instructions(
  _projectRoot: string,
  app: ApplicationContract,
  sink: typeof sinkStatic
) {
  // Copy over ExampleJob.ts
  new sink.files.MustacheFile(
    app.makePath("app/Jobs"),
    "ExampleJob.ts",
    join(__dirname, "templates/ExampleJob.txt")
  )
    .apply({ name: "TestJob", filename: "TestJob", useMustache: true })
    .commit();

  // Copy over Migration
  new sink.files.TemplateLiteralFile(
    app.makePath("database/migrations"),
    `${Date.now()}_queue_migration.ts`,
    join(__dirname, "templates/queue_migration.txt")
  )
    .apply({})
    .commit();
}
