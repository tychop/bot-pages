"use strict";

/**
 * Parameter values from data.json must match primary sources fetched online.
 * Verified-on: 2026-11-15 (Europe/Amsterdam).
 */

var test = require("node:test");
var assert = require("node:assert/strict");
var h = require("./helpers.js");

test("huidig forfaittarief 36% (Belastingdienst tarieven box 3)", function () {
  // URL: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/boxen_en_tarieven/box_3/box_3
  // Quote: "2026 | 36%"
  assert.equal(h.params.forfaitTarief, 0.36);
});

test("heffingsvrij vermogen 2026 €59.357 / €118.714", function () {
  // URL: https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/heffingsvrij-vermogen
  // Quote: "2026 | € 59.357 | € 118.714"
  assert.equal(h.params.exemptionWealth, 59357);
  assert.equal(h.params.exemptionWealthPartner, 118714);
});

test("forfaitaire percentages 2026: bank 1,28%, overig 6,00%, schulden 2,70%", function () {
  // URL: https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/berekening-box-3-inkomen-2026
  // Quote: "Banktegoeden: 1,28%" / "Beleggingen en andere bezittingen: 6,00%" / "Schulden: 2,70%"
  assert.equal(h.params.rateBank, 0.0128);
  assert.equal(h.params.rateOther, 0.06);
  assert.equal(h.params.rateDebt, 0.027);
});

test("schuldendrempel 2026 €3.800 per persoon", function () {
  // URL: https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/berekening-box-3-inkomen-2026
  // Quote: "De drempel is € 3.800 per persoon."
  assert.equal(h.params.debtThreshold, 3800);
});

test("heffingsvrij resultaat voorstel €1.800 (art. 5.40 gewijzigd voorstel)", function () {
  // URL: https://www.eerstekamer.nl/behandeling/20260212/gewijzigd_voorstel_van_wet_2
  // Artikel 5.40: "Het heffingsvrije resultaat bedraagt € 1.800."
  assert.equal(h.params.exemptionResult, 1800);
  assert.equal(h.params.exemptionResultPartner, 3600);
});

test("verliesdrempel €500 (art. 5.65 gewijzigd voorstel)", function () {
  // URL: https://www.eerstekamer.nl/behandeling/20260212/gewijzigd_voorstel_van_wet_2
  // Artikel 5.65: "...voor zover dit bedrag in absolute zin hoger is dan € 500."
  assert.equal(h.params.lossThreshold, 500);
});

test("tarieven amendement 37 022 nr. 80: 35,5% / 38,5% vanaf €60.000", function () {
  // URL: https://www.eerstekamer.nl/behandeling/20261112/stemmingsoverzicht_tweede_kamer_4
  // Quote: "toptarief in box 3 ... van 38,5% met een aanvangspunt van € 60.000 rendement per jaar"
  // Quote: "reguliere tarief in box 3 te verlagen van 36% naar 35,5%"
  // Stemming 12 nov 2026: aangenomen (TK); EK nog niet definitief.
  assert.equal(h.params.rateLow, 0.355);
  assert.equal(h.params.rateHigh, 0.385);
  assert.equal(h.params.bracketLimit, 60000);
});

test("beoogd ingangsjaar nieuw stelsel 2029 (novelle MvT)", function () {
  // URL: https://zoek.officielebekendmakingen.nl/kst-1278606.pdf
  // Quote: "...inwerkingtreding ... 1 januari 2029"
  assert.equal(h.params.startYear, 2029);
});

test("every data.json leaf has source URL, as_of and status", function () {
  function walk(node, pathName, out) {
    if (!node || typeof node !== "object") return;
    if (!Array.isArray(node) && Object.prototype.hasOwnProperty.call(node, "value")) {
      out.push({ path: pathName, node: node });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(function (item, i) {
        walk(item, pathName + "[" + i + "]", out);
      });
      return;
    }
    Object.keys(node).forEach(function (key) {
      if (key === "news" || key === "documents" || key === "notes_for_updates") return;
      walk(node[key], pathName ? pathName + "." + key : key, out);
    });
  }
  var leaves = [];
  walk(h.data, "", leaves);
  assert.ok(leaves.length > 20);
  leaves.forEach(function (leaf) {
    assert.equal(typeof leaf.node.source, "string", leaf.path);
    assert.match(leaf.node.source, /^https:\/\//, leaf.path);
    assert.match(String(leaf.node.as_of), /^\d{4}-\d{2}-\d{2}/, leaf.path);
    assert.ok(leaf.node.status, leaf.path);
  });
});
