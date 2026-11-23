import { expect, test, type Page } from "@playwright/test";
import { OWNER, signIn } from "./helpers";

async function openProject(page: Page, name: string) {
  await page.goto("/projects");
  await page.getByRole("link", { name }).first().click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

test("recording a payment changes the balance", async ({ page }) => {
  await signIn(page, OWNER);
  await openProject(page, "Home-collection booking site");
  const balance = page.getByTestId("balance");
  await expect(balance).toHaveText("₹1,08,000");                      // 1,80,000 agreed − 72,000 received

  const row = page.getByRole("listitem").filter({ hasText: "Design sign-off (30%)" });
  await expect(row.getByText("Overdue")).toBeVisible();
  await row.getByRole("button", { name: "Record payment" }).click();
  const dialog = page.getByRole("dialog", { name: /Design sign-off/ });
  await dialog.getByLabel("Method").selectOption("UPI");
  await dialog.getByLabel("Reference").fill("TEST-UTR-0001");
  await dialog.getByRole("button", { name: "Record payment" }).click();
  await expect(dialog).toBeHidden();
  await expect(balance).toHaveText("₹54,000");
  await expect(row.getByText("Received", { exact: true })).toBeVisible();
  await expect(page.getByText(/₹54,000 received for "Design sign-off \(30%\)"/)).toBeVisible();   // on the timeline
});

test("a part payment leaves the rest due as a balance milestone", async ({ page }) => {
  await signIn(page, OWNER);
  await openProject(page, "Temple website");
  const balance = page.getByTestId("balance");
  await expect(balance).toHaveText("₹30,000");
  const row = page.getByRole("listitem").filter({ hasText: "Handover (50%)" }).first();
  await row.getByRole("button", { name: "Record payment" }).click();
  const dialog = page.getByRole("dialog", { name: /Handover/ });
  await dialog.getByLabel("Amount received (₹)").fill("20000");
  await dialog.getByRole("button", { name: "Record payment" }).click();
  await expect(dialog).toBeHidden();
  await expect(balance).toHaveText("₹10,000");
  await expect(page.getByRole("listitem").filter({ hasText: "Handover (50%) — balance" }).getByText("₹10,000")).toBeVisible();
});

test("a renewal is marked renewed in one action and gets its next date", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/renewals");
  const row = page.getByRole("listitem").filter({ hasText: "Annual hosting" });
  await expect(row.getByText("2 days left")).toBeVisible();
  await row.getByRole("button", { name: "Mark renewed" }).click();
  await page.getByRole("dialog", { name: /Renewed: Hosting/ }).getByRole("button", { name: "Mark renewed" }).click();
  await expect(row.getByText(/36[4-7] days left/)).toBeVisible();      // a year on
  await page.goto("/today");
  await expect(page.locator("#renewals-h").locator("xpath=ancestor::section").getByText("Annual hosting")).toHaveCount(0);
});
