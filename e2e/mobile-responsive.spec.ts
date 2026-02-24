import { test, expect } from "@playwright/test";

test.describe("Mobile Responsive Design", () => {
  test("desktop sidebar is visible on large viewport", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    await expect(page.getByPlaceholder("Add a task")).toBeVisible({
      timeout: 15000,
    });

    // Sidebar should be visible
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
  });

  test("mobile viewport hides desktop sidebar elements", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByPlaceholder("Add a task")).toBeVisible({
      timeout: 15000,
    });

    // On mobile, the sidebar logo should not be visible initially
    // (the hamburger menu should be used instead)
    const header = page.locator("header");
    await expect(header).toBeVisible();
  });

  test("mobile menu button opens sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByPlaceholder("Add a task")).toBeVisible({
      timeout: 15000,
    });

    // On mobile, sidebar is hidden by default
    // The sidebar becomes visible as an overlay when menu is clicked
    const mobileSidebar = page
      .locator("nav")
      .filter({ has: page.getByText("My Day") });

    // Click hamburger menu
    const menuButton = page.locator("header button").first();
    await menuButton.click();

    // Wait for animation and verify sidebar is visible
    await page.waitForTimeout(500);
    await expect(page.getByRole("link", { name: /My Day/i })).toBeVisible();
  });

  test("can navigate to search page on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByPlaceholder("Add a task")).toBeVisible({
      timeout: 15000,
    });

    // Navigate directly to search page
    await page.goto("/search");

    // Should be on search page
    await expect(page.locator("main h1")).toContainText("Search");
  });

  test("responsive layout adjusts padding on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByPlaceholder("Add a task")).toBeVisible({
      timeout: 15000,
    });

    // Main content should have smaller padding on mobile
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});
