"use strict";

/**
 * Honesty / comparison regressions.
 * Default beleggen at realistic rates must NOT always show "voorstel better".
 * Verified-on: 2026-11-15.
 */

var test = require("node:test");
var assert = require("node:assert/strict");
var h = require("./helpers.js");
var Model = require("../model.js");

test("beleggen €100k @7% 10y hold: voorstel duurder dan huidig", function () {
  var input = Model.beleggen({
    wealth: 100000,
    years: 10,
    rate: 0.07,
    mode: "hold",
    scenario: "gelijk",
    partner: false
  });
  var sim = h.Box3.simulate(input, h.params);
  assert.ok(
    sim.totals.nieuw.tax > sim.totals.huidig.tax,
    "expected nieuw tax " + sim.totals.nieuw.tax + " > huidig " + sim.totals.huidig.tax
  );
});

test("beleggen €100k @15% 1y sell: voorstel duurder (artikel flat15)", function () {
  var sim = h.Box3.simulate(h.Box3.oneYearInvest(100000, 0.15, false), h.params);
  assert.ok(sim.totals.nieuw.tax > sim.totals.huidig.tax);
  assert.equal(h.euro(sim.totals.huidig.tax), 878);
  assert.equal(h.euro(sim.totals.nieuw.tax), 4686);
});

test("sparen laag rendement kan voorstel goedkoper maken (geen bug)", function () {
  var input = Model.sparen({
    wealth: 100000,
    years: 10,
    rate: 0.02,
    scenario: "gelijk",
    partner: false
  });
  var sim = h.Box3.simulate(input, h.params);
  // Near crossover: voorstel may be lower — that is expected when actual << forfait other.
  assert.ok(sim.totals.huidig.tax >= 0);
  assert.ok(sim.totals.nieuw.tax >= 0);
});

test("hold round-trip: geen netto voorstelheffing bij terugkeer naar start", function () {
  var sim = h.Box3.simulate(h.Box3.articlePresets().holdRoundTrip.input, h.params);
  assert.equal(sim.totals.nieuw.tax, 0);
  assert.equal(h.euro(sim.totals.nieuw.end), 100000);
});

test("gain-then-loss sell: voorstel heffing in winstjaar, verliescarry", function () {
  var sim = h.Box3.simulate(h.Box3.articlePresets().gainThenLoss.input, h.params);
  assert.equal(h.euro(sim.rows[0].nieuw.tax), 14575);
  assert.ok(sim.rows[1].nieuw.lossCarry > 0);
});

test("INVEST_RATES includes 7%", function () {
  assert.ok(Model.INVEST_RATES.some(function (r) { return Math.abs(r - 0.07) < 1e-9; }));
});
