import { expect, test } from "@playwright/test";
import { OWNER, signIn } from "./helpers";

const ORIGIN = "https://mokshify.io";
const good = { name: "Form Test Person", email: "form.test@example.com", company: "Demo Form Co", message: "We need a booking website.", consent: true,
  page_url: "https://mokshify.io/consult/?utm_source=google", referrer: "https://www.google.com/", utm_source: "google", utm_medium: "cpc", utm_campaign: "brand" };
const post = (request: import("@playwright/test").APIRequestContext, data: unknown, origin = ORIGIN, ip = "203.0.113.10") =>
  request.post("/api/public/leads", { data, headers: { Origin: origin, "Content-Type": "application/json", "X-Forwarded-For": ip } });

test("a website form submission appears on Today, with its page and campaign", async ({ page, request }) => {
  const res = await post(request, good);
  expect(res.status()).toBe(201);
  expect(await res.json()).toEqual({ ok: true });
  expect(res.headers()["access-control-allow-origin"]).toBe(ORIGIN);
  await signIn(page, OWNER);
  const card = page.locator("#reply-h").locator("xpath=ancestor::section").getByRole("listitem").filter({ hasText: "Form Test Person" });
  await expect(card).toBeVisible();
  await expect(card.getByRole("timer")).toBeVisible();
  await card.getByRole("link", { name: "Form Test Person" }).click();
  await expect(page.getByText("mokshify.io/consult/?utm_source=google")).toBeVisible();
  await expect(page.getByText("google / cpc / brand")).toBeVisible();
  await expect(page.getByText(/^Yes, /)).toBeVisible();                                 // consent stored with its time
});

test("the public endpoint rejects a wrong origin", async ({ request }) => {
  expect((await post(request, good, "https://evil.example")).status()).toBe(403);
  const pre = await request.fetch("/api/public/leads", { method: "OPTIONS", headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "POST" } });
  expect(pre.status()).toBe(403);
  const ok = await request.fetch("/api/public/leads", { method: "OPTIONS", headers: { Origin: ORIGIN, "Access-Control-Request-Method": "POST" } });
  expect(ok.status()).toBe(204);
});

test("the public endpoint rejects a filled honeypot", async ({ request }) => {
  const res = await post(request, { ...good, website: "http://spam.example" }, ORIGIN, "203.0.113.20");
  expect(res.status()).toBe(400);
  expect((await res.json()).ok).toBe(false);
});

test("the public endpoint rejects invalid input", async ({ request }) => {
  const ip = "203.0.113.30";
  expect((await post(request, { ...good, name: "" }, ORIGIN, ip)).status()).toBe(422);
  expect((await post(request, { ...good, email: "not-an-email" }, ORIGIN, ip)).status()).toBe(422);
  expect((await post(request, { ...good, consent: false }, ORIGIN, ip)).status()).toBe(422);
  expect((await post(request, { name: "No Contact", consent: true }, ORIGIN, ip)).status()).toBe(422);
  const notJson = await request.post("/api/public/leads", { data: "name=x", headers: { Origin: ORIGIN, "Content-Type": "application/x-www-form-urlencoded", "X-Forwarded-For": ip } });
  expect(notJson.status()).toBe(415);
});

test("the public endpoint rejects a burst of requests from one address", async ({ request }) => {
  const ip = "203.0.113.40";
  const codes: number[] = [];
  for (let i = 0; i < 7; i++) codes.push((await post(request, { ...good, name: `Burst ${i}` }, ORIGIN, ip)).status());
  expect(codes.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
  expect(codes.slice(5)).toEqual([429, 429]);
});
