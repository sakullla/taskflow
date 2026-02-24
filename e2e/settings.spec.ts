import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Add a task")).toBeVisible({
      timeout: 15000,
    });
  });

  test("can navigate to settings page", async ({ page }) => {
    // Navigate directly to settings
    await page.goto("/settings");

    // Should show settings page
    await expect(page.locator("main h1")).toContainText("Settings");
  });

  test("settings page displays all sections", async ({ page }) => {
    await page.goto("/settings");

    // Check all main sections are visible (using role for headings)
    await expect(
      page.getByRole("heading", { name: /Appearance/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Language/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Notifications/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Account/i })).toBeVisible();
  });

  test("can switch theme", async ({ page }) => {
    await page.goto("/settings");

    // Click dark theme button
    const darkButton = page.getByRole("button", { name: /^Dark$/ }).first();
    await darkButton.click();

    // Check that dark class is applied to html element
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Switch back to light
    const lightButton = page.getByRole("button", { name: /^Light$/ }).first();
    await lightButton.click();

    // Dark class should be removed
    await expect(html).not.toHaveClass(/dark/);
  });

  test("can switch language", async ({ page }) => {
    await page.goto("/settings");

    // Click language button (Simplified Chinese)
    const chineseButton = page.getByRole("button", { name: /简体中文/i });
    await chineseButton.click();

    // Check that the heading is now in Chinese
    await expect(page.getByRole("heading", { name: /外观/i })).toBeVisible();

    // Switch back to English
    const englishButton = page.getByRole("button", { name: /English/i });
    await englishButton.click();

    // Should show English text again
    await expect(
      page.getByRole("heading", { name: /Appearance/i }),
    ).toBeVisible();
  });

  test("theme preference is saved to localStorage", async ({ page }) => {
    await page.goto("/settings");

    // Switch to dark theme
    const darkButton = page.getByRole("button", { name: /^Dark$/ }).first();
    await darkButton.click();

    // Check localStorage
    const theme = await page.evaluate(() => localStorage.getItem("theme"));
    expect(theme).toBe("dark");

    // Reset to light theme
    const lightButton = page.getByRole("button", { name: /^Light$/ }).first();
    await lightButton.click();

    const newTheme = await page.evaluate(() => localStorage.getItem("theme"));
    expect(newTheme).toBe("light");
  });
});
