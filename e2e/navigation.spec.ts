import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder('Add a task')).toBeVisible({ timeout: 15000 });
  });

  test('sidebar navigation links work', async ({ page }) => {
    // Test navigation to Important
    await page.getByRole('link', { name: /important/i }).click();
    await expect(page).toHaveURL(/\/important/);
    await expect(page.locator('main h1')).toContainText('Important');

    // Test navigation to Planned
    await page.getByRole('link', { name: /planned/i }).click();
    await expect(page).toHaveURL(/\/planned/);
    await expect(page.locator('main h1')).toContainText('Planned');

    // Test navigation to All Tasks
    await page.getByRole('link', { name: /all tasks/i }).click();
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.locator('main h1')).toContainText('All Tasks');

    // Test navigation back to My Day
    await page.getByRole('link', { name: /my day/i }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('main h1')).toContainText('My Day');
  });

  test('lists are displayed in sidebar', async ({ page }) => {
    // Check that LISTS section exists
    await expect(page.getByText('LISTS')).toBeVisible();

    // Check that default lists are shown
    await expect(page.getByText('任务')).toBeVisible();
    await expect(page.getByText('工作')).toBeVisible();
  });
});
