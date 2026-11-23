import { defineConfig } from "drizzle-kit";

// Migrations are generated from the schema and committed in drizzle/. Generation needs no
// database; `npm run db:migrate` applies them to whatever DATABASE_URL points at.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
});
