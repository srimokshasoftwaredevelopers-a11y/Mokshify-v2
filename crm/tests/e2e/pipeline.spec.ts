import { expect, test, type Page } from "@playwright/test";
import { OWNER, signIn } from "./helpers";

async function openLead(page: Page, name: string) {
  await page.goto(`/leads?q=${encodeURIComponent(name)}`);
  await page.getByRole("link", { name }).first().click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

test("lead to deal to won to client and project", async ({ page }) => {
  await signIn(page, OWNER);
  await openLead(page, "Priya Sample");
  // one step: the lead becomes a deal with a next step for tomorrow
  await page.getByRole("button", { name: "Convert to deal" }).click();
  await expect(page).toHaveURL(/\/deals\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Demo Physio Clinic — Booking app" })).toBeVisible();
  await expect(page.getByText("Discovery call: understand what they need").first()).toBeVisible();

  // moving a stage asks for the next one
  await page.getByRole("button", { name: "Move stage" }).click();
  const dialog = page.getByRole("dialog", { name: "Move deal" });
  await dialog.getByLabel("Move to").selectOption("proposal");
  await dialog.getByLabel("Next action").fill("Call about the proposal");
  await dialog.getByRole("button", { name: "Move" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Discovery call → Proposal sent").or(page.getByText("Contacted → Proposal sent"))).toBeVisible();

  // won: the final value, then the client and the project exist
  await page.getByRole("button", { name: "Move stage" }).click();
  await dialog.getByLabel("Move to").selectOption("won");
  await dialog.getByLabel("Final value (₹)").fill("150000");
  await dialog.getByRole("button", { name: "Mark as won" }).click();
  await expect(dialog.getByText("Won. The client and the project are set up.")).toBeVisible();
  await dialog.getByRole("link", { name: "Open the project" }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  await expect(page.getByText("₹1,50,000").first()).toBeVisible();              // the agreed amount
  await expect(page.getByRole("link", { name: "Demo Physio Clinic" }).first()).toBeVisible();
});

test("an open deal can't be moved without its next step; lost needs a reason", async ({ page }) => {
  await signIn(page, OWNER);
  await openLead(page, "Kiran Test");
  await page.getByRole("button", { name: "Convert to deal" }).click();
  await page.getByRole("button", { name: "Move stage" }).click();
  const dialog = page.getByRole("dialog", { name: "Move deal" });
  await dialog.getByLabel("Move to").selectOption("discovery");
  await dialog.getByLabel("Next action").fill("");
  await dialog.getByRole("button", { name: "Move" }).click();
  await expect(dialog).toBeVisible();                                            // refused: still asking
  await expect(dialog.getByLabel("Next action")).toHaveJSProperty("validity.valueMissing", true);

  await dialog.getByLabel("Move to").selectOption("lost");
  await dialog.getByRole("button", { name: "Mark as lost" }).click();
  await expect(dialog).toBeVisible();                                            // no reason chosen yet
  await dialog.getByLabel("Why was it lost?").selectOption("Timing");
  await dialog.getByRole("button", { name: "Mark as lost" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Lost: Timing")).toBeVisible();
});

test("the board shows every stage with its count and total, and idle deals are flagged", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/pipeline");
  for (const stage of ["New", "Contacted", "Discovery call", "Proposal sent", "Negotiation", "Won", "Lost"]) {
    await expect(page.getByRole("heading", { name: new RegExp(`^${stage} \\d+$`) })).toBeVisible();
  }
  await expect(page.getByRole("article", { name: "Agro traders catalogue refresh" }).getByText(/Idle \d+d/)).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("the stage switcher shows one stage, and Move to works without dragging", async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto("/pipeline");
    await page.getByRole("button", { name: /^Negotiation/ }).click();
    const card = page.getByRole("article", { name: "Agro traders catalogue refresh" });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /Move/ }).click();
    const dialog = page.getByRole("dialog", { name: "Move deal" });
    await dialog.getByLabel("Move to").selectOption("proposal");
    await dialog.getByRole("button", { name: "Move" }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("button", { name: /^Proposal sent/ }).click();
    await expect(page.getByRole("article", { name: "Agro traders catalogue refresh" })).toBeVisible();
  });
});
