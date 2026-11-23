import { expect, test } from "@playwright/test";
import { OWNER, signIn } from "./helpers";

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("quick-add records a phone enquiry from any screen in a few taps", async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto("/leads");
    await page.getByRole("button", { name: "Quick add" }).click();
    const sheet = page.getByRole("dialog", { name: "New enquiry" });
    await expect(sheet).toBeVisible();
    await sheet.getByLabel("Name", { exact: true }).fill("Phone Enquiry Test");
    await sheet.getByLabel("Phone", { exact: true }).fill("+91 90000 09999");
    await sheet.getByLabel("Source").selectOption("Phone call");
    await sheet.getByLabel("Note").fill("Wants a website for a clinic");
    await expect(sheet.getByLabel("Name", { exact: true })).toHaveValue("Phone Enquiry Test");
    await expect(sheet.getByLabel("Phone", { exact: true })).toHaveValue("+91 90000 09999");
    await sheet.getByRole("button", { name: "Save enquiry" }).click();
    await expect(sheet.getByText("Saved.")).toBeVisible();
    await sheet.getByRole("link", { name: "Open it" }).click();
    await expect(page.getByRole("heading", { name: "Phone Enquiry Test" })).toBeVisible();
    await expect(page.getByRole("timer")).toBeVisible();                       // the reply timer is running
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - 390);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("quick-add refuses a lead without a phone number", async ({ page }) => {
    await signIn(page, OWNER);
    await page.getByRole("button", { name: "Quick add" }).click();
    const sheet = page.getByRole("dialog", { name: "New enquiry" });
    await sheet.getByLabel("Name", { exact: true }).fill("No Phone");
    await sheet.getByRole("button", { name: "Save enquiry" }).click();
    await expect(sheet.getByText("Phone is required.")).toBeVisible();
  });
});

test("reply and log: the first logged reply stops the timer and stores the response time", async ({ page, context }) => {
  await signIn(page, OWNER);
  const card = page.locator("#reply-h").locator("xpath=ancestor::section").getByRole("listitem").filter({ hasText: "Ravi Example" });
  await expect(card.getByRole("timer")).toBeVisible();
  // WhatsApp opens wa.me in a new tab with the template filled in (stubbed: no network); Desk then offers to log it
  await context.route(/wa\.me|whatsapp\.com/, route => route.fulfill({ status: 200, contentType: "text/plain", body: "stub" }));
  const [wa] = await Promise.all([context.waitForEvent("page"), card.getByRole("link", { name: "WhatsApp" }).click()]);
  await wa.waitForLoadState();
  expect(wa.url()).toMatch(/^https:\/\/wa\.me\/919000000001\?text=/);
  expect(decodeURIComponent(wa.url())).toContain("Hello Ravi");
  await wa.close();
  await card.getByRole("button", { name: "Log it" }).click();
  // logged: Ravi leaves "Reply now" straight away (and stays gone after a reload)
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#reply-h").locator("xpath=ancestor::section").getByText("Ravi Example")).toHaveCount(0);
  await page.goto("/leads?q=Ravi");
  await page.getByRole("link", { name: "Ravi Example" }).first().click();
  await expect(page.getByText(/Replied in/).first()).toBeVisible();
  await expect(page.getByText("WhatsApp sent: First reply.")).toBeVisible();     // on the timeline
  await expect(page.getByText("Contacted").first()).toBeVisible();
});

test("search finds a lead by part of its phone number", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/leads?q=00005");
  await expect(page.getByRole("link", { name: "Meena Placeholder" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Ravi Example" })).toHaveCount(0);
});
