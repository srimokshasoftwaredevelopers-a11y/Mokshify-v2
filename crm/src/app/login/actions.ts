"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { hashPassword, LOCK_MINUTES, MAX_FAILED_LOGINS, startSession, verifyPassword } from "@/lib/auth";
import { clientIp, hit } from "@/lib/ratelimit";

const Login = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  password: z.string().min(1, "Enter your password.").max(200),
});

export type LoginState = { error?: string; email?: string };

// verified against when no such user exists, so a wrong email takes as long as a wrong password
let decoy: Promise<string> | null = null;

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = Login.safeParse({ email: form.get("email"), password: form.get("password") });
  const email = String(form.get("email") ?? "").slice(0, 200);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form.", email };

  const ip = clientIp(await headers());
  // 20 attempts per IP per 15 minutes (LOGIN_IP_LIMIT raises it only for the e2e test server,
  // which signs in dozens of times from one address)
  const limit = await hit("login-ip", ip, Number(process.env.LOGIN_IP_LIMIT) || 20, 15 * 60);
  if (!limit.allowed) return { error: `Too many sign-in attempts from here. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`, email };

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(sql`lower(${users.email})`, parsed.data.email)).limit(1);

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    await audit("login_locked", { actorId: user.id, entity: "user", entityId: user.id });
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    return { error: `This account is locked after too many wrong passwords. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`, email };
  }

  decoy ??= hashPassword("not-a-real-password-for-timing");
  const ok = user && user.active ? await verifyPassword(user.passwordHash, parsed.data.password) : (await verifyPassword(await decoy, parsed.data.password), false);

  if (!ok || !user) {
    if (user) {
      const failed = user.failedLogins + 1;
      const lock = failed >= MAX_FAILED_LOGINS;
      await db.update(users).set({ failedLogins: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null }).where(eq(users.id, user.id));
      await audit(lock ? "login_locked" : "login_failed", { actorId: user.id, entity: "user", entityId: user.id, meta: { attempt: failed } });
      if (lock) return { error: `Too many wrong passwords. This account is locked for ${LOCK_MINUTES} minutes.`, email };
    } else {
      await audit("login_failed", { entity: "user" });
    }
    return { error: "That email and password don't match.", email };
  }

  await db.update(users).set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await startSession(user.id);
  await audit("login", { actorId: user.id, entity: "user", entityId: user.id });
  redirect("/today");
}
