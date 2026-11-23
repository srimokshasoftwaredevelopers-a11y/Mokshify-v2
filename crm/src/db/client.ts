/* One database handle per process, chosen by DATABASE_URL:
     pglite://./.data/dev   → PGlite (embedded Postgres in WASM) for local development and tests
     postgres://… / postgresql://…  → node-postgres pool (Neon in production, ?sslmode=require)
   Both are Drizzle Postgres databases with the same API. */
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

type Handle = { db: DB; close: () => Promise<void>; kind: "pglite" | "postgres" };
const g = globalThis as unknown as { __deskDb?: Promise<Handle> };

export const databaseUrl = () => process.env.DATABASE_URL || "pglite://./.data/dev";

async function open(url: string): Promise<Handle> {
  if (url.startsWith("pglite:")) {
    const dir = url.replace(/^pglite:\/\//, "") || "./.data/dev";
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const client = new PGlite(dir);
    await client.waitReady;
    return { db: drizzle(client, { schema, casing: "snake_case" }) as unknown as DB, close: () => client.close(), kind: "pglite" };
  }
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pool = new Pool({ connectionString: url, max: 5 });
  return { db: drizzle(pool, { schema, casing: "snake_case" }) as unknown as DB, close: () => pool.end(), kind: "postgres" };
}

export function handle(): Promise<Handle> {
  g.__deskDb ??= open(databaseUrl());
  return g.__deskDb;
}

export async function getDb(): Promise<DB> {
  return (await handle()).db;
}
