import { expect, type Page } from "@playwright/test";

/* fictional accounts in the throwaway e2e database (scripts/e2e-db.ts) */
export const OWNER = { email: "owner@example.com", password: "e2e-owner-passphrase" };
export const STAFF = { email: "staff@example.com", password: "e2e-staff-passphrase" };
export const LOCKTEST = { email: "locktest@example.com", password: "e2e-locktest-passphrase" };

export async function signIn(page: Page, who: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/today$/);
}
