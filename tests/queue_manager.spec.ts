import { test } from "@japa/runner";
import DatabaseDriver from "../src/drivers/database.js";
import { QueueManager } from "../src/queue_manager.js";
import { createDatabase, createLogger, setup } from "../test-helpers/index.js";

test.group("QueueManager", () => {
  test("Create instance of QueueManager", async ({ expectTypeOf, cleanup }) => {
    // Test logic goes here
    const db = createDatabase();
    cleanup(await setup(db));

    const driver = new DatabaseDriver(
      {
        tableName: "jobs",
        pollingDelay: 500,
      },
      db,
    );

    const queueManager = new QueueManager(
      {
        default: "db",
        queues: {
          db: () => driver,
        },
      },
      createLogger(),
      "/tmp/place",
    );

    // Test types
    expectTypeOf(queueManager.use).parameter(0).toEqualTypeOf<"db">();
  });
});
