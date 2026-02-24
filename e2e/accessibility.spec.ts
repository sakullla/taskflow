import { expect, test } from "@playwright/test";
import { loginAsDemo } from "./utils/auth";

test.describe("Accessibility", () => {
  test("login form supports label-based input", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("i18nextLng", "en");
    });

    await page.goto("/login");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await page.getByRole("button", { name: /^Register$/ }).click();
    await expect(page.getByLabel("Name")).toBeVisible();
  });

  test("top bar and task action buttons expose accessible names", async ({ page }) => {
    await loginAsDemo(page);

    await expect(page.getByRole("button", { name: /Open notifications/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Open user menu/ })).toBeVisible();

    await page.getByRole("button", { name: /Open notifications/ }).click();
    await expect(page.getByRole("dialog", { name: /Notifications/ })).toBeVisible();

    await page.goto("/tasks");
    await expect(
      page.locator("button[aria-label='Mark as completed'], button[aria-label='Mark as incomplete']").first()
    ).toBeVisible();
    await expect.poll(async () =>
      page.locator("button[aria-label='Mark as important'], button[aria-label='Unmark as important']").count()
    ).toBeGreaterThan(0);
  });
});
