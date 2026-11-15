"use strict";

/**
 * Wet werkelijk rendement box 3 (36 748) + amendement 37 022 nr. 80.
 * Verified-on: 2026-11-15.
 */

var test = require("node:test");
var assert = require("node:assert/strict");
var h = require("./helpers.js");

test("MvT voorbeeld 12: verlies €19.090 → verrekenbaar €18.590", function () {
  // URL: https://www.eerstekamer.nl/behandeling/20250516/memorie_van_toelichting
  // (Kamerstukken II 2024/25, 36 748, nr. 3)
  // Quote: "Resultaat ... -/- € 19.090" / "Verlies ... € 18.590 (= € 19.090 -/- € 500)"
  var r = h.Box3.taxNew(-19090, 0, h.params, false);
  assert.equal(r.lossCreated, 18590);
  assert.equal(r.tax, 0);
});

test("MvT voorbeeld 11 (Yuri): structuur exemption + loss; tarief via amendement 35,5%", function () {
  // URL MvT: https://www.eerstekamer.nl/behandeling/20250516/memorie_van_toelichting
  // Quote: "Resultaat ... € 50.980" / "Inkomen ... € 49.180 (= € 50.980 -/- € 1.800)"
  //         "Belastbaar ... € 24.180 (= € 49.180 -/- € 25.000)"
  // MvT used 36% → €8.704. Module uses amended 35,5% (still TK-only).
  // URL stemming: https://www.eerstekamer.nl/behandeling/20261112/stemmingsoverzicht_tweede_kamer_4
  var r = h.Box3.taxNew(50980, 25000, h.params, false);
  assert.equal(r.exemptionUsed, 1800);
  assert.equal(r.lossUsed, 25000);
  assert.equal(r.belastbaar, 24180);
  h.near(r.tax, 24180 * 0.355, 0.001, "yuri tax @35.5%");
});

test("MvT voorbeeld 10 (Xavier) spaarder: exemption then tax", function () {
  // Quote: "Resultaat ... € 3.980" / "Inkomen ... € 2.180 (= € 3.980 -/- € 1.800)"
  // MvT: "€ 784 (= € 2.180 x 36%)". With 35,5%: 2180 * 0.355.
  var r = h.Box3.taxNew(3980, 0, h.params, false);
  assert.equal(r.exemptionUsed, 1800);
  assert.equal(r.belastbaar, 2180);
  h.near(r.tax, 2180 * 0.355, 0.001, "xavier @35.5%");
});

test("eerst vrijstelling, daarna verliesverrekening (art. 5.1 / 5.2)", function () {
  // URL: https://www.eerstekamer.nl/behandeling/20260212/gewijzigd_voorstel_van_wet_2
  // Note in data.json: art. 5.2 vermindert positief resultaat met heffingsvrij resultaat;
  // art. 5.1 vermindert vervolgens met verliezen.
  var r = h.Box3.taxNew(5000, 10000, h.params, false);
  assert.equal(r.exemptionUsed, 1800);
  assert.equal(r.inkomen, 3200);
  assert.equal(r.lossUsed, 3200);
  assert.equal(r.belastbaar, 0);
  assert.equal(r.tax, 0);
});

test("toptarief boven €60.000 rendement (amendement nr. 80)", function () {
  // Quote: "38,5% ... vanaf een rendement van €60.000 per jaar" / "lage tarief ... 35,5%"
  var r = h.Box3.taxNew(100000, 0, h.params, false);
  // result 100000 - 1800 = 98200; low 60000 * 0.355 + 38200 * 0.385
  assert.equal(r.belastbaar, 98200);
  assert.equal(r.inLow, 60000);
  assert.equal(r.inHigh, 38200);
  h.near(r.tax, 60000 * 0.355 + 38200 * 0.385, 0.01, "top bracket");
});

test("artikelvoorbeeld flat 15% op €100.000: huidig ≈€878, voorstel €4.686", function () {
  // Arithmetic from forfait 6% × grondslag/RG × 36% vs (15000-1800)×35,5%.
  // Not a BD published example; cross-check of module consistency with sourced rates.
  var sim = h.Box3.simulate(h.Box3.oneYearInvest(100000, 0.15, false), h.params);
  assert.equal(h.euro(sim.totals.huidig.tax), 878);
  assert.equal(h.euro(sim.totals.nieuw.tax), 4686);
});

test("spaargeld €150.000 tegen forfaitrente: voorstel (1920−1800)×35,5%", function () {
  // Actual return equals forfait bank rate so tegenbewijs ≈ forfait continuous tax.
  // Official BD rounded tax is €417 (see forfait-bd.test.js).
  var sim = h.Box3.simulate({
    partner: false,
    years: 1,
    debt: 0,
    debtRate: 0,
    bank: { start: 150000, inleg: 0, rates: [0.0128] },
    invest: { start: 0, inleg: 0, price: [0], dividend: 0, mode: "sell" },
    crypto: { start: 0, inleg: 0, price: [0] }
  }, h.params);
  h.near(sim.totals.nieuw.tax, (1920 - 1800) * 0.355, 0.001, "spaar nieuw");
  h.near(sim.totals.huidig.tax, 417.68, 0.05, "spaar huidig continuous");
});
