import { test, expect } from "@playwright/test";

test.describe("Task Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for page to be fully loaded - wait for the add task input to be visible
    await expect(page.getByPlaceholder("Add a task")).toBeVisible({
      timeout: 15000,
    });
  });

  test("can add a new task", async ({ page }) => {
    const taskTitle = "Test task " + Date.now();

    // Find the add task input (not the search input)
    const input = page.getByPlaceholder("Add a task");
    await input.fill(taskTitle);

    // Find add button and click it
    const addButton = page.locator("button", { hasText: /^Add$/ });
    await expect(addButton).toBeEnabled();
    await addButton.click();

    // Wait for the task to appear in the list
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });
  });

  test("can mark task as complete", async ({ page }) => {
    // First add a task
    const taskTitle = "Complete me " + Date.now();
    const input = page.getByPlaceholder("Add a task");

    await input.fill(taskTitle);

    const addButton = page.locator("button", { hasText: /^Add$/ });
    await expect(addButton).toBeEnabled();
    await addButton.click();

    // Wait for the task to appear
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

    // Find the task item and click its checkbox (first button which is the round checkbox)
    const taskItem = page.locator(".group", { hasText: taskTitle });
    const checkbox = taskItem.locator("button").first();
    await checkbox.click();

    // In My Day view, completed tasks are filtered out, so task should disappear
    await expect(page.getByText(taskTitle)).not.toBeVisible({ timeout: 5000 });
  });

  test("can view important tasks page", async ({ page }) => {
    await page.goto("/important");
    await expect(page.locator("main h1")).toContainText("Important");
  });

  test("can view planned tasks page", async ({ page }) => {
    await page.goto("/planned");
    await expect(page.locator("main h1")).toContainText("Planned");
  });

  test("can view all tasks page", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.locator("main h1")).toContainText("All Tasks");
  });
});
