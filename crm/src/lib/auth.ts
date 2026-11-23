/* Email + password sign-in. Argon2id hashes; a random session token in an httpOnly, Secure,
   SameSite=Lax cookie; only its SHA-256 is stored. Every page, action and route handler calls
   requireUser() / requireOwner() on the server — hidden buttons are never the check. */
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect, forbidden } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { hash, verify, type Options } from "@node-rs/argon2";
import { getDb } from "@/db/client";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "desk_session";
const SESSION_DAYS = 14;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

// Argon2id (algorithm 2), OWASP's recommended minimum: 19 MiB memory, 2 passes
const ARGON: Options = { algorithm: 2 as Options["algorithm"], memoryCost: 19_456, timeCost: 2, parallelism: 1 };
export const hashPassword = (pw: string) => hash(pw, ARGON);
export const verifyPassword = async (stored: string, pw: string) => {
  try { return await verify(stored, pw); } catch { return false; }
};

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export type SessionUser = { id: string; name: string; email: string; role: "owner" | "staff" };

export async function startSession(userId: string) {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ id: digest(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.COOKIE_INSECURE !== "1", sameSite: "lax", path: "/", expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await (await getDb()).delete(sessions).where(eq(sessions.id, digest(token)));
  jar.delete(SESSION_COOKIE);
}

/** the signed-in user for this request, or null (memoised per request) */
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active })
    .from(sessions).innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, digest(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const u = rows[0];
  if (!u || !u.active) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role };
});

/** pages and actions: signed in, or off to the sign-in screen */
export async function requireUser(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}

/** owner-only pages and actions: a staff session gets 403 */
export async function requireOwner(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "owner") forbidden();
  return u;
}

/** route handlers: the same checks as a status code instead of a redirect */
export async function userOr401(): Promise<SessionUser | Response> {
  const u = await currentUser();
  return u ?? Response.json({ error: "Sign in first." }, { status: 401 });
}
