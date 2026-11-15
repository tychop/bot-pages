"use strict";

/**
 * Two-column bank-style statement (Huidige box 3 | Voorgestelde box 3).
 */

var test = require("node:test");
var assert = require("node:assert/strict");
var h = require("./helpers.js");
var Model = require("../model.js");

test("STATEMENT_ROWS order matches the comparison table", function () {
  assert.deepEqual(Model.STATEMENT_ROWS, [
    "Startvermogen",
    "Vermogen na rente/winst",
    "Belasting box 3",
    "Vermogen na belasting",
    "Benodigd rendement om quitte te spelen"
  ]);
});

test("statementColumns: same start/afterReturn in both columns; taxes and ends differ", function () {
  var input = Model.sparen({
    wealth: 1000000,
    years: 1,
    rate: 0.0125,
    scenario: "gelijk",
    partner: false
  });
  var sim = h.Box3.simulate(input, h.params);
  var be = h.Box3.breakEvenRates(input, h.params);
  var cols = Model.statementColumns(sim, 0, be);

  assert.equal(cols.huidig.title, "Huidige box 3");
  assert.equal(cols.voorstel.title, "Voorgestelde box 3");
  assert.equal(cols.huidig.start, cols.voorstel.start);
  assert.equal(cols.huidig.start, 1000000);
  assert.equal(cols.huidig.afterReturn, cols.voorstel.afterReturn);
  h.near(cols.huidig.afterReturn, 1012500, 1, "after interest");
  assert.ok(cols.huidig.tax > cols.voorstel.tax);
  h.near(cols.huidig.end, cols.huidig.afterReturn - cols.huidig.tax, 1);
  h.near(cols.voorstel.end, cols.voorstel.afterReturn - cols.voorstel.tax, 1);

  assert.ok(Math.abs(cols.huidig.breakEven) < 2e-5);
  assert.ok(cols.huidig.breakEvenForfait > 0.004);
  assert.ok(Math.abs(cols.voorstel.breakEven) < 2e-5);
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

test("statementColumns works for beleggen hold", function () {
  var input = Model.beleggen({
    wealth: 100000,
    years: 10,
    rate: 0.07,
    mode: "hold",
    scenario: "gelijk"
  });
  var sim = h.Box3.simulate(input, h.params);
  var be = h.Box3.breakEvenRates(input, h.params);
  var cols = Model.statementColumns(sim, 0, be);
  assert.equal(cols.huidig.start, 100000);
  assert.ok(cols.huidig.afterReturn > cols.huidig.start);
  assert.ok(cols.voorstel.tax > cols.huidig.tax);
  assert.ok(cols.huidig.end > cols.voorstel.end);
  assert.ok(cols.huidig.breakEvenForfait > cols.huidig.breakEven);
});
