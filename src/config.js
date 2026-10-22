import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

export function loadEnv(filePath = path.join(rootDir, ".env")) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function deepMerge(base, overrides) {
  const result = { ...base };
  for (const [key, value] of Object.entries(overrides || {})) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object"
    ) {
      result[key] = deepMerge(base[key], value);
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export function loadConfig(overrides = {}) {
  const env = process.env;
  const isProduction = (env.NODE_ENV || "development") === "production";
  const port = Number(env.PORT || 3100);

  const config = {
    isProduction,
    rootDir,
    publicDir: path.join(rootDir, "public"),
    port: Number.isFinite(port) && port >= 0 ? port : 3100,
    databasePath:
      env.DATABASE_PATH === ":memory:"
        ? ":memory:"
        : path.resolve(rootDir, env.DATABASE_PATH || "./data/harvest.db"),
    appUrl: (env.APP_URL || `http://localhost:${port}`).replace(/\/+$/, ""),
    session: {
      cookieName: "ch_session",
      days: 30,
      secure: isProduction
    },
    admin: {
      name: env.ADMIN_NAME || "Coordinator",
      phone: env.ADMIN_PHONE || "9999999999",
      pin: env.ADMIN_PIN || "1234"
    }
  };

  if (isProduction) {
    if (config.admin.phone === "9999999999" || config.admin.pin === "1234") {
      throw new Error(
        "Set ADMIN_PHONE and ADMIN_PIN in .env (do not use the example defaults) before running in production."
      );
    }
  }

  return deepMerge(config, overrides);
}
