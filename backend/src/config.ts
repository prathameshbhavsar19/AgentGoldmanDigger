import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DB_PATH: z.string().default("./data/portfolio_gps.db"),
  DATA_DIR: z.string().default("./data"),
  USERS_DIR: z.string().default("./data/users"),

  PYTHON_HOST: z.string().default("127.0.0.1"),
  PYTHON_PORT: z.coerce.number().default(8001),
  PYTHON_HTTP_BASE: z.string().default("http://127.0.0.1:8001"),
  PYTHON_WS_BASE: z.string().default("ws://127.0.0.1:8001"),

  USE_MOCK_PYTHON: z.coerce.boolean().default(true),

  ALLOWED_ORIGINS: z.string().default("http://localhost:8080"),

  UPLOAD_MAX_MB: z.coerce.number().default(10),
  SESSION_TTL_HOURS: z.coerce.number().default(72),

  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const cfg = parsed.data;
export type Cfg = typeof cfg;
