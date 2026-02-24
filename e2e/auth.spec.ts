import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login form has no default credentials", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("i18nextLng", "en");
    });

    await page.goto("/login");

    await expect(page.getByPlaceholder("Enter your email")).toHaveValue("");
    await expect(page.getByPlaceholder("Enter your password")).toHaveValue("");
  });

  test("can login with demo account", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("i18nextLng", "en");
    });

    await page.goto("/login");
    await page.getByPlaceholder("Enter your email").fill("demo@example.com");
    await page.getByPlaceholder("Enter your password").fill("password123");
    await page.getByRole("button", { name: /^Login$/ }).click();

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(
      page.getByRole("button", { name: /Open user menu/ }),
    ).toBeVisible();
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

  test("shows error when registration is disabled", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("i18nextLng", "en");
    });

    await page.route("**/api/auth/register", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "AUTHORIZATION_ERROR",
            message: "Registration is disabled",
          },
        }),
      });
    });

    await page.goto("/login");
    await page.getByRole("button", { name: /^Register$/ }).click();
    await page
      .getByPlaceholder("Enter your email")
      .fill(`blocked-${Date.now()}@example.com`);
    await page.getByPlaceholder("Enter your password").fill("newpassword123");
    await page.getByRole("button", { name: /^Register$/ }).click();

    await expect(page.getByText("Registration is disabled")).toBeVisible();
  });
});
