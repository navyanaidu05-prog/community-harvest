import { badRequest, conflict, forbidden, notFound } from "./errors.js";
import { hashPin } from "./security.js";
import {
  normalizePhone,
  parseGrade,
  parseId,
  parseKg,
  parseName,
  parseNotes,
  parsePin,
  parsePricePaise,
  parseVillage
} from "./validate.js";
import { withTransaction } from "./db.js";

const round2 = (value) => Math.round(value * 100) / 100;
const nowIso = () => new Date().toISOString();

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromLocal(iso) {
  const [year, month, day] = String(iso).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function upcomingMonday(from = new Date()) {
  const day = startOfDay(from);
  const weekday = day.getDay();
  const offset = weekday === 1 ? 0 : (8 - weekday) % 7;
  return addDays(day, offset);
}

function cutoffIso(tripDate) {
  const sunday = addDays(dateFromLocal(tripDate), -1);
  sunday.setHours(18, 0, 0, 0);
  return sunday.toISOString();
}

export function serializeTrip(row, { isCurrent = false } = {}) {
  if (!row) return null;
  return {
    id: row.id,
    tripDate: row.trip_date,
    status: row.status,
    cutoffAt: row.cutoff_at,
    pricedAt: row.priced_at,
    closedAt: row.closed_at,
    isCurrent
  };
}

function findOpenTrip(db) {
  return db
    .prepare("SELECT * FROM trips WHERE status != 'closed' ORDER BY trip_date DESC LIMIT 1")
    .get();
}

function insertTrip(db, date) {
  db.prepare(
    "INSERT INTO trips (trip_date, status, cutoff_at, created_at) VALUES (?, 'collecting', ?, ?)"
  ).run(date, cutoffIso(date), nowIso());
  return db.prepare("SELECT * FROM trips WHERE trip_date = ?").get(date);
}

function createUpcomingTrip(db, startDate) {
  let date = startDate;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const existing = db.prepare("SELECT * FROM trips WHERE trip_date = ?").get(date);
    if (existing) {
      if (existing.status !== "closed") return existing;
      date = localDateString(addDays(dateFromLocal(date), 7));
      continue;
    }
    return insertTrip(db, date);
  }
  throw new Error("Could not find a free collection week.");
}

export function ensureCurrentTrip(db) {
  const current = findOpenTrip(db);
  if (current) {
    const ageDays = Math.floor(
      (startOfDay(new Date()) - dateFromLocal(current.trip_date)) / 86400000
    );
    if (ageDays <= 60) return current;
    db.prepare("UPDATE trips SET status = 'closed', closed_at = ? WHERE id = ?").run(
      nowIso(),
      current.id
    );
  }
  return createUpcomingTrip(db, localDateString(upcomingMonday()));
}

export function startNextWeek(db) {
  const current = findOpenTrip(db);
  if (current) {
    db.prepare("UPDATE trips SET status = 'closed', closed_at = ? WHERE id = ?").run(
      nowIso(),
      current.id
    );
  }

  const fromCurrent = current
    ? localDateString(addDays(dateFromLocal(current.trip_date), 7))
    : null;
  const fromToday = localDateString(upcomingMonday());
  const startDate = fromCurrent && fromCurrent > fromToday ? fromCurrent : fromToday;
  const trip = createUpcomingTrip(db, startDate);
  return serializeTrip(trip, { isCurrent: true });
}

function listCrops(db) {
  return db
    .prepare("SELECT * FROM crops WHERE is_active = 1 ORDER BY sort_order, name COLLATE NOCASE")
    .all()
    .map((row) => ({
      id: row.id,
      name: row.name,
      nameTe: row.name_te,
      category: row.category,
      emoji: row.emoji
    }));
}

function cropMap(db) {
  return new Map(listCrops(db).map((crop) => [crop.id, crop]));
}

function mapListing(row) {
  return {
    id: row.id,
    tripId: row.trip_id,
    farmerId: row.farmer_id,
    farmerName: row.farmer_name,
    cropId: row.crop_id,
    cropName: row.crop_name,
    cropNameTe: row.crop_name_te,
    emoji: row.emoji,
    category: row.category,
    listedKg: row.listed_kg,
    acceptedKg: row.accepted_kg,
    grade: row.grade,
    notes: row.notes,
    updatedAt: row.updated_at
  };
}

function listingRows(db, tripId) {
  return db
    .prepare(
      `SELECT l.*, u.name AS farmer_name, u.village AS farmer_village,
              c.name AS crop_name, c.name_te AS crop_name_te, c.emoji, c.category
       FROM listings l
       JOIN users u ON u.id = l.farmer_id
       JOIN crops c ON c.id = l.crop_id
       WHERE l.trip_id = ?
       ORDER BY c.sort_order, u.name COLLATE NOCASE`
    )
    .all(tripId);
}

function priceMap(db, tripId) {
  const rows = db.prepare("SELECT * FROM prices WHERE trip_id = ?").all(tripId);
  return new Map(
    rows.map((row) => [
      row.crop_id,
      { cropId: row.crop_id, pricePaise: row.price_paise, setAt: row.set_at }
    ])
  );
}

function lastPricesBefore(db, trip) {
  const rows = db
    .prepare(
      `SELECT p.crop_id, p.price_paise, p.set_at, t.trip_date
       FROM prices p
       JOIN trips t ON t.id = p.trip_id
       WHERE t.id != ? AND t.trip_date < ? AND t.status IN ('priced', 'closed')
       ORDER BY t.trip_date DESC, p.set_at DESC`
    )
    .all(trip.id, trip.trip_date);

  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.crop_id)) {
      map.set(row.crop_id, { pricePaise: row.price_paise, tripDate: row.trip_date });
    }
  }
  return map;
}

function effectiveKg(listing) {
  return listing.accepted_kg == null ? listing.listed_kg : listing.accepted_kg;
}

function buildSummary(listings, prices, crops) {
  const byCrop = new Map();
  const byCropFarmer = new Map();

  for (const crop of crops) {
    byCrop.set(crop.id, {
      cropId: crop.id,
      name: crop.name,
      nameTe: crop.nameTe,
      emoji: crop.emoji,
      category: crop.category,
      totalListedKg: 0,
      totalPayableKg: 0,
      pricePaise: prices.get(crop.id)?.pricePaise ?? null,
      valuePaise: 0,
      breakdown: []
    });
  }

  for (const listing of listings) {
    const summary = byCrop.get(listing.crop_id);
    if (!summary) continue;
    const payable = effectiveKg(listing);
    const price = prices.get(listing.crop_id)?.pricePaise ?? null;
    const value = price == null ? null : Math.round(payable * price);

    summary.totalListedKg = round2(summary.totalListedKg + listing.listed_kg);
    summary.totalPayableKg = round2(summary.totalPayableKg + payable);
    if (value != null) summary.valuePaise += value;

    let farmerRow = byCropFarmer.get(listing.crop_id);
    if (!farmerRow) {
      farmerRow = new Map();
      byCropFarmer.set(listing.crop_id, farmerRow);
    }
    farmerRow.set(listing.farmer_id, {
      farmerId: listing.farmer_id,
      farmerName: listing.farmer_name,
      village: listing.farmer_village || "",
      listedKg: listing.listed_kg,
      acceptedKg: listing.accepted_kg,
      payableKg: payable,
      grade: listing.grade,
      valuePaise: value
    });
  }

  for (const [cropId, farmers] of byCropFarmer) {
    const summary = byCrop.get(cropId);
    if (summary) {
      summary.breakdown = [...farmers.values()].sort((a, b) =>
        a.farmerName.localeCompare(b.farmerName)
      );
    }
  }

  return [...byCrop.values()].filter(
    (summary) => summary.totalListedKg > 0 || summary.pricePaise != null
  );
}

function buildSettlements(listings, prices) {
  const byFarmer = new Map();

  for (const listing of listings) {
    let settlement = byFarmer.get(listing.farmer_id);
    if (!settlement) {
      settlement = {
        farmerId: listing.farmer_id,
        farmerName: listing.farmer_name,
        village: listing.farmer_village || "",
        listedKg: 0,
        payableKg: 0,
        valuePaise: 0,
        unpricedItems: 0,
        items: []
      };
      byFarmer.set(listing.farmer_id, settlement);
    }

    const payable = effectiveKg(listing);
    const price = prices.get(listing.crop_id)?.pricePaise ?? null;
    const value = price == null ? null : Math.round(payable * price);

    settlement.listedKg = round2(settlement.listedKg + listing.listed_kg);
    settlement.payableKg = round2(settlement.payableKg + payable);
    if (value == null) settlement.unpricedItems += 1;
    else settlement.valuePaise += value;

    settlement.items.push({
      cropId: listing.crop_id,
      name: listing.crop_name,
      nameTe: listing.crop_name_te,
      emoji: listing.emoji,
      listedKg: listing.listed_kg,
      acceptedKg: listing.accepted_kg,
      payableKg: payable,
      pricePaise: price,
      valuePaise: value
    });
  }

  return [...byFarmer.values()].sort((a, b) =>
    a.farmerName.localeCompare(b.farmerName)
  );
}

export function getOverview(db, user, tripId = null) {
  let trip;
  if (tripId) {
    trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(parseId(tripId));
    if (!trip) throw notFound("That harvest week was not found.");
  } else {
    trip = ensureCurrentTrip(db);
  }

  const currentTrip = findOpenTrip(db);
  const crops = listCrops(db);
  const cropsById = new Map(crops.map((crop) => [crop.id, crop]));
  const prices = priceMap(db, trip.id);
  const rows = listingRows(db, trip.id);
  const summary = buildSummary(rows, prices, crops);
  const lastPrices = lastPricesBefore(db, trip);
  const canManage = user.role === "admin";

  const populated = summary.map((item) => ({
    ...item,
    breakdown: canManage ? item.breakdown : undefined,
    lastPricePaise: lastPrices.get(item.cropId)?.pricePaise ?? null,
    lastPriceTripDate: lastPrices.get(item.cropId)?.tripDate ?? null
  }));

  const totals = populated.reduce(
    (acc, item) => {
      acc.listedKg = round2(acc.listedKg + item.totalListedKg);
      acc.payableKg = round2(acc.payableKg + item.totalPayableKg);
      acc.valuePaise += item.valuePaise;
      if (item.pricePaise == null) acc.unpricedCrops += 1;
      else acc.pricedCrops += 1;
      return acc;
    },
    { listedKg: 0, payableKg: 0, valuePaise: 0, pricedCrops: 0, unpricedCrops: 0 }
  );
  totals.families = new Set(rows.map((row) => row.farmer_id)).size;

  const data = {
    user,
    trip: serializeTrip(trip, { isCurrent: Boolean(currentTrip && currentTrip.id === trip.id) }),
    crops,
    summary: populated,
    prices: [...prices.values()],
    totals,
    lastPrices: [...lastPrices.entries()].map(([cropId, value]) => ({
      cropId,
      pricePaise: value.pricePaise,
      tripDate: value.tripDate
    })),
    canManage,
    canAdd:
      trip.status !== "closed" && (canManage || trip.status === "collecting"),
    serverNow: nowIso()
  };

  if (canManage) {
    data.listings = rows.map(mapListing);
    data.farmers = listFarmers(db);
    data.settlements = buildSettlements(rows, prices);
    data.tripHistory = db
      .prepare("SELECT * FROM trips ORDER BY trip_date DESC LIMIT 8")
      .all()
      .map((row) => serializeTrip(row, { isCurrent: currentTrip?.id === row.id }));
  } else {
    data.myListings = rows
      .filter((row) => row.farmer_id === user.id)
      .map(mapListing);
    data.mySettlement =
      buildSettlements(rows, prices).find((entry) => entry.farmerId === user.id) || null;
    data.myCrops = cropsById.size;
  }

  return data;
}

export function listFarmers(db) {
  return db
    .prepare(
      `SELECT id, name, phone, village, is_active, created_at
       FROM users WHERE role = 'farmer' ORDER BY name COLLATE NOCASE`
    )
    .all()
    .map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      village: row.village || "",
      isActive: Boolean(row.is_active),
      createdAt: row.created_at
    }));
}

export function createFarmer(db, input) {
  const name = parseName(input.name, "family name");
  const phone = normalizePhone(input.phone);
  const village = parseVillage(input.village);
  const pin = parsePin(input.pin);

  const existing = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
  if (existing) {
    throw conflict("A family with that phone number already exists.", "PHONE_TAKEN");
  }

  const now = nowIso();
  const result = db
    .prepare(
      `INSERT INTO users (name, phone, village, role, pin_hash, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 'farmer', ?, 1, ?, ?)`
    )
    .run(name, phone, village, hashPin(pin), now, now);

  return {
    id: Number(result.lastInsertRowid),
    name,
    phone,
    village,
    isActive: true,
    createdAt: now
  };
}

export function updateFarmer(db, id, input) {
  const farmerId = parseId(id);
  const existing = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'farmer'").get(farmerId);
  if (!existing) throw notFound("That family was not found.");

  const has = (key) => Object.prototype.hasOwnProperty.call(input, key);
  if (!has("name") && !has("village") && !has("pin") && !has("isActive")) {
    throw badRequest("No family changes were provided.", "NO_CHANGES");
  }

  const name = has("name") ? parseName(input.name, "family name") : existing.name;
  const village = has("village") ? parseVillage(input.village) : existing.village;
  const isActive = has("isActive") ? Boolean(input.isActive) : Boolean(existing.is_active);
  const pinHash = has("pin") ? hashPin(parsePin(input.pin)) : existing.pin_hash;

  db.prepare(
    "UPDATE users SET name = ?, village = ?, pin_hash = ?, is_active = ?, updated_at = ? WHERE id = ?"
  ).run(name, village, pinHash, isActive ? 1 : 0, nowIso(), farmerId);

  if (!isActive) {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(farmerId);
  }

  return { id: farmerId, name, phone: existing.phone, village, isActive };
}

export function createListing(db, user, input) {
  const trip = ensureCurrentTrip(db);
  if (trip.status === "closed") {
    throw conflict("This harvest week is closed.", "TRIP_CLOSED");
  }
  if (user.role !== "admin" && trip.status !== "collecting") {
    throw conflict(
      "Prices are already in for this trip. Ask the coordinator to change your entry.",
      "TRIP_LOCKED"
    );
  }

  const cropId = parseId(input.cropId);
  const crop = db.prepare("SELECT * FROM crops WHERE id = ? AND is_active = 1").get(cropId);
  if (!crop) throw notFound("That vegetable was not found.");

  let farmerId;
  if (user.role === "admin") {
    farmerId = parseId(input.farmerId);
    const farmer = db
      .prepare("SELECT id FROM users WHERE id = ? AND role = 'farmer' AND is_active = 1")
      .get(farmerId);
    if (!farmer) throw notFound("That family was not found.");
  } else {
    farmerId = user.id;
  }

  const kg = parseKg(input.kg);
  const grade = parseGrade(input.grade);
  const notes = parseNotes(input.notes);
  const now = nowIso();

  db.prepare(
    `INSERT INTO listings
       (trip_id, farmer_id, crop_id, listed_kg, accepted_kg, grade, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)
     ON CONFLICT (trip_id, farmer_id, crop_id) DO UPDATE SET
       listed_kg = excluded.listed_kg,
       grade = excluded.grade,
       notes = excluded.notes,
       updated_at = excluded.updated_at`
  ).run(trip.id, farmerId, cropId, kg, grade, notes, now, now);

  const row = db
    .prepare(
      `SELECT l.*, u.name AS farmer_name, u.village AS farmer_village,
              c.name AS crop_name, c.name_te AS crop_name_te, c.emoji, c.category
       FROM listings l
       JOIN users u ON u.id = l.farmer_id
       JOIN crops c ON c.id = l.crop_id
       WHERE l.trip_id = ? AND l.farmer_id = ? AND l.crop_id = ?`
    )
    .get(trip.id, farmerId, cropId);

  return mapListing(row);
}

export function deleteListing(db, user, id) {
  const listingId = parseId(id);
  const row = db
    .prepare(
      `SELECT l.*, t.status AS trip_status
       FROM listings l JOIN trips t ON t.id = l.trip_id
       WHERE l.id = ?`
    )
    .get(listingId);
  if (!row) throw notFound("That entry was not found.");
  if (row.trip_status === "closed") {
    throw conflict("This harvest week is closed.", "TRIP_CLOSED");
  }
  if (user.role !== "admin") {
    if (row.farmer_id !== user.id) throw forbidden("You can only remove your own entry.");
    if (row.trip_status !== "collecting") {
      throw conflict("Prices are already in. Ask the coordinator to change your entry.", "TRIP_LOCKED");
    }
  }
  db.prepare("DELETE FROM listings WHERE id = ?").run(listingId);
}

export function weighListing(db, id, input) {
  const listingId = parseId(id);
  const row = db
    .prepare(
      `SELECT l.*, t.status AS trip_status
       FROM listings l JOIN trips t ON t.id = l.trip_id
       WHERE l.id = ?`
    )
    .get(listingId);
  if (!row) throw notFound("That entry was not found.");
  if (row.trip_status === "closed") {
    throw conflict("This harvest week is closed.", "TRIP_CLOSED");
  }

  const acceptedKg = parseKg(input.acceptedKg, { allowZero: true });
  db.prepare("UPDATE listings SET accepted_kg = ?, updated_at = ? WHERE id = ?").run(
    acceptedKg,
    nowIso(),
    listingId
  );
  return { id: listingId, acceptedKg };
}

export function setPrices(db, user, input) {
  if (!Array.isArray(input.prices) || input.prices.length < 1) {
    throw badRequest("Enter at least one price.", "NO_PRICES");
  }
  if (input.prices.length > 200) {
    throw badRequest("Too many price rows.", "TOO_MANY_PRICES");
  }

  const trip = ensureCurrentTrip(db);
  if (trip.status === "closed") {
    throw conflict("This harvest week is closed.", "TRIP_CLOSED");
  }

  const seen = new Set();
  const clean = input.prices.map((item) => {
    const cropId = parseId(item.cropId);
    if (seen.has(cropId)) throw badRequest("Each vegetable can only have one price.", "DUPLICATE_CROP");
    seen.add(cropId);
    const crop = db.prepare("SELECT id FROM crops WHERE id = ? AND is_active = 1").get(cropId);
    if (!crop) throw notFound("That vegetable was not found.");
    return { cropId, pricePaise: parsePricePaise(item.pricePaise) };
  });

  withTransaction(db, () => {
    const now = nowIso();
    const existing = db.prepare("SELECT price_paise FROM prices WHERE trip_id = ? AND crop_id = ?");
    const upsert = db.prepare(
      `INSERT INTO prices (trip_id, crop_id, price_paise, set_by, set_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (trip_id, crop_id) DO UPDATE SET
         price_paise = excluded.price_paise,
         set_by = excluded.set_by,
         set_at = excluded.set_at`
    );
    const audit = db.prepare(
      `INSERT INTO price_audit
         (trip_id, crop_id, old_price_paise, new_price_paise, changed_by, changed_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    for (const item of clean) {
      const old = existing.get(trip.id, item.cropId);
      upsert.run(trip.id, item.cropId, item.pricePaise, user.id, now);
      if (!old || old.price_paise !== item.pricePaise) {
        audit.run(trip.id, item.cropId, old?.price_paise ?? null, item.pricePaise, user.id, now);
      }
    }

    db.prepare("UPDATE trips SET status = 'priced', priced_at = COALESCE(priced_at, ?) WHERE id = ?").run(
      now,
      trip.id
    );
  });

  return serializeTrip(ensureCurrentTrip(db), { isCurrent: true });
}

export function tripHistory(db) {
  return db
    .prepare("SELECT * FROM trips ORDER BY trip_date DESC LIMIT 12")
    .all()
    .map((row) => serializeTrip(row));
}
