import { expect, test } from "@playwright/test";
import { LOCKTEST, OWNER, STAFF, signIn } from "./helpers";

test("signs in with the right password and out again", async ({ page }) => {
  await signIn(page, OWNER);
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/today");
  await expect(page).toHaveURL(/\/login$/);                     // the session is gone
});

test("refuses a wrong password without saying whether the email exists", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(OWNER.email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#login-error")).toHaveText("That email and password don't match.");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#login-error")).toHaveText("That email and password don't match.");
});

test("locks an account after five wrong passwords, even for the right one", async ({ page }) => {
  await page.goto("/login");
  for (let i = 1; i <= 5; i++) {
    await page.getByLabel("Email").fill(LOCKTEST.email);
    await page.getByLabel("Password").fill(`wrong-${i}`);
    // wait for each attempt's answer before typing the next one (the form resets when it returns)
    await Promise.all([page.waitForResponse(r => r.request().method() === "POST"), page.getByRole("button", { name: "Sign in" }).click()]);
    await expect(page.locator("#login-error")).not.toBeEmpty();
  }
  await expect(page.locator("#login-error")).toContainText("locked for 15 minutes");
  await page.getByLabel("Email").fill(LOCKTEST.email);
  await page.getByLabel("Password").fill(LOCKTEST.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#login-error")).toContainText("locked");
  await expect(page).toHaveURL(/\/login$/);
});

test("a staff session cannot reach owner-only routes by URL", async ({ page }) => {
  await signIn(page, STAFF);
  await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);   // not offered…
  const res = await page.goto("/settings");                                    // …and refused if typed
  expect(res?.status()).toBe(403);
  await expect(page.getByText("This part of Desk is for the owner.")).toBeVisible();
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  for (const path of ["/today", "/leads", "/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
});
