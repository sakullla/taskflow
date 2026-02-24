import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("can login with demo account", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("i18nextLng", "en");
    });

    await page.goto("/login");
    await page.getByPlaceholder("Enter your email").fill("demo@example.com");
    await page.getByPlaceholder("Enter your password").fill("password123");
    await page.getByRole("button", { name: /^Login$/ }).click();

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: /Open user menu/ })).toBeVisible();
  });

  test("can register a new account", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("i18nextLng", "en");
    });

    const email = `new-user-${Date.now()}@example.com`;

    await page.goto("/login");
    await page.getByRole("button", { name: /^Register$/ }).click();
    await page.getByPlaceholder("Enter your name").fill("New User");
    await page.getByPlaceholder("Enter your email").fill(email);
    await page.getByPlaceholder("Enter your password").fill("newpassword123");
    await page.getByRole("button", { name: /^Register$/ }).click();

    await expect(page).not.toHaveURL(/\/login$/);
    await page.getByRole("button", { name: /Open user menu/ }).click();
    await expect(page.getByText(email)).toBeVisible();
  });
});
