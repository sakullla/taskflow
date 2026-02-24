interface LoginAttempt {
  count: number;
  firstFailureAt: number;
}

export class LoginRateLimiter {
  private readonly attempts = new Map<string, LoginAttempt>();

  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
    private readonly now: () => number = () => Date.now()
  ) {}

  isBlocked(key: string): boolean {
    const attempt = this.attempts.get(key);
    if (!attempt) return false;

    const now = this.now();
    if (now - attempt.firstFailureAt > this.windowMs) {
      this.attempts.delete(key);
      return false;
    }

    return attempt.count >= this.maxAttempts;
  }

  recordFailure(key: string): void {
    const now = this.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now - attempt.firstFailureAt > this.windowMs) {
      this.attempts.set(key, { count: 1, firstFailureAt: now });
      return;
    }

    this.attempts.set(key, {
      count: attempt.count + 1,
      firstFailureAt: attempt.firstFailureAt,
    });
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}
