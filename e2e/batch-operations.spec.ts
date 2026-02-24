import { test, expect } from "@playwright/test";

test.describe("Batch Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport for batch mode
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    // Wait for page to be fully loaded
    await expect(page.getByPlaceholder("Add a task")).toBeVisible({
      timeout: 15000,
    });
  });

  test("can enter batch mode", async ({ page }) => {
    // Click batch mode button
    const batchButton = page.locator('button[title="Batch select"]').first();
    await expect(batchButton).toBeVisible();
    await batchButton.click();

    // Batch action bar should appear
    await expect(page.getByText(/selected/i)).toBeVisible();
    // Check for the Complete and Delete buttons (might be disabled when no selection)
    await expect(
      page.locator('button:has-text("Complete")').first(),
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Delete")').first(),
    ).toBeVisible();
  });

  test("can select multiple tasks in batch mode", async ({ page }) => {
    // Add two tasks first
    const taskTitle1 = "BatchTask1 " + Date.now();
    const taskTitle2 = "BatchTask2 " + Date.now();

    // Add first task
    await page.getByPlaceholder("Add a task").fill(taskTitle1);
    await page.locator("button", { hasText: /^Add$/ }).click();
    await expect(page.getByText(taskTitle1)).toBeVisible({ timeout: 5000 });

    // Add second task
    await page.getByPlaceholder("Add a task").fill(taskTitle2);
    await page.locator("button", { hasText: /^Add$/ }).click();
    await expect(page.getByText(taskTitle2)).toBeVisible({ timeout: 5000 });

    // Enter batch mode
    const batchButton = page.locator('button[title="Batch select"]').first();
    await batchButton.click();

    // Select both tasks
    const taskItems = page.locator(".group", { hasText: taskTitle1 });
    await taskItems.first().click();

    const taskItems2 = page.locator(".group", { hasText: taskTitle2 });
    await taskItems2.first().click();

    // Should show "2 selected"
    await expect(page.getByText(/2 selected/i)).toBeVisible();
  });

  test("can exit batch mode", async ({ page }) => {
    // Enter batch mode
    const batchButton = page.locator('button[title="Batch select"]').first();
    await batchButton.click();

    // Batch bar should be visible with "0 selected"
    await expect(page.getByText(/0 selected/i)).toBeVisible();

    // Click X to exit (close button in batch bar)
    const closeButton = page
      .locator('div[class*="fixed"], div[class*="sticky"]')
      .locator("button")
      .first();
    await closeButton.click();

    // Batch bar should show "0 selected" still or check that the header is back
    await expect(page.locator("header h2")).toBeVisible();
  });

  test("can clear selection in batch mode", async ({ page }) => {
    // Add a task
    const taskTitle = "ClearTest " + Date.now();
    await page.getByPlaceholder("Add a task").fill(taskTitle);
    await page.locator("button", { hasText: /^Add$/ }).click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

    // Enter batch mode and select task
    const batchButton = page.locator('button[title="Batch select"]').first();
    await batchButton.click();

    const taskItem = page.locator(".group", { hasText: taskTitle });
    await taskItem.first().click();

    // Should show "1 selected"
    await expect(page.getByText(/1 selected/i)).toBeVisible();

    // Click Clear
    await page.getByRole("button", { name: /Clear/i }).click();

    // Should show "0 selected"
    await expect(page.getByText(/0 selected/i)).toBeVisible();
  });

  test("batch mode shows checkboxes instead of completion circles", async ({
    page,
  }) => {
    // Enter batch mode
    const batchButton = page.locator('button[title="Batch select"]').first();
    await batchButton.click();

    // Check for square checkboxes (batch mode) instead of round circles
    const checkboxes = page.locator('.group button[class*="rounded"]').first();
    await expect(checkboxes).toBeVisible();
  });

  test("can complete tasks in batch mode", async ({ page }) => {
    // Add a task
    const taskTitle = "CompleteBatch " + Date.now();
    await page.getByPlaceholder("Add a task").fill(taskTitle);
    await page.locator("button", { hasText: /^Add$/ }).click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

    // Enter batch mode and select task
    const batchButton = page.locator('button[title="Batch select"]').first();
    await batchButton.click();

    const taskItem = page.locator(".group", { hasText: taskTitle });
    await taskItem.first().click();

    // Click Complete button
    const completeButton = page.getByRole("button", { name: /Complete/i });
    await completeButton.click();

    // Should exit batch mode
    await expect(page.getByText(/selected/i)).not.toBeVisible();

    // Task should be completed (disappears from My Day view)
    await expect(page.getByText(taskTitle)).not.toBeVisible({ timeout: 5000 });
  });

  test("can delete tasks in batch mode", async ({ page }) => {
    // Add a task
    const taskTitle = "DeleteBatch " + Date.now();
    await page.getByPlaceholder("Add a task").fill(taskTitle);
    await page.locator("button", { hasText: /^Add$/ }).click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

    // Enter batch mode and select task
    const batchButton = page.locator('button[title="Batch select"]').first();
    await batchButton.click();

    const taskItem = page.locator(".group", { hasText: taskTitle });
    await taskItem.first().click();

    // Click Delete button
    const deleteButton = page
      .locator('div[class*="fixed"], div[class*="sticky"]')
      .getByRole("button", { name: /^Delete$/i });
    await deleteButton.click();

    // Confirm dialog should appear
    await expect(page.getByText(/Delete Tasks/i)).toBeVisible();

    // Confirm deletion
    await page
      .getByRole("button", { name: /^Delete$/i })
      .last()
      .click();

    // Should exit batch mode and task should be gone
    await expect(page.getByText(/selected/i)).not.toBeVisible();
    await expect(page.getByText(taskTitle)).not.toBeVisible({ timeout: 5000 });
  });

  test("batch mode is disabled on search page", async ({ page }) => {
    // Navigate to search page
    await page.goto("/search");
    await expect(page.locator("main h1")).toContainText("Search");

    // Batch mode button should not be visible
    const batchButton = page.locator('button[title="Batch select"]');
    await expect(batchButton).not.toBeVisible();
  });

  test("batch mode is disabled on settings page", async ({ page }) => {
    // Navigate to settings page
    await page.goto("/settings");
    await expect(page.locator("main h1")).toContainText("Settings");

    // Batch mode button should not be visible
    const batchButton = page.locator('button[title="Batch select"]');
    await expect(batchButton).not.toBeVisible();
  });
});
