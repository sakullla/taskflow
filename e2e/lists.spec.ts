import { test, expect } from "@playwright/test";

test.describe("List Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Add a task")).toBeVisible({
      timeout: 15000,
    });
  });

  test("can create a new list", async ({ page }) => {
    const listName = "Test List " + Date.now();

    // Click the plus button next to LISTS
    await page
      .locator("aside")
      .locator("button")
      .filter({ has: page.locator("svg") })
      .first()
      .click();

    // Fill in the list name - use a more flexible selector
    const input = page.locator("aside input").first();
    await input.fill(listName);

    // Click create button
    await page
      .locator("aside")
      .getByRole("button", { name: /create|创建/i })
      .click();

    // Verify the new list appears in the sidebar
    await expect(page.locator("aside").getByText(listName)).toBeVisible();
  });

  test("can navigate to a custom list", async ({ page }) => {
    // Click on the default "任务" list
    await page.locator("aside").getByText("任务").click();

    // Should navigate to the list page
    await expect(page).toHaveURL(/\/lists\//);
  });
});
