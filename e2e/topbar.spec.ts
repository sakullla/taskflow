import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./utils/auth";

test.describe("Topbar User and Notifications", () => {
  test("user menu shows current user info", async ({ page }) => {
    await loginAsDemo(page);

    await page.getByRole("button", { name: /Open user menu|打开用户菜单/ }).click();
    await expect(page.getByText("demo@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /Settings|设置/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Logout|退出登录/ })).toBeVisible();
  });

  test("notification panel loads reminders and supports mark all read", async ({ page }) => {
    await page.route("**/api/notifications", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "n1",
              title: "Reminder",
              message: "Task due soon",
              type: "task_reminder",
              isRead: false,
              taskId: "t1",
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.route("**/api/notifications/read-all", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await loginAsDemo(page);
    await expect(page.locator("header").getByText("1")).toBeVisible();

    await page.getByRole("button", { name: /Open notifications|打开通知/ }).click();
    await expect(page.getByRole("heading", { name: /Notifications|通知/ })).toBeVisible();
    await expect(page.getByText("Task due soon")).toBeVisible();

    await page.getByRole("button", { name: /Mark all read|全部已读/ }).click();
    await expect(page.locator("header").getByText("1")).toHaveCount(0);
  });
});
