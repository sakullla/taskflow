import { env } from "../../config/env.js";

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

export function getDateKey(dateInput: Date | string, timeZone = env.TZ): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const parts = getDateFormatter(timeZone).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

export function getTodayDateKey(timeZone = env.TZ): string {
  return getDateKey(new Date(), timeZone);
}
