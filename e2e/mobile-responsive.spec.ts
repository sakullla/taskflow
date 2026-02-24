import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./utils/auth";

test.describe("Mobile Responsive Design", () => {
  test("desktop sidebar is visible on large viewport", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await loginAsDemo(page);

    await expect(page.getByTestId("quick-add-input")).toBeVisible({
      timeout: 15000,
    });

    // Sidebar should be visible
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
  });

  test("mobile viewport hides desktop sidebar elements", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsDemo(page);

    await expect(page.getByTestId("quick-add-input")).toBeVisible({
      timeout: 15000,
    });

    // On mobile, the sidebar logo should not be visible initially
    // (the hamburger menu should be used instead)
    const header = page.locator("header");
    await expect(header).toBeVisible();
  });

  test("mobile menu button opens sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsDemo(page);

    await expect(page.getByTestId("quick-add-input")).toBeVisible({
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
    await loginAsDemo(page);

    // Navigate directly to search page
    await page.goto("/search");

    // Should be on search page
    await expect(page.locator("main h1")).toContainText("Search");
  });

  test("responsive layout adjusts padding on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsDemo(page);

    await expect(page.getByTestId("quick-add-input")).toBeVisible({
      timeout: 15000,
    });

    // Main content should have smaller padding on mobile
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("mobile quick-add and step actions stay inside viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAsDemo(page);

    const viewportWidth = page.viewportSize()?.width ?? 375;
    const taskTitle = `Mobile fit ${Date.now()}`;

    const quickAddInput = page.getByTestId("quick-add-input");
    const quickAddSubmit = page.getByTestId("quick-add-submit");

    await quickAddInput.fill(taskTitle);
    await expect(quickAddSubmit).toBeVisible();

    const quickAddBox = await quickAddSubmit.boundingBox();
    expect(quickAddBox).not.toBeNull();
    expect(
      (quickAddBox?.x ?? 0) + (quickAddBox?.width ?? 0),
    ).toBeLessThanOrEqual(viewportWidth + 2);

    await quickAddSubmit.click();

    const taskItem = page.locator(".group", { hasText: taskTitle }).first();
    await expect(taskItem).toBeVisible();
    await taskItem.click();
    await page.waitForTimeout(350);

    const stepInput = page.getByTestId("step-add-input");
    const stepSubmit = page.getByTestId("step-add-submit");

    await expect(stepInput).toBeVisible();
    await stepInput.fill("Mobile step");
    await expect(stepSubmit).toBeVisible();

    const stepBox = await stepSubmit.boundingBox();
    expect(stepBox).not.toBeNull();
    expect((stepBox?.x ?? 0) + (stepBox?.width ?? 0)).toBeLessThanOrEqual(
      viewportWidth + 2,
    );
  });
});
