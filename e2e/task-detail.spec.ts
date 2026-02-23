import { test, expect } from "@playwright/test";

test.describe("Task Detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Add a task")).toBeVisible({
      timeout: 15000,
    });
  });

  test("can open task detail by clicking on task", async ({ page }) => {
    // Add a task first
    const taskTitle = "Detail test " + Date.now();
    await page.getByPlaceholder("Add a task").fill(taskTitle);
    await page.locator("button", { hasText: /^Add$/ }).click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

    // Click on the task to open detail
    await page.getByText(taskTitle).click();

    // Check that detail panel opens
    await expect(page.getByText("Task Details")).toBeVisible();
    // Check that the title input has the correct value
    const titleInput = page.locator('input[value="' + taskTitle + '"]').first();
    await expect(titleInput).toBeVisible();
  });

  test("can mark task as important from detail", async ({ page }) => {
    // Add a task
    const taskTitle = "Important test " + Date.now();
    await page.getByPlaceholder("Add a task").fill(taskTitle);
    await page.locator("button", { hasText: /^Add$/ }).click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

    // Open detail
    await page.getByText(taskTitle).click();

    // Mark as important by clicking the Important button
    await page.getByRole("button", { name: /Important/ }).click();

    // Verify the Important button now shows the filled star (text-red-500 class)
    await expect(page.getByRole("button", { name: /Important/ })).toHaveClass(
      /text-red-500/,
    );
  });
});
