"use strict";

/**
 * Tegenbewijsregeling (current system).
 * Primary: Wet IB 2001 art. 5.25–5.28 via Wet tegenbewijsregeling box 3 (Stb. 2025, 195)
 * and Belastingdienst pages.
 * Verified-on: 2026-11-15.
 */

var test = require("node:test");
var assert = require("node:assert/strict");
var h = require("./helpers.js");

test("art. 5.25: werkelijk rendement vervangt forfait als het lager is", function () {
  // URL: https://wetten.overheid.nl/BWBR0011353/2026-01-01/#Hoofdstuk5_Afdeling5.6_Artikel5.25
  // Quote: "Indien de belastingplichtige aannemelijk maakt dat het werkelijke rendement ... lager is
  // dan het voordeel uit sparen en beleggen, wordt het belastbare inkomen ... gesteld op het
  // werkelijke rendement"
  // URL: https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/wat-is-mijn-werkelijk-rendement
  // Quote: "U gaat nooit meer belasting betalen dan wij eerder hebben berekend."
  var peil = { bank: 0, invest: 100000, crypto: 0, debt: 0, partner: false };
  var low = h.Box3.huidigTax(peil, 2000, h.params);
  var high = h.Box3.huidigTax(peil, 20000, h.params);
  assert.equal(low.used, "tegenbewijs");
  assert.ok(low.tax < low.forfaitTax);
  assert.equal(high.used, "forfait");
  assert.equal(high.tax, high.forfaitTax);
});

test("tegenbewijs: geen heffingsvrij vermogen op werkelijk rendement", function () {
  // URL: https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/heffingsvrij-vermogen
  // Quote: "Bij de berekening van uw werkelijk rendement hebt u geen heffingsvrij vermogen"
  // → tax = max(0, actual) × 36%, not reduced by exemption wealth.
  var peil = { bank: 50000, invest: 0, crypto: 0, debt: 0, partner: false };
  var f = h.Box3.forfait(peil, h.params);
  assert.equal(f.tax, 0); // under exemption
  var t = h.Box3.huidigTax(peil, 1000, h.params);
  assert.equal(t.tegenbewijsTax, 360);
  assert.equal(t.tax, 0); // forfait is still lower (0)
});

test("tegenbewijs: negatief rendement op €0, geen jaarverrekening", function () {
  // URL: https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/wat-is-mijn-werkelijk-rendement
  // Quote: "Is uw totale werkelijk rendement negatief? ... zetten wij dit op € 0.
  // U mag een negatief rendement in het ene jaar niet met een ander jaar verrekenen."
  var peil = { bank: 0, invest: 100000, crypto: 0, debt: 0, partner: false };
  var t = h.Box3.huidigTax(peil, -5000, h.params);
  assert.equal(t.tegenbewijsTax, 0);
  assert.equal(t.used, "tegenbewijs");
  assert.equal(t.tax, 0);
});

test("BD voorbeeld tegenbewijs-rekenlogica: rente + koersdaling = €700", function () {
  // URL: https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/wat-is-mijn-werkelijk-rendement
  // Quote: "€ 1.000 rente ... aandelen ... € 300 gedaald ... werkelijk rendement ... € 700."
  assert.equal(1000 - 300, 700);
  var peil = { bank: 100000, invest: 50000, crypto: 0, debt: 0, partner: false };
  var t = h.Box3.huidigTax(peil, 700, h.params);
  assert.equal(t.tegenbewijsTax, 700 * 0.36);
});
