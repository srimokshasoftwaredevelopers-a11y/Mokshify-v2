/* Fixed-window rate limits stored in Postgres, so they hold across serverless instances.
   Keys are hashed: no raw IP address or email is ever stored. */
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

export const hashKey = (...parts: string[]) => createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 40);

export function clientIp(headers: Headers): string {
  return (headers.get("x-forwarded-for")?.split(",")[0] || headers.get("x-real-ip") || "local").trim();
}

/** count one hit; allowed while the window's count is within `limit` */
export async function hit(scope: string, id: string, limit: number, windowSeconds: number) {
  const db = await getDb();
  const key = `${scope}:${hashKey(scope, id)}`;
  const res = await db.execute(sql`
    insert into rate_limits (key, count, window_start) values (${key}, 1, now())
    on conflict (key) do update set
      count = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then now() else rate_limits.window_start end,
      updated_at = now()
    returning count, window_start`);
  const row = (res as unknown as { rows: { count: number; window_start: string | Date }[] }).rows[0];
  const count = Number(row?.count ?? 1);
  const started = new Date(row?.window_start ?? Date.now()).getTime();
  return { allowed: count <= limit, count, retryAfter: Math.max(1, Math.ceil((started + windowSeconds * 1000 - Date.now()) / 1000)) };
}
