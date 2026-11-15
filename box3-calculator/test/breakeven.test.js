"use strict";

/**
 * Break-even annual return: end wealth after tax == start wealth.
 * Uses simulate() with flat "gelijkmatig" rate and inleg = 0.
 */

var test = require("node:test");
var assert = require("node:assert/strict");
var h = require("./helpers.js");
var Model = require("../model.js");

function nearRate(actual, expected, tol, label) {
  h.near(actual, expected, tol, label || "rate");
}

test("sparen €1.000.000, 1 jaar: forfait-only ≈ tax/start; tegenbewijs & voorstel ≈ 0%", function () {
  var input = Model.sparen({
    wealth: 1000000,
    years: 1,
    rate: 0.0125,
    scenario: "gelijk",
    partner: false
  });

  var f = h.Box3.forfait(
    { bank: 1000000, invest: 0, crypto: 0, debt: 0, partner: false },
    h.params
  );
  var expectedForfait = f.tax / 1000000;

  var rates = h.Box3.breakEvenRates(input, h.params);
  nearRate(rates.forfait, expectedForfait, 2e-5, "forfait-only");
  nearRate(rates.huidig, 0, 2e-5, "tegenbewijs");
  nearRate(rates.nieuw, 0, 2e-5, "voorstel");

  // Numerical check: at forfait BE rate, forfait-only end ≈ start
  var simF = h.Box3.simulate(h.Box3.withFlatRate(input, rates.forfait), h.params);
  h.near(simF.totals.forfait.end, 1000000, 2, "end at forfait BE");

  var sim0 = h.Box3.simulate(h.Box3.withFlatRate(input, 0), h.params);
  h.near(sim0.totals.huidig.end, 1000000, 1, "tegenbewijs at 0%");
  h.near(sim0.totals.nieuw.end, 1000000, 1, "voorstel at 0%");
});

test("forfait-only multi-year: bisection restores start wealth", function () {
  // With nearly proportional forfait tax, the annual BE rate is close for 1y and 10y;
  // the check that matters is end(wealth) == start after N years at that rate.
  var input = Model.sparen({ wealth: 1000000, years: 10, rate: 0.01, scenario: "gelijk" });
  var ten = h.Box3.breakEvenRateFor(input, h.params, "forfait");
  var one = h.Box3.breakEvenRateFor(
    Model.sparen({ wealth: 1000000, years: 1, rate: 0.01, scenario: "gelijk" }),
    h.params,
    "forfait"
  );
  nearRate(ten, one, 5e-4, "10y near 1y for large spaartegoed");
  var sim = h.Box3.simulate(h.Box3.withFlatRate(input, ten), h.params);
  h.near(sim.totals.forfait.end, 1000000, 5, "10y forfait end");
});

test("beleggen hold: voorstel BE ≈ 0% (latent tax only on positive gain)", function () {
  var input = Model.beleggen({
    wealth: 100000,
    years: 10,
    rate: 0.07,
    mode: "hold",
    scenario: "gelijk",
    partner: false
  });
  var rates = h.Box3.breakEvenRates(input, h.params);
  nearRate(rates.nieuw, 0, 2e-5, "hold voorstel");
  nearRate(rates.huidig, 0, 2e-5, "hold tegenbewijs");
  // Forfait on overige bezittingen ≈ 6% × (100k−59.357)/100k × 36% ≈ 0,88%
  var f = h.Box3.forfait(
    { bank: 0, invest: 100000, crypto: 0, debt: 0, partner: false },
    h.params
  );
  nearRate(rates.forfait, f.tax / 100000, 5e-4, "hold forfait-only ≈ first-year tax/start");

  var atBe = h.Box3.simulate(h.Box3.withFlatRate(input, rates.forfait), h.params);
  h.near(atBe.totals.forfait.end, 100000, 5, "hold forfait end");
});

test("beleggen sell each year: forfait-only still positive; tegenbewijs/voorstel ≈ 0%", function () {
  var input = Model.beleggen({
    wealth: 100000,
    years: 5,
    rate: 0.07,
    mode: "sell",
    scenario: "gelijk"
  });
  var rates = h.Box3.breakEvenRates(input, h.params);
  nearRate(rates.huidig, 0, 2e-5);
  nearRate(rates.nieuw, 0, 2e-5);
  assert.ok(rates.forfait > 0);
});

test("break-even ignores inleg (forced to 0 in withFlatRate)", function () {
  var withInleg = Model.sparen({
    wealth: 500000,
    years: 3,
    rate: 0.02,
    inleg: 10000,
    scenario: "gelijk"
  });
  var flat = h.Box3.withFlatRate(withInleg, 0.02);
  assert.equal(flat.bank.inleg, 0);
  assert.equal(flat.invest.inleg, 0);
});

test("wealth below heffingsvrij: forfait-only BE also 0%", function () {
  var input = Model.sparen({
    wealth: 50000,
    years: 1,
    rate: 0.01,
    scenario: "gelijk"
  });
  var rates = h.Box3.breakEvenRates(input, h.params);
  nearRate(rates.forfait, 0, 2e-5);
  nearRate(rates.huidig, 0, 2e-5);
  nearRate(rates.nieuw, 0, 2e-5);
});
