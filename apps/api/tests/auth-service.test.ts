import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/config/db.js";
import { loginUser } from "../src/modules/auth/service.js";

const legacyHash = "demo-salt:dc548fb7432bad5dafda603929473162cc79e81fbaf8934de53ea41879b164d1";

describe("auth service", () => {
  beforeEach(() => {
    const demoUser = db.users.get("demo-user");
    if (demoUser) {
      demoUser.password = legacyHash;
      db.users.set(demoUser.id, demoUser);
    }
  });

  it("migrates legacy password hash to bcrypt after successful login", async () => {
    const result = await loginUser({
      email: "demo@example.com",
      password: "password123",
    });

    expect(result.user.email).toBe("demo@example.com");

    const demoUser = db.users.get("demo-user");
    expect(demoUser).toBeDefined();
    expect(demoUser?.password.startsWith("$2")).toBe(true);
  });
});
