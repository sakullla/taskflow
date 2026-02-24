import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/config/db.js";
import { loginUser } from "../src/modules/auth/service.js";

const legacyHash = "demo-salt:dc548fb7432bad5dafda603929473162cc79e81fbaf8934de53ea41879b164d1";

describe("auth service", () => {
  beforeEach(async () => {
    const user = await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {
        password: legacyHash,
        isActive: true,
        role: "admin",
        locale: "zh-CN",
        theme: "system",
        dueDateReminders: true,
        weeklyDigest: false,
      },
      create: {
        email: "demo@example.com",
        password: legacyHash,
        isActive: true,
        name: "Demo User",
        role: "admin",
        locale: "zh-CN",
        theme: "system",
        dueDateReminders: true,
        weeklyDigest: false,
      },
      select: { id: true },
    });

    const defaultList = await prisma.list.findFirst({
      where: {
        userId: user.id,
        isDefault: true,
      },
      select: { id: true },
    });

    if (!defaultList) {
      await prisma.list.create({
        data: {
          userId: user.id,
          name: "Tasks",
          color: "#3b82f6",
          isDefault: true,
          isArchived: false,
          order: 0,
        },
      });
    }
  });

  it("migrates legacy password hash to bcrypt after successful login", async () => {
    const result = await loginUser({
      email: "demo@example.com",
      password: "password123",
    });

    expect(result.user.email).toBe("demo@example.com");

    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@example.com" },
      select: { password: true },
    });
    expect(demoUser).toBeDefined();
    expect(demoUser?.password.startsWith("$2")).toBe(true);
  });
});
