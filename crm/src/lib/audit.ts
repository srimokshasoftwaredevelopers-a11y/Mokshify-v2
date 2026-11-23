/* audit_log: who did what to which record, and when. `meta` holds ids, counts and enum
   values only — never names, phone numbers, emails or message text. */
import { auditLog } from "@/db/schema";
import type { DB } from "@/db/client";
import { getDb } from "@/db/client";

export type AuditAction =
  | "login" | "login_failed" | "login_locked" | "logout"
  | "export" | "delete" | "data_export" | "data_delete"
  | "role_change" | "user_create" | "user_update" | "settings_change"
  | "stage_change" | "lead_create" | "lead_convert" | "deal_won" | "deal_lost" | "demo_load" | "demo_remove";

export async function audit(
  action: AuditAction,
  opts: { actorId?: string | null; entity?: string; entityId?: string | null; meta?: Record<string, string | number | boolean | null> } = {},
  db?: DB,
) {
  const d = db ?? (await getDb());
  await d.insert(auditLog).values({ action, actorId: opts.actorId ?? null, entity: opts.entity, entityId: opts.entityId ?? null, meta: opts.meta ?? null });
}
