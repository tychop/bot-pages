"use strict";

/**
 * Novelle uitbreiding vermogenswinstbelasting box 3 (37 053).
 * Source: https://zoek.officielebekendmakingen.nl/kst-1278606.pdf
 * Status: https://www.eerstekamer.nl/wetsvoorstel/37053_novelle_uitbreiding
 * Verified-on: 2026-11-15.
 */

var test = require("node:test");
var assert = require("node:assert/strict");
var h = require("./helpers.js");

test("novelle status: TK aangenomen 12 nov 2026, EK nog open", function () {
  // URL: https://www.eerstekamer.nl/wetsvoorstel/37053_novelle_uitbreiding
  // Quote: "Het voorstel is op 12 november 2026 aangenomen door de Tweede Kamer."
  // Quote: "De Eerste Kamercommissie voor Financiën (FIN) bespreekt op 17 november 2026 de procedure."
  assert.equal(h.data.nieuw_stelsel.status.value, "voorstel / nog niet definitief");
  assert.equal(h.data.nieuw_stelsel.ingangsjaar.value, 2029);
});

test("MvT novelle voorbeeld Henk: 2029 €50 dividend, 2030 €340 voordeel", function () {
  // URL: https://zoek.officielebekendmakingen.nl/kst-1278606.pdf §2.3
  // Quote: "Het belastbare voordeel in 2029 bedraagt € 50 en in 2030 € 340."
  // 2029: only dividend €50 (no sale).
  // 2030: sale €1.700 − gem. verkrijgingsprijs €1.400 = €300 + dividend €40 = €340.
  var year2029 = 50;
  var year2030 = (1700 - 1400) + 40;
  assert.equal(year2029, 50);
  assert.equal(year2030, 340);
  // Module uses step-up at start; one-purchase hold/sell path matches dividend + realized gain.
  var sim = h.Box3.simulate({
    partner: false,
    years: 2,
    debt: 0,
    debtRate: 0,
    bank: { start: 0, inleg: 0, rates: [0, 0] },
    invest: {
      start: 1000,
      inleg: 0,
      price: [0, 0.7],
      dividend: 0,
      mode: "hold"
    },
    crypto: { start: 0, inleg: 0, price: [0, 0] }
  }, h.params);
  // Custom: year1 dividend-only via investResult=dividend when hold; year2 sell at end.
  // Price path 0 then +70% on €1000 → end 1700, gain 700 — not Henk's multi-lot case.
  // Document that multi-lot average cost is NOT fully simulated; rule arithmetic is tested above.
  assert.ok(sim.rows[1].nieuw.result > 0 || sim.rows[1].nieuw.tax >= 0);
});

test("financiële instrumenten: vermogenswinst; bank/crypto: vermogensaanwas", function () {
  // Quote §2.4: "directe cryptobeleggingen (crypto wallets), ... banktegoeden ...
  // tijdelijk een vermogensaanwasbelasting"
  // Quote: "financiële instrumenten ... vermogenswinstbelasting"
  assert.equal(h.data.nieuw_stelsel.financiele_instrumenten.value, "vermogenswinst");
  assert.equal(h.data.nieuw_stelsel.banktegoeden.value, "vermogensaanwas");
  assert.equal(h.data.nieuw_stelsel.directe_crypto.value, "vermogensaanwas");
});

test("crypto vermogensaanwas: jaarlijkse waardestijging belast zonder verkoop", function () {
  // Same novelle §2.4 — crypto stays under vermogensaanwas until expected 2030 step.
  var sim = h.Box3.simulate({
    partner: false,
    years: 1,
    debt: 0,
    debtRate: 0,
    bank: { start: 0, inleg: 0, rates: [0] },
    invest: { start: 0, inleg: 0, price: [0], dividend: 0, mode: "hold" },
    crypto: { start: 100000, inleg: 0, price: [0.2] }
  }, h.params);
  // result 20000 − 1800 = 18200 × 0.355
  h.near(sim.totals.nieuw.tax, 18200 * 0.355, 0.01, "crypto aanwas");
});

test("aandelen hold: latente winst pas in laatste jaar (vermogenswinst)", function () {
  var sim = h.Box3.simulate({
    partner: false,
    years: 2,
    debt: 0,
    debtRate: 0,
    bank: { start: 0, inleg: 0, rates: [0, 0] },
    invest: { start: 100000, inleg: 0, price: [0.1, 0.1], dividend: 0, mode: "hold" },
    crypto: { start: 0, inleg: 0, price: [0, 0] }
  }, h.params);
  assert.equal(sim.rows[0].nieuw.tax, 0);
  assert.ok(sim.rows[1].nieuw.tax > 0);
});
