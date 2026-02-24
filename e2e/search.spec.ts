import { test, expect } from "@playwright/test";

test.describe("Search Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for page to be fully loaded
    await expect(page.getByPlaceholder("Add a task")).toBeVisible({
      timeout: 15000,
    });
  });

  test("can navigate to search page", async ({ page }) => {
    // Navigate directly to search page
    await page.goto("/search");

    // Should show search page
    await expect(page.locator("main h1")).toContainText("Search");
  });

  test("search page shows empty state initially", async ({ page }) => {
    await page.goto("/search");

    // Should show search prompt
    await expect(page.getByText(/Type to search/i)).toBeVisible();
    await expect(page.getByText(/Search by task title/i)).toBeVisible();
  });

  test("can search for tasks", async ({ page }) => {
    // First add a task
    const taskTitle = "UniqueSearchTask " + Date.now();
    const input = page.getByPlaceholder("Add a task");
    await input.fill(taskTitle);

    const addButton = page.locator("button", { hasText: /^Add$/ });
    await expect(addButton).toBeEnabled();
    await addButton.click();

    // Wait for the task to appear
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

    // Navigate to search page
    await page.goto("/search");

    // Type search query
    const searchInput = page.getByPlaceholder(/Search tasks/i);
    await searchInput.fill(taskTitle);

    // Wait for search results
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });
  });

  test("search shows no results message when no matches", async ({ page }) => {
    await page.goto("/search");

    // Type a query that won't match any tasks
    const searchInput = page.getByPlaceholder(/Search tasks/i);
    await searchInput.fill("XYZ123NONEXISTENT");

    // Should show no results message
    await expect(page.getByText(/No tasks found/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/Try a different search term/i)).toBeVisible();
  });
});
