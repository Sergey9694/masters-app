import { db } from "../src/shared/lib/db";

async function check() {
  const tasks = await db.$queryRaw`SELECT id, title, address, ST_AsText("taskLocation") as location FROM "TaskRequest"`;
  console.log(JSON.stringify(tasks, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
}

check().catch(console.error);
