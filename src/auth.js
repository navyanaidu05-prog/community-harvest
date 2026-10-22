import { createToken, dummyPinHash, hashToken, verifyPin } from "./security.js";
import { normalizePhone, parsePin } from "./validate.js";
import { HttpError } from "./errors.js";

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    village: row.village || "",
    role: row.role
  };
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of String(header).split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

export function authenticate(db, req, config) {
  const token = parseCookies(req.headers.cookie)[config.session.cookieName];
  if (!token || token.length < 32) return null;

  const row = db
    .prepare(
      `SELECT u.id, u.name, u.phone, u.village, u.role, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.is_active = 1`
    )
    .get(hashToken(token), new Date().toISOString());

  return row ? publicUser(row) : null;
}

export function login(db, { phone, pin }, config) {
  let normalized;
  try {
    normalized = normalizePhone(phone);
  } catch {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Phone number or PIN is incorrect.");
  }

  let safePin;
  try {
    safePin = parsePin(pin);
  } catch {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Phone number or PIN is incorrect.");
  }

  const row = db.prepare("SELECT * FROM users WHERE phone = ? AND is_active = 1").get(normalized);
  const valid = verifyPin(safePin, row?.pin_hash || dummyPinHash);
  if (!row || !valid) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Phone number or PIN is incorrect.");
  }

  const token = createToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.session.days * 24 * 60 * 60 * 1000);
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now.toISOString());
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
  ).run(hashToken(token), row.id, expiresAt.toISOString(), now.toISOString());

  return { token, user: publicUser(row) };
}

export function logout(db, req, config) {
  const token = parseCookies(req.headers.cookie)[config.session.cookieName];
  if (token) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  }
}

export function sessionCookie(token, config) {
  const maxAge = config.session.days * 24 * 60 * 60;
  return [
    `${config.session.cookieName}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    config.session.secure ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearedSessionCookie(config) {
  return [
    `${config.session.cookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    config.session.secure ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");
}
