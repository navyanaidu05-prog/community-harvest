import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {
  authenticate,
  clearedSessionCookie,
  login,
  logout,
  publicUser,
  sessionCookie
} from "./auth.js";
import { HttpError, badRequest, forbidden, unauthorized } from "./errors.js";
import * as service from "./service.js";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8"
};

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 20;
const loginAttempts = new Map();

function securityHeaders(res, config, isHtml = false) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-Frame-Options", "DENY");
  if (isHtml) {
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "img-src 'self' data:",
        "style-src 'self'",
        "script-src 'self'",
        "connect-src 'self'",
        "manifest-src 'self'",
        "font-src 'self'"
      ].join("; ")
    );
  }
  if (config.isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

function requireBody(req) {
  return new Promise((resolve, reject) => {
    const type = String(req.headers["content-type"] || "");
    if (!/^application\/json\b/i.test(type)) {
      reject(new HttpError(415, "JSON_REQUIRED", "This endpoint requires a JSON request body."));
      return;
    }

    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 100_000) {
        reject(new HttpError(413, "BODY_TOO_LARGE", "The request is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(badRequest("The request body is not valid JSON.", "INVALID_JSON"));
      }
    });
    req.on("error", reject);
  });
}

function requireSameOrigin(req, config) {
  const origin = req.headers.origin;
  if (!origin) return;
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    throw forbidden("Request origin is not allowed.");
  }
  const host = req.headers.host || "";
  const allowed = new Set([`http://${host}`, `https://${host}`, config.appUrl]);
  if (!allowed.has(parsed.origin)) {
    throw forbidden("Request origin is not allowed.");
  }
}

function checkLoginLimit(req) {
  const key = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  entry.count += 1;
  if (entry.count > LOGIN_MAX_ATTEMPTS) {
    throw new HttpError(
      429,
      "RATE_LIMITED",
      "Too many sign-in attempts. Please wait a few minutes and try again."
    );
  }
}

function clearLoginLimit(req) {
  loginAttempts.delete(req.socket.remoteAddress || "unknown");
}

function requireAdmin(user) {
  if (user.role !== "admin") {
    throw forbidden("Only the coordinator can do that.");
  }
}

function serveFile(req, res, filePath, config, { cache = "no-cache" } = {}) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const isHtml = ext === ".html";
  securityHeaders(res, config, isHtml);
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", cache);
  res.setHeader("Content-Length", fs.statSync(filePath).size);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Could not read file");
    } else {
      res.destroy();
    }
  });
  stream.pipe(res);
}

function serveStatic(req, res, pathname, config) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    res.end("Method not allowed");
    return;
  }

  let requested;
  try {
    requested = decodeURIComponent(pathname);
  } catch {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  if (requested === "/") requested = "/index.html";
  const resolved = path.resolve(config.publicDir, `.${requested}`);
  const insidePublic =
    resolved === config.publicDir || resolved.startsWith(config.publicDir + path.sep);

  if (!insidePublic) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  let filePath = resolved;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const cache =
      ext === ".html" || path.basename(filePath) === "sw.js" || ext === ".webmanifest"
        ? "no-cache"
        : "public, max-age=3600";
    serveFile(req, res, filePath, config, { cache });
    return;
  }

  const acceptsHtml = String(req.headers.accept || "").includes("text/html");
  const looksLikeAsset = /\.[a-z0-9]+$/i.test(requested);
  if (acceptsHtml && !looksLikeAsset) {
    serveFile(req, res, path.join(config.publicDir, "index.html"), config);
    return;
  }

  res.statusCode = 404;
  res.end("Not found");
}

const API_PATH =
  /^\/api\/(?:health|me|login|logout|overview|trips|trips\/next|listings|listings\/\d+|listings\/\d+\/weigh|prices|farmers|farmers\/\d+)$/;

async function handleApi(req, res, url, config, db) {
  const method = req.method;
  const pathname = url.pathname;
  if (!API_PATH.test(pathname)) {
    throw new HttpError(404, "NOT_FOUND", "API endpoint not found.");
  }
  const user = authenticate(db, req, config);

  if (method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "community-harvest", time: new Date().toISOString() });
    return;
  }

  if (method === "GET" && pathname === "/api/me") {
    sendJson(res, 200, { user: user ? publicUser(user) : null });
    return;
  }

  if (method === "POST" && pathname === "/api/login") {
    requireSameOrigin(req, config);
    checkLoginLimit(req);
    const body = await requireBody(req);
    const result = login(db, body, config);
    clearLoginLimit(req);
    res.setHeader("Set-Cookie", sessionCookie(result.token, config));
    sendJson(res, 200, { user: result.user });
    return;
  }

  if (method === "POST" && pathname === "/api/logout") {
    requireSameOrigin(req, config);
    logout(db, req, config);
    res.setHeader("Set-Cookie", clearedSessionCookie(config));
    sendJson(res, 200, { ok: true });
    return;
  }

  if (!user) throw unauthorized();

  if (method === "GET" && pathname === "/api/overview") {
    const tripId = url.searchParams.get("tripId");
    sendJson(res, 200, { overview: service.getOverview(db, user, tripId) });
    return;
  }

  if (method === "GET" && pathname === "/api/trips") {
    sendJson(res, 200, { trips: service.tripHistory(db) });
    return;
  }

  if (method === "POST" && pathname === "/api/listings") {
    requireSameOrigin(req, config);
    const body = await requireBody(req);
    const listing = service.createListing(db, user, body);
    sendJson(res, 201, { listing });
    return;
  }

  const listingMatch = pathname.match(/^\/api\/listings\/(\d+)$/);
  if (listingMatch && method === "DELETE") {
    requireSameOrigin(req, config);
    service.deleteListing(db, user, listingMatch[1]);
    sendJson(res, 200, { ok: true });
    return;
  }

  const weighMatch = pathname.match(/^\/api\/listings\/(\d+)\/weigh$/);
  if (weighMatch && method === "PATCH") {
    requireSameOrigin(req, config);
    requireAdmin(user);
    const body = await requireBody(req);
    const listing = service.weighListing(db, weighMatch[1], body);
    sendJson(res, 200, { listing });
    return;
  }

  if (method === "POST" && pathname === "/api/prices") {
    requireSameOrigin(req, config);
    requireAdmin(user);
    const body = await requireBody(req);
    const trip = service.setPrices(db, user, body);
    sendJson(res, 200, { trip, overview: service.getOverview(db, user) });
    return;
  }

  if (method === "POST" && pathname === "/api/farmers") {
    requireSameOrigin(req, config);
    requireAdmin(user);
    const body = await requireBody(req);
    const farmer = service.createFarmer(db, body);
    sendJson(res, 201, { farmer });
    return;
  }

  const farmerMatch = pathname.match(/^\/api\/farmers\/(\d+)$/);
  if (farmerMatch && method === "PATCH") {
    requireSameOrigin(req, config);
    requireAdmin(user);
    const body = await requireBody(req);
    const farmer = service.updateFarmer(db, farmerMatch[1], body);
    sendJson(res, 200, { farmer });
    return;
  }

  if (method === "POST" && pathname === "/api/trips/next") {
    requireSameOrigin(req, config);
    requireAdmin(user);
    service.startNextWeek(db);
    sendJson(res, 200, { overview: service.getOverview(db, user) });
    return;
  }

  throw new HttpError(404, "NOT_FOUND", "API endpoint not found.");
}

function handleError(error, req, res, config) {
  if (res.headersSent) {
    res.destroy();
    return;
  }
  if (error instanceof HttpError) {
    sendJson(res, error.status, {
      error: {
        code: error.code,
        message: error.message,
        details: error.details || undefined
      }
    });
    return;
  }
  console.error("Unhandled request error:", error);
  securityHeaders(res, config);
  sendJson(res, 500, {
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." }
  });
}

export function createApp({ db, config }) {
  return http.createServer(async (req, res) => {
    try {
      securityHeaders(res, config);
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url, config, db);
        return;
      }

      serveStatic(req, res, url.pathname, config);
    } catch (error) {
      handleError(error, req, res, config);
    }
  });
}
