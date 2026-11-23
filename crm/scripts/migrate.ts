/* Apply the committed migrations in drizzle/ to DATABASE_URL.   npm run db:migrate */
import { mkdirSync } from "node:fs";
import { databaseUrl, handle } from "../src/db/client";

const url = databaseUrl();
if (url.startsWith("pglite:")) mkdirSync(url.replace(/^pglite:\/\//, ""), { recursive: true });
const h = await handle();
if (h.kind === "pglite") {
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  await migrate(h.db as never, { migrationsFolder: "./drizzle" });
} else {
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  await migrate(h.db as never, { migrationsFolder: "./drizzle" });
}
await h.close();
console.log(`migrations applied (${h.kind})`);
