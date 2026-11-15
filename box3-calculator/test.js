"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var Box3 = require("./calc.js");

var data = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
var params = Box3.parseParams(data);
var presets = Box3.articlePresets();

function euro(n) {
  return Math.round(n);
}

function near(actual, expected, cents) {
  assert.ok(
    Math.abs(actual - expected) <= cents,
    "expected " + expected + " ± " + cents + ", got " + actual
  );
}

function walkParams(node, pathName, out) {
  if (!node || typeof node !== "object") return;
  if (!Array.isArray(node) && Object.prototype.hasOwnProperty.call(node, "value")) {
    out.push({ path: pathName, node: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach(function (item, i) {
      walkParams(item, pathName + "[" + i + "]", out);
    });
    return;
  }
  Object.keys(node).forEach(function (key) {
    if (key === "news" || key === "documents" || key === "notes_for_updates") return;
    walkParams(node[key], pathName ? pathName + "." + key : key, out);
  });
}

var leaves = [];
walkParams(data, "", leaves);
assert.ok(leaves.length > 20, "te weinig parameters in data.json");
leaves.forEach(function (leaf) {
  assert.equal(typeof leaf.node.source, "string", leaf.path + " mist source");
  assert.ok(/^https:\/\//.test(leaf.node.source), leaf.path + " source is geen https-URL");
  assert.ok(/^\d{4}-\d{2}-\d{2}/.test(leaf.node.as_of), leaf.path + " mist as_of");
  assert.ok(leaf.node.status, leaf.path + " mist status");
});
assert.ok(Array.isArray(data.news) && data.news.length >= 3);
data.news.forEach(function (item) {
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date));
  assert.ok(item.title && item.summary);
  assert.ok(/^https:\/\//.test(item.source));
});
assert.ok(data.last_updated);

assert.equal(params.forfaitTarief, 0.36);
assert.equal(params.exemptionWealth, 59357);
assert.equal(params.exemptionWealthPartner, 118714);
assert.equal(params.rateOther, 0.06);
assert.equal(params.rateBank, 0.0128);
assert.equal(params.rateDebt, 0.027);
assert.equal(params.debtThreshold, 3800);
assert.equal(params.exemptionResult, 1800);
assert.equal(params.lossThreshold, 500);
assert.equal(params.rateLow, 0.355);
assert.equal(params.rateHigh, 0.385);
assert.equal(params.bracketLimit, 60000);

var flat = Box3.simulate(presets.flat15.input, params);
near(flat.totals.huidig.tax, 877.8888, 0.001);
near(flat.totals.nieuw.tax, 4686, 0.001);
assert.equal(euro(flat.totals.huidig.tax), 878);
assert.equal(euro(flat.totals.nieuw.tax), 4686);
assert.equal(euro(flat.rows[0].huidig.end), 114122);
assert.equal(euro(flat.rows[0].nieuw.end), 110314);
near(flat.effective.nieuw, 4686 / 15000, 0.00001);
near(flat.effective.huidig, 877.8888 / 15000, 0.00001);

var checks = [
  [-0.1, 0, 0],
  [0, 0, 0],
  [0.02, 720, 71],
  [0.06, 878, 1491],
  [0.1, 878, 2911],
  [0.15, 878, 4686]
];
checks.forEach(function (row) {
  var sim = Box3.simulate(Box3.oneYearInvest(100000, row[0], false), params);
  assert.equal(euro(sim.totals.huidig.tax), row[1], "huidig bij " + row[0]);
  assert.equal(euro(sim.totals.nieuw.tax), row[2], "nieuw bij " + row[0]);
});

function at(start) {
  return Box3.simulate(Box3.oneYearInvest(start, 0.15, false), params);
}
assert.equal(euro(at(10000).totals.huidig.tax), 0);
assert.equal(euro(at(10000).totals.nieuw.tax), 0);
assert.equal(euro(at(30000).totals.huidig.tax), 0);
assert.equal(euro(at(30000).totals.nieuw.tax), 959);
assert.equal(euro(at(60000).totals.nieuw.tax), 2556);
assert.ok(at(60000).totals.huidig.tax < 14);
assert.ok(at(60000).totals.huidig.tax > 13);
near(at(70000).totals.nieuw.tax - at(70000).totals.huidig.tax, 2858.61, 0.1);
near(at(80000).totals.nieuw.tax - at(80000).totals.huidig.tax, 3175.11, 0.1);
near(at(90000).totals.nieuw.tax - at(90000).totals.huidig.tax, 3491.61, 0.1);
near(at(5000000).totals.nieuw.tax / at(5000000).totals.huidig.tax, 2.68, 0.01);

var gain50 = Box3.simulate(Box3.oneYearInvest(50000, 0.06, false), params);
assert.equal(euro(gain50.totals.huidig.tax), 0);
assert.equal(euro(gain50.totals.nieuw.tax), 426);

function deal(start) {
  var sim = at(start);
  var gain = start * 0.15;
  var taxable = Math.max(0, gain - params.exemptionResult);
  var flat36 = taxable * 0.36;
  return {
    base: flat36 - sim.totals.huidig.tax,
    rate: sim.totals.nieuw.tax - flat36,
    total: sim.totals.nieuw.tax - sim.totals.huidig.tax
  };
}
var d100 = deal(100000);
assert.equal(euro(d100.base), 3874);
assert.equal(euro(d100.rate), -66);
assert.equal(euro(d100.total), 3808);
var d500 = deal(500000);
assert.equal(euro(d500.base), 16834);
assert.equal(euro(d500.rate), 30);
assert.equal(euro(d500.total), 16864);
var d1000 = deal(1000000);
assert.equal(euro(d1000.base), 33034);
assert.equal(euro(d1000.rate), 1905);
assert.equal(euro(d1000.total), 34939);
assert.equal(euro(at(1000000).totals.nieuw.tax), 55257);

var upDown = Box3.simulate(presets.gainThenLoss.input, params);
assert.equal(euro(upDown.rows[0].nieuw.tax), 14575);
assert.equal(euro(upDown.totals.huidig.end), 99385);
assert.equal(euro(upDown.totals.nieuw.end), 89797);
assert.equal(euro(upDown.totals.zonder.end), 100000);
assert.equal(euro(upDown.rows[1].nieuw.lossCarry), 37985);
assert.equal(upDown.rows[1].huidig.huidigUsed, "tegenbewijs");
assert.equal(upDown.rows[0].huidig.huidigUsed, "forfait");

var downUp = Box3.simulate(presets.lossThenGain.input, params);
assert.equal(euro(downUp.totals.huidig.end), 99770);
assert.equal(euro(downUp.totals.nieuw.end), 100000);
assert.equal(downUp.totals.nieuw.tax, 0);
assert.ok(downUp.verliesEffect.taxDifference > 1000);

var held = Box3.simulate(presets.holdRoundTrip.input, params);
assert.equal(euro(held.totals.nieuw.end), 100000);
assert.equal(held.totals.nieuw.tax, 0);
assert.equal(euro(held.totals.huidig.end), 99385);

near(Box3.breakEvenRate(100000, params, false), 0.042729, 0.0002);
near(Box3.breakEvenRate(500000, params, false), 0.057222, 0.0002);
near(Box3.breakEvenRate(50000, params, false), 1800 / 50000, 0.00001);

var mvt = Box3.taxNew(-19090, 0, params, false);
assert.equal(mvt.lossCreated, 18590);
assert.equal(mvt.tax, 0);
var yuri = Box3.taxNew(50980, 25000, params, false);
near(yuri.tax, 24180 * 0.355, 0.001);
assert.equal(yuri.exemptionUsed, 1800);
assert.equal(yuri.lossUsed, 25000);

var spaar = Box3.simulate({
  partner: false,
  years: 1,
  debt: 0,
  debtRate: 0,
  bank: { start: 150000, inleg: 0, rates: [0.0128] },
  invest: { start: 0, inleg: 0, price: [0], dividend: 0, mode: "sell" },
  crypto: { start: 0, inleg: 0, price: [0] }
}, params);
near(spaar.totals.huidig.tax, 417.68, 0.05);
near(spaar.totals.nieuw.tax, (1920 - 1800) * 0.355, 0.001);

var partnerFlat = Box3.simulate(Box3.oneYearInvest(100000, 0.15, true), params);
assert.equal(partnerFlat.totals.huidig.tax, 0);
near(partnerFlat.totals.nieuw.tax, 11400 * 0.355, 0.001);

var crypto = Box3.simulate({
  partner: false,
  years: 2,
  debt: 0,
  debtRate: 0,
  bank: { start: 0, inleg: 0, rates: [0, 0] },
  invest: { start: 0, inleg: 0, price: [0, 0], dividend: 0, mode: "hold" },
  crypto: { start: 100000, inleg: 0, price: [1, -0.5] }
}, params);
near(crypto.rows[0].nieuw.tax, 60000 * 0.355 + 38200 * 0.385, 0.01);
assert.ok(crypto.rows[1].nieuw.lossCarry > 500);
assert.equal(crypto.rows[0].nieuw.tax, crypto.rows[0].nieuw.tax);

console.log("box3-calculator tests: " + leaves.length + " parameters, article examples match");
