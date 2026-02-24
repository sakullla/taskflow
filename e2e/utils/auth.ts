import { expect, type Page } from "@playwright/test";

export async function loginAsDemo(page: Page) {
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
  ).toBeVisible({
    timeout: 15000,
  });
}
