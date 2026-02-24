import { describe, expect, it } from "vitest";
import { LoginRateLimiter } from "../src/shared/security/login-rate-limit.js";

describe("LoginRateLimiter", () => {
  it("blocks after max attempts inside window", () => {
    let now = 0;
    const limiter = new LoginRateLimiter(3, 60_000, () => now);
    const key = "demo@example.com:127.0.0.1";

    limiter.recordFailure(key);
    limiter.recordFailure(key);
    expect(limiter.isBlocked(key)).toBe(false);

    limiter.recordFailure(key);
    expect(limiter.isBlocked(key)).toBe(true);
  });

  it("resets block after the window has passed", () => {
    let now = 0;
    const limiter = new LoginRateLimiter(2, 1_000, () => now);
    const key = "demo@example.com:127.0.0.1";

    limiter.recordFailure(key);
    limiter.recordFailure(key);
    expect(limiter.isBlocked(key)).toBe(true);

    now = 2_000;
    expect(limiter.isBlocked(key)).toBe(false);
  });

  it("can be explicitly reset on successful login", () => {
    const limiter = new LoginRateLimiter(1, 60_000);
    const key = "demo@example.com:127.0.0.1";

    limiter.recordFailure(key);
    expect(limiter.isBlocked(key)).toBe(true);

    limiter.reset(key);
    expect(limiter.isBlocked(key)).toBe(false);
  });
});
