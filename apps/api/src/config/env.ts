import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4000"),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().default("file:./data/todo.db"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  TZ: z.string().default("Asia/Shanghai").refine((value) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "TZ must be a valid IANA timezone, e.g. Asia/Shanghai"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  ENABLE_API_DOCS: booleanFromEnv.optional(),
  ALLOW_REGISTRATION: booleanFromEnv.optional(),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === "production" && data.JWT_SECRET.length < 32) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["JWT_SECRET"],
      message: "In production JWT_SECRET must be at least 32 characters",
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  parsed.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

const parsedEnv = parsed.data;

export const env = {
  ...parsedEnv,
  ENABLE_API_DOCS: parsedEnv.ENABLE_API_DOCS ?? parsedEnv.NODE_ENV !== "production",
  ALLOW_REGISTRATION: parsedEnv.ALLOW_REGISTRATION ?? true,
};
