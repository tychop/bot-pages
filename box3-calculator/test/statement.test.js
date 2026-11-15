"use strict";

/**
 * Bank-style statement overview used on every tab.
 */

var test = require("node:test");
var assert = require("node:assert/strict");
var h = require("./helpers.js");
var Model = require("../model.js");

test("statementTotals order: start → afterReturn → taxes → ends", function () {
  var input = Model.sparen({
    wealth: 1000000,
    years: 1,
    rate: 0.0125,
    scenario: "gelijk",
    partner: false
  });
  var sim = h.Box3.simulate(input, h.params);
  var s = Model.statementTotals(sim, 0);
  assert.equal(s.start, 1000000);
  h.near(s.afterReturn, 1012500, 1, "after interest");
  assert.ok(s.taxHuidig > s.taxNieuw, "huidig tax higher at high savings");
  h.near(s.endHuidig, s.afterReturn - s.taxHuidig, 1, "end huidig");
  h.near(s.endNieuw, s.afterReturn - s.taxNieuw, 1, "end nieuw");
});

test("statementDelta is a single sentence", function () {
  var a = Model.statementDelta(4334, 3799, function (n) { return "€ " + n; });
  assert.match(a, /huidige stelsel kost/);
  assert.equal(a.indexOf("."), a.length - 1);
  var b = Model.statementDelta(100, 500, function (n) { return "€ " + n; });
  assert.match(b, /voorstel kost/);
  var c = Model.statementDelta(10, 10.2, function (n) { return "€ " + n; });
  assert.match(c, /vrijwel gelijk/);
});

test("statement works for beleggen hold totals", function () {
  var input = Model.beleggen({
    wealth: 100000,
    years: 10,
    rate: 0.07,
    mode: "hold",
    scenario: "gelijk"
  });
  var sim = h.Box3.simulate(input, h.params);
  var s = Model.statementTotals(sim, 0);
  assert.equal(s.start, 100000);
  assert.ok(s.afterReturn > s.start);
  assert.ok(s.taxNieuw > s.taxHuidig);
  assert.ok(s.endHuidig > s.endNieuw);
});
