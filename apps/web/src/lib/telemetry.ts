export interface TelemetryEvent {
  name: string;
  level?: "info" | "warn" | "error";
  metadata?: Record<string, unknown>;
}

// v1 telemetry hook: console sink, can be replaced by real analytics provider.
export function trackEvent(event: TelemetryEvent): void {
  const level = event.level ?? "info";
  const payload = {
    ts: new Date().toISOString(),
    name: event.name,
    metadata: event.metadata ?? {}
  };

  if (level === "error") {
    console.error("[telemetry]", payload);
    return;
  }

  if (level === "warn") {
    console.warn("[telemetry]", payload);
    return;
  }

  console.log("[telemetry]", payload);
}
