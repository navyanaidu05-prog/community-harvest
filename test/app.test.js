import assert from "node:assert/strict";
import test from "node:test";
import {
  cropByName,
  login,
  loginAdmin,
  startServer,
  testAdmin,
  testFarmer,
  testFarmerTwo
} from "./helpers.js";

test("the full weekly harvest flow works end to end", async (t) => {
  const ctx = await startServer(t);
  const admin = ctx.client();
  const farmer = ctx.client();
  const secondFarmer = ctx.client();

  const adminLogin = await loginAdmin(admin);
  assert.equal(adminLogin.status, 200);
  assert.equal(adminLogin.data.user.role, "admin");

  const anitha = await admin.request("/api/farmers", {
    method: "POST",
    body: { name: testFarmer.name, phone: testFarmer.phone, village: testFarmer.village, pin: testFarmer.pin }
  });
  assert.equal(anitha.status, 201);
  assert.equal(anitha.data.farmer.phone, testFarmer.phone);

  const lakshmi = await admin.request("/api/farmers", {
    method: "POST",
    body: {
      name: testFarmerTwo.name,
      phone: testFarmerTwo.phone,
      village: testFarmerTwo.village,
      pin: testFarmerTwo.pin
    }
  });
  assert.equal(lakshmi.status, 201);

  const farmerLogin = await login(farmer, testFarmer.phone, testFarmer.pin);
  assert.equal(farmerLogin.status, 200);
  assert.equal(farmerLogin.data.user.role, "farmer");
  assert.equal(farmerLogin.data.user.name, testFarmer.name);

  const secondLogin = await login(secondFarmer, testFarmerTwo.phone, testFarmerTwo.pin);
  assert.equal(secondLogin.status, 200);

  let overview = (await farmer.request("/api/overview")).data.overview;
  assert.equal(overview.trip.status, "collecting");
  assert.equal(overview.crops.length, 18);
  assert.equal(overview.canAdd, true);

  const tomato = cropByName(overview, "Tomato");
  const spinach = cropByName(overview, "Spinach");

  const firstEntry = await farmer.request("/api/listings", {
    method: "POST",
    body: { cropId: tomato.id, kg: 10, grade: "A" }
  });
  assert.equal(firstEntry.status, 201);
  assert.equal(firstEntry.data.listing.listedKg, 10);

  const leafyEntry = await farmer.request("/api/listings", {
    method: "POST",
    body: { cropId: spinach.id, kg: 4, grade: "A", notes: "Morning picking" }
  });
  assert.equal(leafyEntry.status, 201);

  const replaced = await farmer.request("/api/listings", {
    method: "POST",
    body: { cropId: tomato.id, kg: 12, grade: "A" }
  });
  assert.equal(replaced.status, 201);
  assert.equal(replaced.data.listing.listedKg, 12);

  const lakshmiEntry = await secondFarmer.request("/api/listings", {
    method: "POST",
    body: { cropId: tomato.id, kg: 5, grade: "B" }
  });
  assert.equal(lakshmiEntry.status, 201);

  overview = (await admin.request("/api/overview")).data.overview;
  assert.equal(overview.listings.length, 3);
  assert.equal(overview.totals.families, 2);
  assert.equal(overview.totals.listedKg, 21);
  const tomatoSummary = overview.summary.find((row) => row.cropId === tomato.id);
  assert.equal(tomatoSummary.totalListedKg, 17);

  const farmerPriceAttempt = await farmer.request("/api/prices", {
    method: "POST",
    body: { prices: [{ cropId: tomato.id, pricePaise: 4000 }] }
  });
  assert.equal(farmerPriceAttempt.status, 403);

  const priceResult = await admin.request("/api/prices", {
    method: "POST",
    body: {
      prices: [
        { cropId: tomato.id, pricePaise: 4000 },
        { cropId: spinach.id, pricePaise: 1000 }
      ]
    }
  });
  assert.equal(priceResult.status, 200);
  assert.equal(priceResult.data.trip.status, "priced");

  overview = (await farmer.request("/api/overview")).data.overview;
  assert.equal(overview.canAdd, false);
  assert.equal(overview.mySettlement.valuePaise, 52000);
  assert.equal(overview.mySettlement.payableKg, 16);

  const lockedEntry = await farmer.request("/api/listings", {
    method: "POST",
    body: { cropId: tomato.id, kg: 30 }
  });
  assert.equal(lockedEntry.status, 409);
  assert.equal(lockedEntry.data.error.code, "TRIP_LOCKED");

  overview = (await admin.request("/api/overview")).data.overview;
  const secondSettlement = overview.settlements.find((row) => row.farmerId === lakshmi.data.farmer.id);
  assert.equal(secondSettlement.valuePaise, 20000);
  assert.equal(overview.totals.valuePaise, 72000);

  const anithaTomato = overview.listings.find(
    (row) => row.farmerId === anitha.data.farmer.id && row.cropId === tomato.id
  );
  const weighed = await admin.request(`/api/listings/${anithaTomato.id}/weigh`, {
    method: "PATCH",
    body: { acceptedKg: 11 }
  });
  assert.equal(weighed.status, 200);
  assert.equal(weighed.data.listing.acceptedKg, 11);

  overview = (await farmer.request("/api/overview")).data.overview;
  assert.equal(overview.mySettlement.valuePaise, 48000);

  const oldTripId = overview.trip.id;
  const nextWeek = await admin.request("/api/trips/next", { method: "POST", body: {} });
  assert.equal(nextWeek.status, 200);
  assert.equal(nextWeek.data.overview.trip.status, "collecting");
  assert.notEqual(nextWeek.data.overview.trip.id, oldTripId);

  const history = (await admin.request(`/api/overview?tripId=${oldTripId}`)).data.overview;
  assert.equal(history.trip.status, "closed");
  assert.equal(history.totals.valuePaise, 68000);
  assert.equal(history.settlements.find((row) => row.farmerId === anitha.data.farmer.id).valuePaise, 48000);

  const freshEntry = await farmer.request("/api/listings", {
    method: "POST",
    body: { cropId: spinach.id, kg: 3 }
  });
  assert.equal(freshEntry.status, 201);
});

test("sign-in, family management, and validation are protected", async (t) => {
  const ctx = await startServer(t);
  const admin = ctx.client();
  const outsider = ctx.client();

  assert.equal((await login(admin, testAdmin.phone, "0000")).status, 401);
  assert.equal((await login(admin, "12345", testAdmin.pin)).status, 401);
  assert.equal((await loginAdmin(admin)).status, 200);

  const badPhone = await admin.request("/api/farmers", {
    method: "POST",
    body: { name: "Bad", phone: "1234567890", pin: "1234" }
  });
  assert.equal(badPhone.status, 400);
  assert.equal(badPhone.data.error.code, "INVALID_PHONE");

  const badPin = await admin.request("/api/farmers", {
    method: "POST",
    body: { name: "Bad", phone: "9876500011", pin: "12" }
  });
  assert.equal(badPin.status, 400);
  assert.equal(badPin.data.error.code, "INVALID_PIN");

  const created = await admin.request("/api/farmers", {
    method: "POST",
    body: { name: "Anitha", phone: testFarmer.phone, village: "Kothur", pin: testFarmer.pin }
  });
  assert.equal(created.status, 201);

  const duplicate = await admin.request("/api/farmers", {
    method: "POST",
    body: { name: "Anitha 2", phone: testFarmer.phone, village: "Kothur", pin: "1111" }
  });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.data.error.code, "PHONE_TAKEN");

  const update = await admin.request(`/api/farmers/${created.data.farmer.id}`, {
    method: "PATCH",
    body: { village: "Nandigama", pin: "3333" }
  });
  assert.equal(update.status, 200);
  assert.equal(update.data.farmer.village, "Nandigama");

  assert.equal((await login(outsider, testFarmer.phone, "1111")).status, 401);
  assert.equal((await login(outsider, testFarmer.phone, "3333")).status, 200);

  const overview = (await outsider.request("/api/overview")).data.overview;
  const tomato = cropByName(overview, "Tomato");

  const noCrop = await outsider.request("/api/listings", {
    method: "POST",
    body: { cropId: 9999, kg: 2 }
  });
  assert.equal(noCrop.status, 404);

  const badKg = await outsider.request("/api/listings", {
    method: "POST",
    body: { cropId: tomato.id, kg: -1 }
  });
  assert.equal(badKg.status, 400);

  const forbiddenFamilies = await outsider.request("/api/farmers", {
    method: "POST",
    body: { name: "X", phone: "9876500022", pin: "1234" }
  });
  assert.equal(forbiddenFamilies.status, 403);

  const forbiddenPrices = await outsider.request("/api/prices", {
    method: "POST",
    body: { prices: [{ cropId: tomato.id, pricePaise: 2000 }] }
  });
  assert.equal(forbiddenPrices.status, 403);

  const forbiddenNextWeek = await outsider.request("/api/trips/next", {
    method: "POST",
    body: {}
  });
  assert.equal(forbiddenNextWeek.status, 403);

  await admin.request("/api/logout", { method: "POST", body: {} });
  assert.equal((await admin.request("/api/overview")).status, 401);
});

test("serves an installable app shell", async (t) => {
  const ctx = await startServer(t);
  const client = ctx.client();

  const html = await client.request("/", { headers: { accept: "text/html" } });
  assert.equal(html.status, 200);
  assert.match(html.text, /Community Harvest/);
  assert.match(html.headers.get("content-security-policy"), /default-src 'self'/);
  assert.match(html.headers.get("content-security-policy"), /script-src 'self'/);

  const manifest = await client.request("/manifest.webmanifest");
  assert.equal(manifest.status, 200);
  assert.equal(manifest.data.name, "Community Harvest");

  const worker = await client.request("/sw.js", { headers: { accept: "*/*" } });
  assert.equal(worker.status, 200);
  assert.equal(worker.headers.get("cache-control"), "no-cache");

  const missing = await client.request("/api/nope");
  assert.equal(missing.status, 404);
  assert.equal(missing.data.error.code, "NOT_FOUND");
});
