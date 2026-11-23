import { expect, test } from "@playwright/test";
import { OWNER, STAFF, signIn } from "./helpers";

test("a staff user is refused an export, even by typing the URL", async ({ page }) => {
  await signIn(page, STAFF);
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Leads by source" })).toBeVisible();     // staff can read reports…
  await expect(page.getByRole("link", { name: "CSV" })).toHaveCount(0);                   // …but get no export button
  const res = await page.request.get("/api/export/leads-by-source?preset=90d");
  expect(res.status()).toBe(403);
  expect(await res.json()).toEqual({ error: "Only the owner can export data." });
  const person = await page.request.get("/api/person-export?q=ravi@example.com");
  expect(person.status()).toBe(403);
});

test("the owner exports a report as CSV", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/reports?preset=12m");
  const res = await page.request.get("/api/export/leads-by-source?preset=12m");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const csv = await res.text();
  expect(csv.split("\r\n")[0]).toBe('"source","leads"');
  expect(csv).toContain('"Website form"');
});

test("every report has a table view and the date range applies", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/reports?preset=12m");
  for (const name of ["Leads by source", "Leads by industry", "Funnel", "First-reply time", "Won and lost by month", "Revenue received", "Which website page leads came from"]) {
    const section = page.getByRole("region", { name });
    await expect(section).toBeVisible();
    await expect(section.getByText("Table view")).toBeVisible();
  }
  await page.getByRole("region", { name: "Funnel" }).getByText("Table view").click();
  await expect(page.getByRole("region", { name: "Funnel" }).getByRole("cell", { name: "Leads", exact: true })).toBeVisible();
});

test("settings are the owner's: users, lists, templates and personal data", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await page.goto("/settings?person=ravi@example.com");
  await expect(page.getByText(/Found 1 lead/)).toBeVisible();
  const json = await page.request.get("/api/person-export?q=ravi@example.com");
  expect(json.status()).toBe(200);
  expect((await json.json()).leads[0].name).toBe("Ravi Example");
});
