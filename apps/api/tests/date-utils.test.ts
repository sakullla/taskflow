import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDate,
  getEndOfDay,
  getStartOfDay,
  getTodayString,
  isSameDay,
} from "../src/shared/utils/date.js";
import { getDateKey, getTodayDateKey } from "../src/shared/utils/timezone.js";

describe("date/timezone utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-24T23:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns day boundaries and same-day detection", () => {
    const source = new Date("2026-02-24T12:34:56.789Z");
    const start = getStartOfDay(source);
    const end = getEndOfDay(source);

    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);

    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);

    expect(isSameDay(new Date("2026-02-24T01:00:00.000Z"), new Date("2026-02-24T23:59:59.000Z"))).toBe(true);
    expect(isSameDay(new Date("2026-02-24T23:59:59.000Z"), new Date("2026-02-25T00:00:00.000Z"))).toBe(false);
  });

  it("formats date keys across timezones", () => {
    const lateUtc = "2026-02-24T23:30:00.000Z";

    expect(getDateKey(lateUtc, "UTC")).toBe("2026-02-24");
    expect(getDateKey(lateUtc, "Asia/Shanghai")).toBe("2026-02-25");
    expect(formatDate("2026-02-24T00:00:00.000Z")).toBe("2026-02-24");
  });

  it("uses timezone-aware current day helpers", () => {
    expect(getTodayDateKey("UTC")).toBe("2026-02-24");
    expect(getTodayDateKey("Asia/Shanghai")).toBe("2026-02-25");
    expect(getTodayString()).toBe("2026-02-24");
  });
});
