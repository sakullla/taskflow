import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./utils/auth";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.goto("/settings");
  });

  test("can navigate to settings page", async ({ page }) => {
    await expect(page.locator("main h1")).toContainText(/Settings|设置/);
  });

  test("settings page displays all sections", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Appearance|外观/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Language|语言/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Notifications|通知/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Account|账户/i }),
    ).toBeVisible();
  });

  test("can switch theme", async ({ page }) => {
    const darkButton = page
      .getByRole("button", { name: /^Dark$|^深色$/ })
      .first();
    await darkButton.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    const lightButton = page
      .getByRole("button", { name: /^Light$|^浅色$/ })
      .first();
    await lightButton.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("can switch language", async ({ page }) => {
    await page.getByRole("button", { name: /简体中文/ }).click();
    await expect(page.getByRole("heading", { name: /外观/ })).toBeVisible();
    await page.getByRole("button", { name: /English/ }).click();
    await expect(
      page.getByRole("heading", { name: /Appearance/ }),
    ).toBeVisible();
  });

  test("notification switch can be changed and persisted after reload", async ({
    page,
  }) => {
    const dueReminderSwitch = page.getByRole("checkbox", {
      name: /Due date reminders|截止日期提醒/,
    });
    const initialDue = await dueReminderSwitch.isChecked();

    await dueReminderSwitch.click({ force: true });
    await expect(dueReminderSwitch).toHaveJSProperty("checked", !initialDue);

    await page.reload();
    await expect(dueReminderSwitch).toHaveJSProperty("checked", !initialDue);
  });

  test("can open change password dialog and submit", async ({ page }) => {
    await page.route("**/api/users/me/password", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page
      .getByRole("button", { name: /Change Password|修改密码/ })
      .click();
    await expect(
      page.getByRole("heading", { name: /Change Password|修改密码/ }),
    ).toBeVisible();

    await page
      .getByPlaceholder(/Current password|当前密码/)
      .fill("password123");
    await page.getByPlaceholder(/New password|新密码/).fill("newpassword123");
    await page
      .getByPlaceholder(/Confirm new password|确认新密码/)
      .fill("newpassword123");
    await page
      .getByRole("button", { name: /Update Password|更新密码/ })
      .click();

    await expect(
      page.getByRole("heading", { name: /Change Password|修改密码/ }),
    ).not.toBeVisible();
  });

  test("user management section is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /User Management|用户管理/ }),
    ).toBeVisible();
  });

  test("admin can create and disable a user", async ({ page }) => {
    const email = `managed-${Date.now()}@example.com`;

    await page.getByTestId("open-create-user-dialog").click();
    await page.getByTestId("create-user-name").fill("Managed User");
    await page.getByTestId("create-user-email").fill(email);
    await page.getByTestId("create-user-password").fill("password123");
    await page.getByTestId("create-user-submit").click();

    const row = page.locator("[data-testid^='user-row-']", { hasText: email });
    await expect(row).toBeVisible();
    await expect(row).toContainText(/Status: Active|状态: 启用/);

    await row.getByRole("button", { name: /Disable User|禁用用户/ }).click();
    await expect(row).toContainText(/Status: Disabled|状态: 禁用/);
  });
});
