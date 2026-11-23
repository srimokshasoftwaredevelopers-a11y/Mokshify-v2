/* A fresh database for the end-to-end run: delete .data/e2e, migrate, seed the owner and the
   fictional demo data, and add one extra fictional account that the lockout test may lock. */
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const url = process.env.DATABASE_URL ?? "";
if (!url.startsWith("pglite://./.data/e2e")) throw new Error("e2e-db only resets the e2e PGlite database.");
rmSync(".data/e2e", { recursive: true, force: true });
const run = (cmd: string) => execSync(cmd, { stdio: "inherit", env: process.env });
run("npx tsx scripts/migrate.ts");
run("npx tsx scripts/seed.ts owner");
run("npx tsx scripts/seed.ts demo");

const { handle } = await import("../src/db/client");
const { users } = await import("../src/db/schema");
const { hashPassword } = await import("../src/lib/auth");
const h = await handle();
await h.db.insert(users).values({ name: "Lock Test", email: "locktest@example.com", passwordHash: await hashPassword("e2e-locktest-passphrase"), role: "staff", demo: true });
await h.close();
console.log("e2e database ready");
