/* Every request passes here first:
   1. a fresh CSP nonce and a strict Content-Security-Policy (Next adds the nonce to its scripts);
   2. no session cookie on a private path → the sign-in screen (the real check is on the server, in
      requireUser(); this only saves a round trip);
   3. CSRF: state-changing requests to private API routes must come from this origin. Server Actions
      get the same Origin/Host check from Next itself, and the session cookie is SameSite=Lax. */
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = [/^\/login$/, /^\/api\/public\//, /^\/manifest\.webmanifest$/, /^\/icons\//, /^\/fonts\//, /^\/favicon/, /^\/robots\.txt$/, /^\/sw\.js$/];
const isPublic = (p: string) => PUBLIC.some(r => r.test(p));

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isApi && !pathname.startsWith("/api/public/") && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (!origin || new URL(origin).host !== req.headers.get("host")) {
      return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
    }
  }

  if (!isPublic(pathname) && !req.cookies.has("desk_session")) {
    if (isApi) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
    // production is always https (Vercel); on plain-http localhost this would break asset loads
    ...(req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("x-desk-path", pathname);           // lets the app layout refuse owner-only paths before streaming starts
  headers.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  // static files and prefetches skip the proxy
  matcher: [{ source: "/((?!_next/static|_next/image|fonts/|icons/).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }],
};
