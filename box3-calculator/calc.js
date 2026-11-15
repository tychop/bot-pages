"use strict";

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Box3 = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var RECOVERY = 0.3 / 0.7;

  function req(obj, path) {
    var cur = obj;
    var parts = path.split(".");
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== "object" || !(parts[i] in cur)) {
        throw new Error("data.json mist " + path);
      }
      cur = cur[parts[i]];
    }
    return cur;
  }

  function val(obj, path) {
    var node = req(obj, path);
    if (node == null || typeof node !== "object" || !("value" in node)) {
      throw new Error("data.json-parameter zonder value: " + path);
    }
    return node.value;
  }

  function parseParams(data) {
    var jaar = val(data, "huidig_stelsel.forfaitaire_rendementen.projectie_jaar");
    var jaren = req(data, "huidig_stelsel.forfaitaire_rendementen.jaren");
    var rij = null;
    for (var i = 0; i < jaren.length; i++) {
      if (jaren[i].jaar === jaar) rij = jaren[i];
    }
    if (!rij) throw new Error("Geen forfaitaire percentages voor projectiejaar " + jaar);
    return {
      jaar: jaar,
      forfaitTarief: val(data, "huidig_stelsel.tarief"),
      exemptionWealth: val(data, "huidig_stelsel.heffingsvrij_vermogen"),
      exemptionWealthPartner: val(data, "huidig_stelsel.heffingsvrij_vermogen_partner"),
      debtThreshold: val(data, "huidig_stelsel.schuldendrempel"),
      rateBank: rij.banktegoeden.value,
      rateOther: rij.overige_bezittingen.value,
      rateDebt: rij.schulden.value,
      exemptionResult: val(data, "nieuw_stelsel.heffingvrij_resultaat"),
      exemptionResultPartner: val(data, "nieuw_stelsel.heffingvrij_resultaat_partner_som"),
      lossThreshold: val(data, "nieuw_stelsel.verliesdrempel"),
      oneLossThresholdForPartners: val(data, "nieuw_stelsel.verliesdrempel_eenmaal_bij_toerekening_aan_een_partner"),
      rateLow: val(data, "nieuw_stelsel.tarief_regulier"),
      rateHigh: val(data, "nieuw_stelsel.tarief_top"),
      bracketLimit: val(data, "nieuw_stelsel.schijfgrens"),
      bracketPerPerson: val(data, "nieuw_stelsel.schijf_per_persoon"),
      startYear: val(data, "nieuw_stelsel.ingangsjaar")
    };
  }

  function personsOf(partner) {
    return partner ? 2 : 1;
  }

  function forfait(peildatum, params) {
    var persons = personsOf(peildatum.partner);
    var threshold = params.debtThreshold * persons;
    var deductibleDebt = Math.max(0, (peildatum.debt || 0) - threshold);
    var exemption = peildatum.partner ? params.exemptionWealthPartner : params.exemptionWealth;
    var assets = peildatum.bank + peildatum.invest + peildatum.crypto;
    var assetReturn = peildatum.bank * params.rateBank + (peildatum.invest + peildatum.crypto) * params.rateOther;
    var debtReturn = deductibleDebt * params.rateDebt;
    var belastbaarRendement = assetReturn - debtReturn;
    var rendementsgrondslag = assets - deductibleDebt;
    var grondslag = Math.max(0, rendementsgrondslag - exemption);
    var voordeel = 0;
    if (rendementsgrondslag > 0 && grondslag > 0) {
      voordeel = belastbaarRendement * (grondslag / rendementsgrondslag);
    }
    var tax = Math.max(0, voordeel) * params.forfaitTarief;
    return {
      tax: tax,
      voordeel: voordeel,
      grondslag: grondslag,
      rendementsgrondslag: rendementsgrondslag,
      belastbaarRendement: belastbaarRendement,
      deductibleDebt: deductibleDebt,
      exemption: exemption
    };
  }

  // Belastingdienst published examples: round each forfait component to whole
  // euros, truncate the share to 2 decimals, floor voordeel and tax.
  // Continuous simulations keep exact arithmetic via forfait().
  function forfaitOfficial(peildatum, params) {
    var persons = personsOf(peildatum.partner);
    var threshold = params.debtThreshold * persons;
    var deductibleDebt = Math.max(0, (peildatum.debt || 0) - threshold);
    var exemption = peildatum.partner ? params.exemptionWealthPartner : params.exemptionWealth;
    var assets = (peildatum.bank || 0) + (peildatum.invest || 0) + (peildatum.crypto || 0);
    var bankReturn = Math.round((peildatum.bank || 0) * params.rateBank);
    var otherReturn = Math.round(((peildatum.invest || 0) + (peildatum.crypto || 0)) * params.rateOther);
    var debtReturn = Math.round(deductibleDebt * params.rateDebt);
    var belastbaarRendement = bankReturn + otherReturn - debtReturn;
    var rendementsgrondslag = assets - deductibleDebt;
    var grondslag = Math.max(0, rendementsgrondslag - exemption);
    if (rendementsgrondslag <= 0 || grondslag <= 0) {
      return {
        tax: 0,
        voordeel: 0,
        sharePct: 0,
        grondslag: grondslag,
        rendementsgrondslag: rendementsgrondslag,
        belastbaarRendement: belastbaarRendement,
        deductibleDebt: deductibleDebt,
        exemption: exemption,
        bankReturn: bankReturn,
        otherReturn: otherReturn,
        debtReturn: debtReturn
      };
    }
    var sharePct = Math.floor((grondslag / rendementsgrondslag) * 10000 + 1e-9) / 100;
    var voordeel = Math.floor(belastbaarRendement * sharePct / 100 + 1e-9);
    var tax = Math.floor(Math.max(0, voordeel) * params.forfaitTarief + 1e-9);
    return {
      tax: tax,
      voordeel: voordeel,
      sharePct: sharePct,
      grondslag: grondslag,
      rendementsgrondslag: rendementsgrondslag,
      belastbaarRendement: belastbaarRendement,
      deductibleDebt: deductibleDebt,
      exemption: exemption,
      bankReturn: bankReturn,
      otherReturn: otherReturn,
      debtReturn: debtReturn
    };
  }

  function huidigTax(peildatum, actualReturn, params) {
    var f = forfait(peildatum, params);
    var tegen = Math.max(0, actualReturn) * params.forfaitTarief;
    var tax = Math.min(f.tax, tegen);
    return {
      tax: tax,
      forfaitTax: f.tax,
      tegenbewijsTax: tegen,
      used: tegen < f.tax - 1e-8 ? "tegenbewijs" : "forfait",
      forfait: f
    };
  }

  function taxNew(result, lossCarryIn, params, partner) {
    var persons = personsOf(partner);
    var exemptionCap = partner ? params.exemptionResultPartner : params.exemptionResult;
    var threshold = params.oneLossThresholdForPartners || !partner ? params.lossThreshold : params.lossThreshold * persons;
    var brackets = params.bracketPerPerson ? persons : 1;
    var bracketRoom = params.bracketLimit * brackets;
    var exemptionUsed = 0;
    var inkomen;
    var lossCreated = 0;
    if (result > 0) {
      exemptionUsed = Math.min(exemptionCap, result);
      inkomen = result - exemptionUsed;
    } else {
      inkomen = result;
      if (-inkomen > threshold) lossCreated = -inkomen - threshold;
    }
    var lossUsed = 0;
    var belastbaar = 0;
    var lossCarry = lossCarryIn || 0;
    if (inkomen > 0) {
      lossUsed = Math.min(lossCarry, inkomen);
      belastbaar = inkomen - lossUsed;
      lossCarry -= lossUsed;
    }
    lossCarry += lossCreated;
    var inLow = Math.min(Math.max(0, belastbaar), bracketRoom);
    var inHigh = Math.max(0, belastbaar - bracketRoom);
    var tax = inLow * params.rateLow + inHigh * params.rateHigh;
    return {
      tax: tax,
      belastbaar: belastbaar,
      inkomen: inkomen,
      exemptionUsed: exemptionUsed,
      lossUsed: lossUsed,
      lossCreated: lossCreated,
      lossCarryOut: lossCarry,
      inLow: inLow,
      inHigh: inHigh
    };
  }

  function rateAt(list, index) {
    if (!list || !list.length) return 0;
    if (index < list.length) return list[index];
    return list[list.length - 1];
  }

  function amountAt(value, index) {
    if (Array.isArray(value)) return rateAt(value, index);
    return value || 0;
  }

  function cloneState(state) {
    return {
      bank: state.bank,
      invest: state.invest,
      crypto: state.crypto,
      basis: state.basis,
      lossCarry: state.lossCarry
    };
  }

  function payDown(state, amount) {
    var left = Math.max(0, amount);
    function take(key) {
      var use = Math.min(Math.max(0, state[key]), left);
      state[key] -= use;
      left -= use;
    }
    take("bank");
    take("crypto");
    if (left > 0 && state.invest > 1e-9) {
      var use = Math.min(state.invest, left);
      var ratio = (state.invest - use) / state.invest;
      state.invest -= use;
      state.basis *= ratio;
      left -= use;
    }
    if (left > 1e-6) state.shortfall = (state.shortfall || 0) + left;
    return state;
  }

  function wealth(state) {
    return state.bank + state.invest + state.crypto;
  }

  function grow(state, input, yearIndex) {
    var inv0 = state.invest;
    var basis0 = state.basis;
    var bank0 = state.bank;
    var crypto0 = state.crypto;
    var price = rateAt(input.invest.price, yearIndex);
    var dividendYield = input.invest.dividend || 0;
    var bankRate = rateAt(input.bank.rates, yearIndex);
    var cryptoRate = rateAt(input.crypto.price, yearIndex);
    var bankInterest = bank0 * bankRate;
    var dividend = inv0 * dividendYield;
    var priceGain = inv0 * price;
    var cryptoGain = crypto0 * cryptoRate;
    var debtInterest = (input.debt || 0) * (input.debtRate || 0);
    var bankEnd = bank0 + bankInterest;
    var investEnd = inv0 * (1 + price) + dividend;
    var cryptoEnd = crypto0 * (1 + cryptoRate);
    var actualReturn = bankInterest + dividend + priceGain + cryptoGain - debtInterest;
    var sellAll = input.invest.mode === "sell" || yearIndex === input.years - 1;
    var investResult = sellAll ? investEnd - basis0 : dividend;
    var basisNext = sellAll ? investEnd : basis0 + dividend;
    var result = bankInterest + investResult + cryptoGain - debtInterest;
    return {
      peildatum: {
        bank: bank0,
        invest: inv0,
        crypto: crypto0,
        debt: input.debt || 0,
        partner: !!input.partner
      },
      actualReturn: actualReturn,
      result: result,
      bankEnd: bankEnd,
      investEnd: investEnd,
      cryptoEnd: cryptoEnd,
      basisNext: basisNext,
      debtInterest: debtInterest,
      investResult: investResult,
      sellAll: sellAll,
      parts: {
        bankInterest: bankInterest,
        dividend: dividend,
        priceGain: priceGain,
        cryptoGain: cryptoGain,
        debtInterest: debtInterest
      }
    };
  }

  function applyInleg(state, input, yearIndex) {
    var bankIn = amountAt(input.bank.inleg, yearIndex);
    var invIn = amountAt(input.invest.inleg, yearIndex);
    var cryptoIn = amountAt(input.crypto.inleg, yearIndex);
    state.bank += bankIn;
    state.invest += invIn;
    state.basis += invIn;
    state.crypto += cryptoIn;
    return bankIn + invIn + cryptoIn;
  }

  function stepPath(state, input, params, yearIndex, kind) {
    var opening = wealth(state);
    var inleg = applyInleg(state, input, yearIndex);
    var grown = grow(state, input, yearIndex);
    var f = forfait(grown.peildatum, params);
    var tegenTax = Math.max(0, grown.actualReturn) * params.forfaitTarief;
    var huidigTax = Math.min(f.tax, tegenTax);
    var used = tegenTax < f.tax - 1e-8 ? "tegenbewijs" : "forfait";
    var assessed = null;
    var tax = 0;
    if (kind === "zonder") {
      tax = 0;
    } else if (kind === "forfait") {
      tax = f.tax;
      used = "forfait";
    } else if (kind === "huidig") {
      tax = huidigTax;
    } else {
      var carryIn = kind === "nieuwZonderVerlies" ? 0 : state.lossCarry;
      assessed = taxNew(grown.result, carryIn, params, input.partner);
      if (kind === "nieuwZonderVerlies") {
        assessed.lossCreated = 0;
        assessed.lossCarryOut = 0;
        assessed.lossUsed = 0;
      }
      tax = assessed.tax;
    }
    var next = {
      bank: grown.bankEnd,
      invest: grown.investEnd,
      crypto: grown.cryptoEnd,
      basis: grown.basisNext,
      lossCarry: assessed ? assessed.lossCarryOut : 0,
      shortfall: 0
    };
    payDown(next, grown.debtInterest);
    payDown(next, tax);
    if (grown.sellAll) next.basis = next.invest;
    return {
      year: yearIndex + 1,
      opening: opening,
      inleg: inleg,
      peildatum: grown.peildatum.bank + grown.peildatum.invest + grown.peildatum.crypto,
      actualReturn: grown.actualReturn,
      result: grown.result,
      forfaitTax: f.tax,
      forfaitVoordeel: f.voordeel,
      tegenbewijsTax: tegenTax,
      huidigTax: huidigTax,
      huidigUsed: used,
      exemptionUsed: assessed ? assessed.exemptionUsed : 0,
      lossUsed: assessed ? assessed.lossUsed : 0,
      lossCreated: assessed ? assessed.lossCreated : 0,
      lossCarry: next.lossCarry,
      belastbaar: assessed ? assessed.belastbaar : 0,
      inHigh: assessed ? assessed.inHigh : 0,
      tax: tax,
      end: wealth(next),
      shortfall: next.shortfall || 0,
      parts: grown.parts,
      debt: input.debt || 0,
      state: next
    };
  }

  function emptyTotals() {
    return { tax: 0, actual: 0, end: 0, lossCarry: 0, shortfall: 0 };
  }

  function simulate(input, params) {
    var kinds = ["zonder", "forfait", "huidig", "nieuw", "nieuwZonderVerlies"];
    var states = {};
    kinds.forEach(function (kind) {
      states[kind] = {
        bank: input.bank.start || 0,
        invest: input.invest.start || 0,
        crypto: input.crypto.start || 0,
        basis: input.invest.start || 0,
        lossCarry: 0
      };
    });
    var rows = [];
    var totals = {
      zonder: emptyTotals(),
      forfait: emptyTotals(),
      huidig: emptyTotals(),
      nieuw: emptyTotals(),
      nieuwZonderVerlies: emptyTotals()
    };
    var years = input.years;
    for (var y = 0; y < years; y++) {
      var row = { year: y + 1 };
      kinds.forEach(function (kind) {
        var stepped = stepPath(states[kind], input, params, y, kind);
        states[kind] = stepped.state;
        row[kind] = stepped;
        totals[kind].tax += stepped.tax;
        totals[kind].actual += stepped.actualReturn;
        totals[kind].end = stepped.end;
        totals[kind].lossCarry = stepped.lossCarry;
        totals[kind].shortfall += stepped.shortfall;
      });
      rows.push(row);
    }
    function effective(bucket) {
      if (bucket.actual > 1e-6) return bucket.tax / bucket.actual;
      return null;
    }
    return {
      rows: rows,
      totals: totals,
      effective: {
        huidig: effective(totals.huidig),
        nieuw: effective(totals.nieuw)
      },
      verliesEffect: {
        taxDifference: totals.nieuwZonderVerlies.tax - totals.nieuw.tax,
        endDifference: totals.nieuw.end - totals.nieuwZonderVerlies.end
      },
      debt: input.debt || 0,
      start: (input.bank.start || 0) + (input.invest.start || 0) + (input.crypto.start || 0)
    };
  }

  function oneYearInvest(start, rate, partner) {
    return {
      partner: !!partner,
      years: 1,
      debt: 0,
      debtRate: 0,
      bank: { start: 0, inleg: 0, rates: [0] },
      invest: { start: start, inleg: 0, price: [rate], dividend: 0, mode: "sell" },
      crypto: { start: 0, inleg: 0, price: [0] }
    };
  }

  function flatList(years, rate) {
    var out = [];
    for (var i = 0; i < years; i++) out.push(rate);
    return out;
  }

  // Flat "gelijkmatig" path at `rate`, inleg forced to 0. Keeps mode, dividend, debt, partner.
  function withFlatRate(input, rate) {
    var years = Math.max(1, input.years | 0);
    var flat = flatList(years, rate);
    var zero = flatList(years, 0);
    var bankStart = input.bank && input.bank.start ? input.bank.start : 0;
    var investStart = input.invest && input.invest.start ? input.invest.start : 0;
    var cryptoStart = input.crypto && input.crypto.start ? input.crypto.start : 0;
    return {
      partner: !!input.partner,
      years: years,
      debt: input.debt || 0,
      debtRate: input.debtRate || 0,
      bank: { start: bankStart, inleg: 0, rates: bankStart > 0 ? flat : zero },
      invest: {
        start: investStart,
        inleg: 0,
        price: investStart > 0 ? flat : zero,
        dividend: (input.invest && input.invest.dividend) || 0,
        mode: (input.invest && input.invest.mode) || "hold"
      },
      crypto: { start: cryptoStart, inleg: 0, price: cryptoStart > 0 ? flat : zero }
    };
  }

  function endWealth(sim, kind, debt) {
    return sim.totals[kind].end - (debt || 0);
  }

  // Annual rate so end wealth after tax equals start wealth (net of debt).
  // kind: "forfait" | "huidig" | "nieuw"
  function breakEvenRateFor(input, params, kind) {
    var base = withFlatRate(input, 0);
    var start = (base.bank.start || 0) + (base.invest.start || 0) + (base.crypto.start || 0);
    var debt = base.debt || 0;
    var target = start - debt;
    if (start <= 0) return null;

    function endAt(rate) {
      return endWealth(simulate(withFlatRate(base, rate), params), kind, debt);
    }

    var atZero = endAt(0);
    if (Math.abs(atZero - target) <= 1) return 0;

    var lo;
    var hi;
    var i;
    if (atZero > target) {
      // Need a lower (possibly negative) rate to shrink end wealth to start.
      hi = 0;
      lo = -0.99;
      if (endAt(lo) > target) return lo;
    } else {
      lo = 0;
      hi = 0.05;
      for (i = 0; i < 20 && endAt(hi) < target; i++) hi *= 2;
      if (endAt(hi) < target) return null;
    }
    for (i = 0; i < 56; i++) {
      var mid = (lo + hi) / 2;
      if (endAt(mid) >= target) hi = mid;
      else lo = mid;
    }
    return (lo + hi) / 2;
  }

  function breakEvenRates(input, params) {
    return {
      forfait: breakEvenRateFor(input, params, "forfait"),
      huidig: breakEvenRateFor(input, params, "huidig"),
      nieuw: breakEvenRateFor(input, params, "nieuw")
    };
  }

  // Cross-over rate where voorstel tax exceeds huidig tax (one-year invest helper).
  function breakEvenRate(start, params, partner) {
    var atZero = simulate(oneYearInvest(start, 0, partner), params);
    if (atZero.rows[0].huidig.forfaitTax <= 1e-8) {
      var exemption = partner ? params.exemptionResultPartner : params.exemptionResult;
      if (start <= 0) return null;
      return exemption / start;
    }
    var lo = 0;
    var hi = 1;
    for (var i = 0; i < 48; i++) {
      var mid = (lo + hi) / 2;
      var sim = simulate(oneYearInvest(start, mid, partner), params);
      if (sim.totals.nieuw.tax > sim.totals.huidig.tax) hi = mid;
      else lo = mid;
    }
    return (lo + hi) / 2;
  }

  function articlePresets() {
    return {
      flat15: {
        id: "flat15",
        label: "Artikelvoorbeeld: € 100.000 en 15% gerealiseerd",
        input: oneYearInvest(100000, 0.15, false)
      },
      gainThenLoss: {
        id: "gainThenLoss",
        label: "Artikelvoorbeeld: eerst +42,9%, daarna −30%",
        input: {
          partner: false,
          years: 2,
          debt: 0,
          debtRate: 0,
          bank: { start: 0, inleg: 0, rates: [0, 0] },
          invest: { start: 100000, inleg: 0, price: [RECOVERY, -0.3], dividend: 0, mode: "sell" },
          crypto: { start: 0, inleg: 0, price: [0, 0] }
        }
      },
      lossThenGain: {
        id: "lossThenGain",
        label: "Artikelvoorbeeld: eerst −30%, daarna +42,9%",
        input: {
          partner: false,
          years: 2,
          debt: 0,
          debtRate: 0,
          bank: { start: 0, inleg: 0, rates: [0, 0] },
          invest: { start: 100000, inleg: 0, price: [-0.3, RECOVERY], dividend: 0, mode: "sell" },
          crypto: { start: 0, inleg: 0, price: [0, 0] }
        }
      },
      holdRoundTrip: {
        id: "holdRoundTrip",
        label: "Zelfde koersen, aanhouden tot het einde",
        input: {
          partner: false,
          years: 2,
          debt: 0,
          debtRate: 0,
          bank: { start: 0, inleg: 0, rates: [0, 0] },
          invest: { start: 100000, inleg: 0, price: [RECOVERY, -0.3], dividend: 0, mode: "hold" },
          crypto: { start: 0, inleg: 0, price: [0, 0] }
        }
      }
    };
  }

  return {
    RECOVERY: RECOVERY,
    parseParams: parseParams,
    forfait: forfait,
    forfaitOfficial: forfaitOfficial,
    huidigTax: huidigTax,
    taxNew: taxNew,
    simulate: simulate,
    oneYearInvest: oneYearInvest,
    withFlatRate: withFlatRate,
    breakEvenRateFor: breakEvenRateFor,
    breakEvenRates: breakEvenRates,
    breakEvenRate: breakEvenRate,
    articlePresets: articlePresets
  };
});
