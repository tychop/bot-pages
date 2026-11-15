"use strict";

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Box3Model = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function range(from, to, step) {
    var out = [];
    var n = Math.round((to - from) / step);
    for (var i = 0; i <= n; i++) out.push(Math.round((from + i * step) * 10000) / 10000);
    return out;
  }

  var WEALTH = [10000, 25000, 50000, 75000, 100000, 150000, 250000, 500000, 1000000, 2500000];
  var INLEG = [0, 1000, 2500, 5000, 10000, 25000];
  var YEARS = [1, 2, 3, 5, 10, 15, 20, 30];
  var DIVIDEND = [0, 0.01, 0.02, 0.03, 0.04, 0.05];
  var DEBT = [0, 10000, 25000, 50000, 100000, 250000, 500000];
  var DEBT_RATE = [0, 0.02, 0.03, 0.04, 0.05, 0.06];
  var INVEST_RATES = range(-0.3, 0.3, 0.01);
  var CRYPTO_RATES = range(-0.5, 1, 0.1);
  var SAVE_RATES = range(0, 0.05, 0.0025);

  function fill(n, rate) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(rate);
    return out;
  }

  function zeros(n) {
    return fill(n, 0);
  }

  function asNumber(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function pickRate(value, allowed, fallback) {
    var n = asNumber(value, fallback);
    for (var i = 0; i < allowed.length; i++) {
      if (Math.abs(allowed[i] - n) < 1e-9) return allowed[i];
    }
    return fallback;
  }

  function path(scenario, years, base, kind) {
    var loss = kind === "crypto" ? -0.5 : -0.2;
    var crash = kind === "crypto" ? -0.5 : -0.3;
    var rebound = kind === "crypto" ? 0.4 : Math.min(Math.max(base, 0.1), 0.3);
    var i;
    var out = fill(years, base);
    var Box3 = typeof globalThis !== "undefined" && globalThis.Box3 ? globalThis.Box3 : null;
    var recovery = Box3 ? Box3.RECOVERY : 0.3 / 0.7;
    if (scenario === "flat15") return fill(years, 0.15);
    if (scenario === "gainThenLoss" || scenario === "holdRoundTrip") {
      for (i = 0; i < years; i++) out[i] = i % 2 === 0 ? recovery : -0.3;
      return out;
    }
    if (scenario === "lossThenGain") {
      for (i = 0; i < years; i++) out[i] = i % 2 === 0 ? -0.3 : recovery;
      return out;
    }
    if (scenario === "midden") {
      out[Math.floor((years - 1) / 2)] = loss;
      return out;
    }
    if (scenario === "winst-verlies") {
      var cut = Math.max(1, Math.ceil(years / 2));
      for (i = cut; i < years; i++) out[i] = loss;
      return out;
    }
    if (scenario === "verlies-winst") {
      cut = Math.max(1, Math.floor(years / 2));
      for (i = 0; i < cut; i++) out[i] = loss;
      return out;
    }
    if (scenario === "crash") {
      out[0] = crash;
      for (i = 1; i < years; i++) out[i] = rebound;
      return out;
    }
    if (scenario === "stijgend" || scenario === "dalend") {
      for (i = 0; i < years; i++) {
        var t = years === 1 ? 1 : i / (years - 1);
        out[i] = scenario === "stijgend" ? base * t : base * (1 - t);
      }
      return out;
    }
    return out;
  }

  function beleggen(opts) {
    var years = Math.max(1, Math.round(asNumber(opts.years, 10)));
    var scenario = opts.scenario || "gelijk";
    var base = pickRate(opts.rate, INVEST_RATES, 0.07);
    var prices = Array.isArray(opts.prices) ? opts.prices.slice(0, years) : path(scenario, years, base, "invest");
    while (prices.length < years) prices.push(base);
    var mode = scenario === "holdRoundTrip" ? "hold" : (opts.mode === "sell" ? "sell" : "hold");
    return {
      partner: opts.partner === true || opts.partner === "1",
      years: years,
      debt: 0,
      debtRate: 0,
      bank: { start: 0, inleg: 0, rates: zeros(years) },
      invest: {
        start: Math.max(0, asNumber(opts.wealth, 100000)),
        inleg: Math.max(0, asNumber(opts.inleg, 0)),
        price: prices,
        dividend: pickRate(opts.dividend, DIVIDEND, 0),
        mode: mode
      },
      crypto: { start: 0, inleg: 0, price: zeros(years) }
    };
  }

  function sparen(opts) {
    var years = Math.max(1, Math.round(asNumber(opts.years, 10)));
    var scenario = opts.scenario || "gelijk";
    var base = pickRate(opts.rate, SAVE_RATES, 0.02);
    var rates = Array.isArray(opts.rates) ? opts.rates.slice(0, years) : path(scenario, years, base, "save");
    while (rates.length < years) rates.push(base);
    return {
      partner: opts.partner === true || opts.partner === "1",
      years: years,
      debt: 0,
      debtRate: 0,
      bank: {
        start: Math.max(0, asNumber(opts.wealth, 100000)),
        inleg: Math.max(0, asNumber(opts.inleg, 0)),
        rates: rates
      },
      invest: { start: 0, inleg: 0, price: zeros(years), dividend: 0, mode: "hold" },
      crypto: { start: 0, inleg: 0, price: zeros(years) }
    };
  }

  function crypto(opts) {
    var years = Math.max(1, Math.round(asNumber(opts.years, 5)));
    var scenario = opts.scenario || "gelijk";
    var base = pickRate(opts.rate, CRYPTO_RATES, 0.2);
    var prices = Array.isArray(opts.prices) ? opts.prices.slice(0, years) : path(scenario, years, base, "crypto");
    while (prices.length < years) prices.push(base);
    return {
      partner: opts.partner === true || opts.partner === "1",
      years: years,
      debt: 0,
      debtRate: 0,
      bank: { start: 0, inleg: 0, rates: zeros(years) },
      invest: { start: 0, inleg: 0, price: zeros(years), dividend: 0, mode: "hold" },
      crypto: {
        start: Math.max(0, asNumber(opts.wealth, 50000)),
        inleg: Math.max(0, asNumber(opts.inleg, 0)),
        price: prices
      }
    };
  }

  function mix(opts) {
    var years = Math.max(1, Math.round(asNumber(opts.years, 10)));
    var scenario = opts.scenario || "gelijk";
    var total = Math.max(0, asNumber(opts.wealth, 100000));
    var inleg = Math.max(0, asNumber(opts.inleg, 0));
    var bankPct = Math.max(0, asNumber(opts.bankPct, 50)) / 100;
    var investPct = Math.max(0, asNumber(opts.investPct, 50)) / 100;
    var cryptoPct = Math.max(0, asNumber(opts.cryptoPct, 0)) / 100;
    var sum = bankPct + investPct + cryptoPct;
    if (sum <= 0) {
      bankPct = 1;
      investPct = 0;
      cryptoPct = 0;
      sum = 1;
    }
    bankPct /= sum;
    investPct /= sum;
    cryptoPct /= sum;
    var bankBase = pickRate(opts.saveRate, SAVE_RATES, 0.015);
    var investBase = pickRate(opts.investRate, INVEST_RATES, 0.07);
    var cryptoBase = pickRate(opts.cryptoRate, CRYPTO_RATES, 0.1);
    var investPath = Array.isArray(opts.investPrices) ? opts.investPrices.slice(0, years) : path(scenario, years, investBase, "invest");
    var cryptoPath = Array.isArray(opts.cryptoPrices) ? opts.cryptoPrices.slice(0, years) : path(scenario, years, cryptoBase, "crypto");
    while (investPath.length < years) investPath.push(investBase);
    while (cryptoPath.length < years) cryptoPath.push(cryptoBase);
    return {
      partner: opts.partner === true || opts.partner === "1",
      years: years,
      debt: Math.max(0, asNumber(opts.debt, 0)),
      debtRate: pickRate(opts.debtRate, DEBT_RATE, 0.04),
      bank: { start: total * bankPct, inleg: inleg * bankPct, rates: fill(years, bankBase) },
      invest: {
        start: total * investPct,
        inleg: inleg * investPct,
        price: investPath,
        dividend: pickRate(opts.dividend, DIVIDEND, 0),
        mode: opts.mode === "sell" ? "sell" : "hold"
      },
      crypto: { start: total * cryptoPct, inleg: inleg * cryptoPct, price: cryptoPath }
    };
  }

  // Bank-style overview totals for the chosen horizon (shared by all tabs).
  function statementTotals(sim, debt) {
    var d = Math.max(0, debt || 0);
    return {
      start: sim.start,
      afterReturn: sim.totals.zonder.end - d,
      taxHuidig: sim.totals.huidig.tax,
      taxNieuw: sim.totals.nieuw.tax,
      endHuidig: sim.totals.huidig.end - d,
      endNieuw: sim.totals.nieuw.end - d
    };
  }

  function statementDelta(taxHuidig, taxNieuw, formatEuro) {
    var gap = taxNieuw - taxHuidig;
    if (Math.abs(gap) < 1) return "De totale belasting is vrijwel gelijk.";
    if (gap > 0) return "Het voorstel kost " + formatEuro(Math.round(gap)) + " meer belasting.";
    return "Het huidige stelsel kost " + formatEuro(Math.round(-gap)) + " meer belasting.";
  }

  return {
    WEALTH: WEALTH,
    INLEG: INLEG,
    YEARS: YEARS,
    DIVIDEND: DIVIDEND,
    DEBT: DEBT,
    DEBT_RATE: DEBT_RATE,
    INVEST_RATES: INVEST_RATES,
    CRYPTO_RATES: CRYPTO_RATES,
    SAVE_RATES: SAVE_RATES,
    path: path,
    beleggen: beleggen,
    sparen: sparen,
    crypto: crypto,
    mix: mix,
    asNumber: asNumber,
    pickRate: pickRate,
    statementTotals: statementTotals,
    statementDelta: statementDelta
  };
});
