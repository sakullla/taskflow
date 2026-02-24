import { describe, expect, it } from "vitest";
import { hashPassword, isLegacyPasswordHash, verifyPassword } from "../src/shared/utils/password.js";

describe("password utils", () => {
  it("hashes passwords with bcrypt", async () => {
    const hashOne = await hashPassword("secret-123");
    const hashTwo = await hashPassword("secret-123");

    expect(hashOne).not.toBe(hashTwo);
    expect(hashOne.startsWith("$2")).toBe(true);
    expect(hashTwo.startsWith("$2")).toBe(true);
  });

  it("verifies bcrypt password/hash pairs", async () => {
    const hash = await hashPassword("my-password");

    await expect(verifyPassword("my-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("supports legacy hash verification and detection", async () => {
    const legacy = "demo-salt:dc548fb7432bad5dafda603929473162cc79e81fbaf8934de53ea41879b164d1";

    expect(isLegacyPasswordHash(legacy)).toBe(true);
    expect(isLegacyPasswordHash(await hashPassword("new-password"))).toBe(false);
    await expect(verifyPassword("password123", legacy)).resolves.toBe(true);
    await expect(verifyPassword("my-password", "bad-format-hash")).resolves.toBe(false);
  });
});
