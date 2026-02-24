import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./utils/auth";

test.describe("Task Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("can add a new task", async ({ page }) => {
    const taskTitle = "Test task " + Date.now();
    const input = page.getByPlaceholder(/Add a task|添加任务/);
    await input.fill(taskTitle);

    const addButton = page.locator("button", { hasText: /^Add$|^添加$/ });
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });
  });

  test("can mark task as complete", async ({ page }) => {
    const taskTitle = "Complete me " + Date.now();
    const input = page.getByPlaceholder(/Add a task|添加任务/);

    await input.fill(taskTitle);

    const addButton = page.locator("button", { hasText: /^Add$|^添加$/ });
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

    const taskItem = page.locator(".group", { hasText: taskTitle });
    const checkbox = taskItem.locator("button").first();
    await checkbox.click();

    await expect(page.getByText(taskTitle)).not.toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /Completed|已完成/ }).click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });
  });

  test("can view important tasks page", async ({ page }) => {
    await page.goto("/important");
    await expect(page.locator("main h1")).toContainText(/Important|重要/);
  });

  test("can view planned tasks page", async ({ page }) => {
    await page.goto("/planned");
    await expect(page.locator("main h1")).toContainText(/Planned|计划内/);
  });

  test("can view all tasks page", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.locator("main h1")).toContainText(/All Tasks|全部任务/);
  });
});
