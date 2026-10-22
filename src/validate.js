import { badRequest } from "./errors.js";

export function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return digits;
  if (/^91[6-9]\d{9}$/.test(digits)) return digits.slice(2);
  throw badRequest("Enter a valid 10-digit Indian mobile number.", "INVALID_PHONE");
}

export function parsePin(value) {
  const pin = String(value ?? "").trim();
  if (!/^\d{4}$/.test(pin)) {
    throw badRequest("The PIN must be exactly 4 digits.", "INVALID_PIN");
  }
  return pin;
}

export function parseName(value, field = "name") {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2) throw badRequest(`Please enter a valid ${field}.`, "INVALID_NAME");
  if (name.length > 80) throw badRequest(`The ${field} is too long.`, "INVALID_NAME");
  return name;
}

export function parseVillage(value) {
  const village = String(value ?? "").trim().replace(/\s+/g, " ");
  if (village.length > 80) throw badRequest("The village name is too long.", "INVALID_VILLAGE");
  return village;
}

export function parseKg(value, { allowZero = false } = {}) {
  const kg = Number(value);
  const min = allowZero ? 0 : 0.01;
  if (!Number.isFinite(kg) || kg < min || kg > 5000) {
    throw badRequest(
      allowZero
        ? "Enter a weight between 0 and 5000 kg."
        : "Enter a weight between 0.01 and 5000 kg.",
      "INVALID_KG"
    );
  }
  return Math.round(kg * 100) / 100;
}

export function parsePricePaise(value) {
  const paise = Math.round(Number(value));
  if (!Number.isFinite(paise) || paise < 100 || paise > 100000000) {
    throw badRequest("Enter a price between ₹1 and ₹10,00,000 per kg.", "INVALID_PRICE");
  }
  return paise;
}

export function parseGrade(value) {
  const grade = String(value ?? "A").trim().toUpperCase();
  if (!["A", "B", "C"].includes(grade)) {
    throw badRequest("Choose grade A, B or C.", "INVALID_GRADE");
  }
  return grade;
}

export function parseNotes(value) {
  const notes = String(value ?? "").trim();
  if (notes.length > 160) throw badRequest("Notes must be 160 characters or fewer.", "INVALID_NOTES");
  return notes;
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw badRequest("Invalid id.", "INVALID_ID");
  return id;
}
