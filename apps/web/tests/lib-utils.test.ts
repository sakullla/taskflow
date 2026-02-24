import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cn, formatDate, formatDateFull, isOverdue, isToday } from "../src/lib/utils";

describe("lib/utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 24, 9, 0, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("merges class names and tailwind conflicts", () => {
    expect(cn("px-2", "text-sm", "px-4")).toBe("text-sm px-4");
  });

  it("formats dates and handles empty values", () => {
    const date = new Date(2026, 1, 24, 12, 30, 0, 0);

    expect(formatDate(null)).toBe("");
    expect(formatDate(date)).toBe(
      date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
    );
    expect(formatDateFull(date)).toBe(
      date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  });

  it("detects overdue and today flags", () => {
    expect(isOverdue(new Date(2026, 1, 23, 23, 59, 0, 0))).toBe(true);
    expect(isOverdue(new Date(2026, 1, 24, 12, 0, 0, 0))).toBe(false);

    expect(isToday(new Date(2026, 1, 24, 0, 1, 0, 0))).toBe(true);
    expect(isToday(new Date(2026, 1, 25, 0, 1, 0, 0))).toBe(false);
  });
});
