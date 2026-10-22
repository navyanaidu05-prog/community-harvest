import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashPin } from "./security.js";
import { normalizePhone, parsePin } from "./validate.js";

const schemaVersion = 1;

const CROPS = [
  { name: "Tomato", nameTe: "టమాటా", category: "vegetable", emoji: "🍅" },
  { name: "Brinjal", nameTe: "వంకాయ", category: "vegetable", emoji: "🍆" },
  { name: "Okra", nameTe: "బెండకాయ", category: "vegetable", emoji: "🌿" },
  { name: "Green chilli", nameTe: "పచ్చిమిర్చి", category: "vegetable", emoji: "🌶️" },
  { name: "Bottle gourd", nameTe: "సొరకాయ", category: "vegetable", emoji: "🥒" },
  { name: "Bitter gourd", nameTe: "కాకరకాయ", category: "vegetable", emoji: "🥒" },
  { name: "Ridge gourd", nameTe: "బీరకాయ", category: "vegetable", emoji: "🥒" },
  { name: "Snake gourd", nameTe: "పొట్లకాయ", category: "vegetable", emoji: "🥒" },
  { name: "Cucumber", nameTe: "దోసకాయ", category: "vegetable", emoji: "🥒" },
  { name: "Drumstick", nameTe: "మునగకాండ", category: "vegetable", emoji: "🌿" },
  { name: "Pumpkin", nameTe: "గుమ్మడికాయ", category: "vegetable", emoji: "🎃" },
  { name: "Onion", nameTe: "ఉల్లిపాయ", category: "vegetable", emoji: "🧅" },
  { name: "Spinach", nameTe: "పాలకూర", category: "leafy", emoji: "🥬" },
  { name: "Amaranth", nameTe: "తోటకూర", category: "leafy", emoji: "🥬" },
  { name: "Gongura", nameTe: "గోంగూర", category: "leafy", emoji: "🥬" },
  { name: "Curry leaves", nameTe: "కరివేపాకు", category: "leafy", emoji: "🌿" },
  { name: "Coriander", nameTe: "కొత్తిమీర", category: "leafy", emoji: "🌿" },
  { name: "Mint", nameTe: "పుదీనా", category: "leafy", emoji: "🌿" }
];

function migrate(db) {
  const current = db.prepare("PRAGMA user_version").get().user_version;
  if (current >= schemaVersion) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      village TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('admin', 'farmer')),
      pin_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      name_te TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'vegetable',
      emoji TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_date TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'collecting' CHECK (status IN ('collecting', 'priced', 'closed')),
      cutoff_at TEXT NOT NULL,
      priced_at TEXT,
      closed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      farmer_id INTEGER NOT NULL REFERENCES users(id),
      crop_id INTEGER NOT NULL REFERENCES crops(id),
      listed_kg REAL NOT NULL CHECK (listed_kg > 0),
      accepted_kg REAL CHECK (accepted_kg IS NULL OR accepted_kg >= 0),
      grade TEXT NOT NULL DEFAULT 'A',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (trip_id, farmer_id, crop_id)
    );

    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      crop_id INTEGER NOT NULL REFERENCES crops(id),
      price_paise INTEGER NOT NULL CHECK (price_paise > 0),
      set_by INTEGER NOT NULL REFERENCES users(id),
      set_at TEXT NOT NULL,
      UNIQUE (trip_id, crop_id)
    );

    CREATE TABLE IF NOT EXISTS price_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      crop_id INTEGER NOT NULL REFERENCES crops(id),
      old_price_paise INTEGER,
      new_price_paise INTEGER NOT NULL,
      changed_by INTEGER NOT NULL REFERENCES users(id),
      changed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS listings_trip_idx ON listings(trip_id, crop_id);
    CREATE INDEX IF NOT EXISTS listings_farmer_idx ON listings(farmer_id, trip_id);
    CREATE INDEX IF NOT EXISTS prices_trip_idx ON prices(trip_id);
    CREATE INDEX IF NOT EXISTS trips_status_idx ON trips(status, trip_date);
  `);

  db.exec(`PRAGMA user_version = ${schemaVersion}`);
}

function seedCrops(db) {
  const count = db.prepare("SELECT COUNT(*) AS count FROM crops").get().count;
  if (count > 0) return;

  const insert = db.prepare(
    "INSERT INTO crops (name, name_te, category, emoji, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)"
  );
  db.exec("BEGIN IMMEDIATE");
  try {
    CROPS.forEach((crop, index) => {
      insert.run(crop.name, crop.nameTe, crop.category, crop.emoji, index + 1);
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function seedAdmin(db, admin) {
  const phone = normalizePhone(admin.phone);
  const pin = parsePin(admin.pin);
  const existing = db.prepare("SELECT id, role FROM users WHERE phone = ?").get(phone);

  if (existing) {
    if (existing.role !== "admin") {
      console.warn("Admin seed skipped: that phone number belongs to a family account.");
    }
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (name, phone, village, role, pin_hash, is_active, created_at, updated_at)
     VALUES (?, ?, '', 'admin', ?, 1, ?, ?)`
  ).run(admin.name, phone, hashPin(pin), now, now);
  console.log(`Coordinator account ready: ${admin.name} (${phone})`);
}

export function createDatabase(filePath) {
  if (filePath !== ":memory:") {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  migrate(db);
  return db;
}

export function seedDatabase(db, config) {
  seedCrops(db);
  seedAdmin(db, config.admin);
}

export function withTransaction(db, callback) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      void 0;
    }
    throw error;
  }
}
