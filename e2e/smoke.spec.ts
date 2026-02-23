import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("API health check", async ({ request }) => {
    const response = await request.get("http://localhost:4000/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("page loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/To-Do List/i);
  });

  test("navigation sidebar is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
  });
});
