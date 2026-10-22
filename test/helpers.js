import assert from "node:assert/strict";
import { once } from "node:events";
import { loadConfig } from "../src/config.js";
import { createDatabase, seedDatabase } from "../src/db.js";
import { createApp } from "../src/app.js";

export const testAdmin = {
  name: "Test Coordinator",
  phone: "9990001111",
  pin: "4321"
};

export const testFarmer = {
  name: "Anitha",
  phone: "9876500001",
  village: "Kothur",
  pin: "1111"
};

export const testFarmerTwo = {
  name: "Lakshmi",
  phone: "9876500002",
  village: "Kothur",
  pin: "2222"
};

export async function startServer(t, overrides = {}) {
  const config = loadConfig({
    isProduction: false,
    databasePath: ":memory:",
    appUrl: "http://127.0.0.1",
    admin: testAdmin,
    ...overrides
  });
  const db = createDatabase(":memory:");
  seedDatabase(db, config);
  const server = createApp({ db, config });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    db.close();
  });

  return {
    baseUrl,
    db,
    config,
    client: () => createClient(baseUrl)
  };
}

export function createClient(baseUrl) {
  const cookies = new Map();

  async function request(pathname, { method = "GET", body, headers = {} } = {}) {
    const requestHeaders = {
      accept: "application/json",
      ...headers
    };
    if (body !== undefined) requestHeaders["content-type"] = "application/json";
    if (method !== "GET" && method !== "HEAD") requestHeaders.origin = baseUrl;
    if (cookies.size) {
      requestHeaders.cookie = [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
    }

    const response = await fetch(`${baseUrl}${pathname}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual"
    });

    for (const raw of response.headers.getSetCookie()) {
      const pair = raw.split(";")[0];
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (!value || /max-age=0/i.test(raw)) cookies.delete(name);
      else cookies.set(name, value);
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    return { status: response.status, headers: response.headers, text, data };
  }

  return { request, cookies };
}

export async function login(client, phone, pin) {
  return client.request("/api/login", { method: "POST", body: { phone, pin } });
}

export async function loginAdmin(client) {
  return login(client, testAdmin.phone, testAdmin.pin);
}

export function cropByName(overview, name) {
  return overview.crops.find((crop) => crop.name === name);
}
