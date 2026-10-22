import crypto from "node:crypto";

export function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(pin), salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPin(pin, stored) {
  if (!stored || typeof stored !== "string") return false;
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const candidate = crypto.scryptSync(String(pin), salt, 64);
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

export function createToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const dummyPinHash = hashPin("0000");
