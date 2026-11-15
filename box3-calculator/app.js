"use strict";

(function () {
  var euro0 = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var euro2 = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function formatFraction(value) {
    var pctValue = value * 100;
    var digits = 2;
    if (Math.abs(pctValue - Math.round(pctValue)) < 1e-8) digits = 0;
    else if (Math.abs(pctValue * 10 - Math.round(pctValue * 10)) < 1e-6) digits = 1;
    return new Intl.NumberFormat("nl-NL", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(pctValue) + "%";
  }
  var data;
  var params;

  function money(n) {
    if (!isFinite(n)) return "–";
    if (n === 0) return euro0.format(0);
    return Math.abs(n) < 100 ? euro2.format(n) : euro0.format(Math.round(n));
  }

  function parseEuro(raw) {
    var s = String(raw == null ? "" : raw).trim().replace(/\s/g, "").replace(/€/g, "");
    if (!s || s === "-" || s === "," || s === ".") return 0;
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    var n = Number(s);
    return isFinite(n) ? n : 0;
  }

  function parsePct(raw) {
    var s = String(raw == null ? "" : raw).trim().replace("%", "").replace(/\s/g, "").replace(",", ".");
    if (!s || s === "-" || s === ".") return 0;
    var n = Number(s);
    return isFinite(n) ? n / 100 : 0;
  }

  function formatPct(fraction) {
    var s = (fraction * 100).toFixed(6).replace(/\.?0+$/, "");
    if (s === "-0") s = "0";
    return s.replace(".", ",");
  }

  function clampYears(raw) {
    var n = Math.round(Number(String(raw).replace(",", ".")));
    if (!isFinite(n)) n = 1;
    return Math.max(1, Math.min(40, n));
  }

  function zeros(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(0);
    return out;
  }

  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    if (!m) return iso || "";
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
    }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
  }

  function formatValue(node) {
    if (node.unit === "fraction") return formatFraction(node.value);
    if (node.unit === "eur") return euro0.format(node.value);
    if (node.unit === "year") return String(node.value);
    if (typeof node.value === "boolean") return node.value ? "ja" : "nee";
    return String(node.value);
  }

  function statusClass(status) {
    if (status === "voorstel / nog niet definitief") return "is-proposal";
    if (status === "voorlopig") return "is-provisional";
    return "";
  }

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    (kids || []).forEach(function (kid) {
      if (kid == null) return;
      node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    });
    return node;
  }

  function readPctInput(input) {
    if (input.dataset.exact) return { value: Number(input.dataset.exact), exact: input.dataset.exact };
    return { value: parsePct(input.value), exact: "" };
  }

  function yearInput(value, exact, label) {
    var input = el("input", { type: "text", inputmode: "decimal", class: "year", autocomplete: "off" });
    input.value = formatPct(value);
    if (exact) input.dataset.exact = exact;
    input.addEventListener("input", function () { delete input.dataset.exact; });
    input.setAttribute("aria-label", label);
    return input;
  }

  function buildSimpleYears(list, count, values, exacts) {
    var keep = [];
    list.querySelectorAll("input.year").forEach(function (input) { keep.push(readPctInput(input)); });
    list.replaceChildren();
    for (var i = 0; i < count; i++) {
      var item = values ? { value: values[i], exact: exacts ? exacts[i] : "" } : (keep[i] || { value: 0, exact: "" });
      var input = yearInput(item.value, item.exact, "Rendement jaar " + (i + 1) + " in procenten");
      list.append(el("div", { class: "year-row" }, [
        el("span", { class: "yr", text: "Jaar " + (i + 1) + " (%)" }),
        input
      ]));
    }
  }

  function buildMixYears(count, seed) {
    var list = document.getElementById("m-year-list");
    var keep = [];
    list.querySelectorAll(".year-row.mix").forEach(function (row) {
      var inputs = row.querySelectorAll("input");
      if (inputs.length < 3) return;
      keep.push([readPctInput(inputs[0]), readPctInput(inputs[1]), readPctInput(inputs[2])]);
    });
    list.replaceChildren();
    var head = el("div", { class: "year-head" }, [
      el("span", { text: "" }),
      el("span", { text: "Rente sparen %" }),
      el("span", { text: "Koers beleggen %" }),
      el("span", { text: "Koers crypto %" })
    ]);
    list.append(head);
    var fallback = [
      { value: 0.015, exact: "" },
      { value: 0.06, exact: "" },
      { value: 0.1, exact: "" }
    ];
    for (var i = 0; i < count; i++) {
      var triple = seed ? seed[i] : (keep[i] || fallback);
      list.append(el("div", { class: "year-row mix" }, [
        el("span", { class: "yr", text: "Jaar " + (i + 1) }),
        yearInput(triple[0].value, triple[0].exact, "Rente jaar " + (i + 1)),
        yearInput(triple[1].value, triple[1].exact, "Koers beleggen jaar " + (i + 1)),
        yearInput(triple[2].value, triple[2].exact, "Koers crypto jaar " + (i + 1))
      ]));
    }
  }

  function readSimple(list) {
    var out = [];
    list.querySelectorAll("input.year").forEach(function (input) { out.push(readPctInput(input).value); });
    return out;
  }

  function readBeleggen() {
    var years = clampYears(document.getElementById("b-years").value);
    return {
      partner: document.getElementById("b-partner").checked,
      years: years,
      debt: 0,
      debtRate: 0,
      bank: { start: 0, inleg: 0, rates: zeros(years) },
      invest: {
        start: Math.max(0, parseEuro(document.getElementById("b-start").value)),
        inleg: parseEuro(document.getElementById("b-inleg").value),
        price: readSimple(document.getElementById("b-year-list")),
        dividend: Math.max(0, parsePct(document.getElementById("b-div").value)),
        mode: document.getElementById("b-mode").value
      },
      crypto: { start: 0, inleg: 0, price: zeros(years) }
    };
  }

  function readSparen() {
    var years = clampYears(document.getElementById("s-years").value);
    return {
      partner: document.getElementById("s-partner").checked,
      years: years,
      debt: 0,
      debtRate: 0,
      bank: {
        start: Math.max(0, parseEuro(document.getElementById("s-start").value)),
        inleg: parseEuro(document.getElementById("s-inleg").value),
        rates: readSimple(document.getElementById("s-year-list"))
      },
      invest: { start: 0, inleg: 0, price: zeros(years), dividend: 0, mode: "hold" },
      crypto: { start: 0, inleg: 0, price: zeros(years) }
    };
  }

  function readCrypto() {
    var years = clampYears(document.getElementById("c-years").value);
    return {
      partner: document.getElementById("c-partner").checked,
      years: years,
      debt: 0,
      debtRate: 0,
      bank: { start: 0, inleg: 0, rates: zeros(years) },
      invest: { start: 0, inleg: 0, price: zeros(years), dividend: 0, mode: "hold" },
      crypto: {
        start: Math.max(0, parseEuro(document.getElementById("c-start").value)),
        inleg: parseEuro(document.getElementById("c-inleg").value),
        price: readSimple(document.getElementById("c-year-list"))
      }
    };
  }

  function allocShares() {
    var bank = Number(document.getElementById("m-bank").value);
    var invest = Number(document.getElementById("m-invest").value);
    var crypto = Number(document.getElementById("m-crypto").value);
    var sum = bank + invest + crypto;
    if (sum <= 0) return { bank: 0, invest: 0, crypto: 0 };
    return { bank: bank / sum, invest: invest / sum, crypto: crypto / sum };
  }

  function readMix() {
    var years = clampYears(document.getElementById("m-years").value);
    var total = Math.max(0, parseEuro(document.getElementById("m-total").value));
    var inleg = parseEuro(document.getElementById("m-inleg").value);
    var share = allocShares();
    var rates = [];
    document.getElementById("m-year-list").querySelectorAll(".year-row.mix").forEach(function (row) {
      if (!row.querySelector("input")) return;
      var inputs = row.querySelectorAll("input");
      rates.push({
        bank: readPctInput(inputs[0]).value,
        invest: readPctInput(inputs[1]).value,
        crypto: readPctInput(inputs[2]).value
      });
    });
    return {
      partner: document.getElementById("m-partner").checked,
      years: years,
      debt: Math.max(0, parseEuro(document.getElementById("m-debt").value)),
      debtRate: Math.max(0, parsePct(document.getElementById("m-debt-rate").value)),
      bank: { start: total * share.bank, inleg: inleg * share.bank, rates: rates.map(function (r) { return r.bank; }) },
      invest: {
        start: total * share.invest,
        inleg: inleg * share.invest,
        price: rates.map(function (r) { return r.invest; }),
        dividend: Math.max(0, parsePct(document.getElementById("m-div").value)),
        mode: document.getElementById("m-mode").value
      },
      crypto: {
        start: total * share.crypto,
        inleg: inleg * share.crypto,
        price: rates.map(function (r) { return r.crypto; })
      }
    };
  }

  function activeTab() {
    var tab = document.querySelector('[role="tab"][aria-selected="true"]');
    return tab ? tab.id : "tab-beleggen";
  }

  function currentInput() {
    var id = activeTab();
    if (id === "tab-sparen") return readSparen();
    if (id === "tab-crypto") return readCrypto();
    if (id === "tab-mix") return readMix();
    return readBeleggen();
  }

  function darkMode() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function chart(series) {
    var w = 680, h = 280, left = 72, right = 12, top = 16, bottom = 32;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("role", "img");
    var max = -Infinity, min = Infinity, n = series[0].points.length;
    series.forEach(function (s) {
      s.points.forEach(function (v) {
        if (v > max) max = v;
        if (v < min) min = v;
      });
    });
    if (!isFinite(max) || max === min) { max = (max || 0) + 1; min = (min || 0) - 1; }
    var pad = (max - min) * 0.08;
    max += pad; min -= pad;
    function x(i) { return left + (w - left - right) * (n <= 1 ? 0 : i / (n - 1)); }
    function y(v) { return top + (h - top - bottom) * (1 - (v - min) / (max - min)); }
    var ink = darkMode() ? "#d6d3d1" : "#57534e";
    var grid = darkMode() ? "#31362e" : "#e4ddd2";
    for (var g = 0; g < 4; g++) {
      var value = min + (max - min) * g / 3;
      var yy = y(value);
      var line = document.createElementNS(svg.namespaceURI, "line");
      line.setAttribute("x1", left); line.setAttribute("x2", w - right);
      line.setAttribute("y1", yy); line.setAttribute("y2", yy);
      line.setAttribute("stroke", grid);
      svg.appendChild(line);
      var label = document.createElementNS(svg.namespaceURI, "text");
      label.setAttribute("x", left - 8); label.setAttribute("y", yy + 4);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", ink);
      label.setAttribute("font-size", "12");
      label.textContent = euro0.format(Math.round(value));
      svg.appendChild(label);
    }
    series.forEach(function (s) {
      var d = s.points.map(function (v, i) { return (i ? "L" : "M") + x(i) + " " + y(v); }).join(" ");
      var path = document.createElementNS(svg.namespaceURI, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", s.color);
      path.setAttribute("stroke-width", "2.5");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("stroke-linecap", "round");
      svg.appendChild(path);
    });
    var names = series.map(function (s) { return s.name + " eindigt op " + euro0.format(Math.round(s.points[s.points.length - 1])); });
    svg.setAttribute("aria-label", "Vermogen per jaar. " + names.join(". "));
    return svg;
  }

  function stat(cls, kicker, value) {
    return el("div", { class: "stat " + cls }, [
      el("div", { class: "k", text: kicker }),
      el("b", { text: value })
    ]);
  }

  function rateText(rate) {
    if (rate == null) return "n.v.t.";
    return formatFraction(rate);
  }

  function renderResults() {
    var input = currentInput();
    var sim = Box3.simulate(input, params);
    var box = document.getElementById("results");
    box.replaceChildren();
    var dark = darkMode();
    var colors = {
      zonder: dark ? "#d6d3d1" : "#57534e",
      huidig: dark ? "#8fd9d1" : "#0b6e66",
      nieuw: dark ? "#fdba74" : "#9a3412"
    };
    var points = { zonder: [sim.start], huidig: [sim.start], nieuw: [sim.start] };
    sim.rows.forEach(function (row) {
      points.zonder.push(row.zonder.end);
      points.huidig.push(row.huidig.end);
      points.nieuw.push(row.nieuw.end);
    });
    box.append(el("h3", { text: "Uitkomst" }));
    var diff = sim.totals.huidig.end - sim.totals.nieuw.end;
    var sentence = "Na " + input.years + (input.years === 1 ? " jaar" : " jaar") +
      " blijft onder het voorstel " + money(sim.totals.nieuw.end) +
      " over en onder het huidige stelsel met tegenbewijs " + money(sim.totals.huidig.end) +
      ". Zonder box 3 zou het vermogen " + money(sim.totals.zonder.end) + " zijn.";
    if (Math.abs(diff) >= 1) {
      sentence += sim.totals.nieuw.end < sim.totals.huidig.end
        ? " Het voorstel laat " + money(diff) + " minder over."
        : " Het voorstel laat " + money(-diff) + " meer over.";
    }
    box.append(el("p", { text: sentence }));
    if (input.debt > 0) {
      box.append(el("p", { class: "small muted", text: "De schuld van " + money(input.debt) + " staat nog open. Het eindvermogen hierboven is het bezit na belasting, zonder die schuld ervan af te trekken. Netto bezit min schuld: huidig " + money(sim.totals.huidig.end - input.debt) + ", voorstel " + money(sim.totals.nieuw.end - input.debt) + "." }));
    }
    box.append(el("div", { class: "stats" }, [
      stat("old", "Belasting huidig, som", money(sim.totals.huidig.tax)),
      stat("new", "Belasting voorstel, som", money(sim.totals.nieuw.tax)),
      stat("old", "Eindvermogen huidig", money(sim.totals.huidig.end)),
      stat("new", "Eindvermogen voorstel", money(sim.totals.nieuw.end)),
      stat("old", "Effectief op het werkelijke rendement, huidig", rateText(sim.effective.huidig)),
      stat("new", "Effectief op het werkelijke rendement, voorstel", rateText(sim.effective.nieuw)),
      stat("", "Heffingsvrij vermogen dit voorbeeld", input.partner ? euro0.format(params.exemptionWealthPartner) : euro0.format(params.exemptionWealth)),
      stat("", "Heffingsvrij resultaat per jaar", input.partner ? euro0.format(params.exemptionResultPartner) : euro0.format(params.exemptionResult))
    ]));
    if (sim.effective.huidig == null || sim.effective.nieuw == null) {
      box.append(el("p", { class: "small", text: "Het effectieve tarief is de som van de belasting gedeeld door de som van het werkelijke rendement in diezelfde variant. Is dat rendement niet positief, dan staat hier n.v.t. De belasting zelf kan dan nog steeds boven nul liggen, bijvoorbeeld omdat een eerder winstjaar al is belast." }));
    } else if (sim.effective.huidig > 1 || sim.effective.nieuw > 1) {
      box.append(el("p", { class: "small", text: "Een effectief tarief boven 100% betekent dat de belasting groter is dan het rendement dat over deze jaren bij elkaar optelt. Dat gebeurt als over een winstjaar wordt geheven en een later verlies die aanslag niet terugdraait." }));
    }
    var high = sim.rows.reduce(function (sum, row) { return sum + row.nieuw.inHigh; }, 0);
    if (high > 1) {
      box.append(el("p", { text: "Van het belastbare resultaat valt in totaal " + money(high) + " in de schijf van 38,5%. Die grens gaat over het resultaat in één jaar, niet over de omvang van het vermogen. Een verkoop die meerdere jaren bundelt, kan die grens halen zonder dat het vermogen een miljoen is." }));
    }
    var lossLeft = sim.totals.nieuw.lossCarry;
    var lossTax = sim.verliesEffect.taxDifference;
    var lossBits = "Verliesverrekening: ";
    if (lossTax > 1) {
      lossBits += "zonder voorwaartse verrekening zou de belasting " + money(lossTax) + " hoger zijn en het eindvermogen " + money(sim.verliesEffect.endDifference) + " lager.";
    } else if (lossLeft > 1) {
      lossBits += "binnen deze jaren verlaagt de verliesvoorraad de belasting niet.";
    } else {
      lossBits += "er ontstaat geen verrekenbaar verlies boven de drempel van " + euro0.format(params.lossThreshold) + ".";
    }
    if (lossLeft > 1) {
      lossBits += " Aan het eind staat " + money(lossLeft) + " open. Dat is geen teruggave en geen geld op de rekening. Het kan alleen een later positief resultaat verlagen, ná het heffingsvrije resultaat. Met een eerder winstjaar wordt het niet verrekend.";
    }
    box.append(el("div", { class: "callout", text: lossBits }));
    if (activeTab() === "tab-crypto" || (activeTab() === "tab-mix" && input.crypto.start > 0)) {
      box.append(el("div", { class: "note", text: "Bij directe crypto is de koersstijging in het voorstel belast in het jaar zelf, ook zonder verkoop. Het model betaalt die belasting uit het vermogen. Is er geen ander geld, dan moet er worden verkocht om de aanslag te voldoen. Een latere koersdaling haalt de al betaalde belasting niet terug." }));
    }
    if (activeTab() === "tab-beleggen" && input.invest.mode === "sell") {
      box.append(el("p", { class: "small", text: "Deze variant realiseert de koerswinst elk jaar. Wie dezelfde stukken aanhoudt, betaalt over die koerswinst pas bij verkoop. Dividend telt in beide gevallen jaarlijks." }));
    }
    if (activeTab() === "tab-beleggen" && input.invest.mode === "hold") {
      box.append(el("p", { class: "small", text: "In deze variant valt de koerswinst in het laatste jaar, alsof dan alles wordt verkocht. De grafiek en het eindvermogen zijn het vermogen ná die verkoop. Een eerdere verkoop zou de winst naar voren halen en kan een groter deel in de schijf van 38,5% trekken." }));
    }
    var shortfall = sim.totals.huidig.shortfall + sim.totals.nieuw.shortfall;
    if (shortfall > 1) {
      box.append(el("div", { class: "callout", text: "De berekende belasting of rente is in een jaar hoger dan het bezit. Het model zet het vermogen dan op nul. In werkelijkheid moet het tekort uit ander geld worden betaald." }));
    }

    box.append(el("div", { class: "legend" }, [
      el("span", {}, [el("i", { class: "swatch", style: "background:" + colors.zonder }), "Zonder box 3"]),
      el("span", {}, [el("i", { class: "swatch", style: "background:" + colors.huidig }), "Huidig, met tegenbewijs"]),
      el("span", {}, [el("i", { class: "swatch", style: "background:" + colors.nieuw }), "Voorstel"])
    ]));
    var chartBox = el("div", { class: "chart-wrap" });
    chartBox.append(chart([
      { name: "Zonder box 3", color: colors.zonder, points: points.zonder },
      { name: "Huidig", color: colors.huidig, points: points.huidig },
      { name: "Voorstel", color: colors.nieuw, points: points.nieuw }
    ]));
    box.append(chartBox);

    var table = el("table");
    table.append(el("caption", { text: "Jaar voor jaar. Peildatum is 1 januari na de inleg. Het werkelijke rendement is de euro-opbrengst van dat jaar in die variant, vóór de belasting van dat jaar." }));
    var head = el("tr");
    ["Jaar", "Peildatum huidig", "Rendement huidig", "Belasting huidig", "Eind huidig", "Peildatum voorstel", "Rendement voorstel", "Belasting voorstel", "Eind voorstel", "Verliesvoorraad"].forEach(function (name) {
      head.append(el("th", { scope: "col", text: name }));
    });
    table.append(el("thead", {}, [head]));
    var body = el("tbody");
    sim.rows.forEach(function (row) {
      var tr = el("tr");
      [
        String(row.year),
        money(row.huidig.peildatum),
        money(row.huidig.actualReturn),
        money(row.huidig.tax) + (row.huidig.huidigUsed === "tegenbewijs" ? " *" : ""),
        money(row.huidig.end),
        money(row.nieuw.peildatum),
        money(row.nieuw.actualReturn),
        money(row.nieuw.tax),
        money(row.nieuw.end),
        money(row.nieuw.lossCarry)
      ].forEach(function (cell, index) {
        tr.append(el(index === 0 ? "th" : "td", index === 0 ? { scope: "row", text: cell } : { text: cell }));
      });
      body.append(tr);
    });
    var totalRow = el("tr");
    ["Som", "", money(sim.totals.huidig.actual), money(sim.totals.huidig.tax), money(sim.totals.huidig.end), "", money(sim.totals.nieuw.actual), money(sim.totals.nieuw.tax), money(sim.totals.nieuw.end), money(sim.totals.nieuw.lossCarry)].forEach(function (cell, index) {
      totalRow.append(el(index === 0 ? "th" : "td", index === 0 ? { scope: "row", text: cell } : { text: cell }));
    });
    body.append(totalRow);
    table.append(body);
    var wrap = el("div", { class: "table-wrap" });
    wrap.append(table);
    box.append(wrap);
    var usedTegen = sim.rows.some(function (row) { return row.huidig.huidigUsed === "tegenbewijs"; });
    box.append(el("p", { class: "small muted", text: (usedTegen ? "* Bij dit bedrag is het tegenbewijs lager dan het forfait. De getoonde huidige belasting is dat lagere bedrag. " : "") + "Bedragen onder € 100 tonen centen; daarboven hele euro's." }));

    if (activeTab() === "tab-beleggen") {
      box.append(sensitivity(input));
    }
  }

  function sensitivity(input) {
    var block = el("div");
    block.append(el("h3", { text: "Eén jaar, volledig gerealiseerde koerswinst" }));
    block.append(el("p", { class: "small", text: "Zelfde startvermogen en dezelfde partnerkeuze, zonder dividend en zonder inleg. Dit is de tabelvorm van het rekenvoorbeeld: het huidige bedrag is het laagste van forfait en tegenbewijs." }));
    var rates = [-0.1, 0, 0.02, 0.06, 0.1, 0.15];
    var table = el("table");
    var hr = el("tr");
    ["Koersresultaat", "Huidig", "Voorstel"].forEach(function (name) { hr.append(el("th", { scope: "col", text: name })); });
    table.append(el("thead", {}, [hr]));
    var tb = el("tbody");
    rates.forEach(function (rate) {
      var sim = Box3.simulate(Box3.oneYearInvest(input.invest.start, rate, input.partner), params);
      var tr = el("tr");
      [formatPct(rate) + "%", money(sim.totals.huidig.tax), money(sim.totals.nieuw.tax)].forEach(function (cell, index) {
        tr.append(el(index === 0 ? "th" : "td", index === 0 ? { scope: "row", text: cell } : { text: cell }));
      });
      tb.append(tr);
    });
    table.append(tb);
    var wrap = el("div", { class: "table-wrap" });
    wrap.append(table);
    block.append(wrap);
    var be = Box3.breakEvenRate(input.invest.start, params, input.partner);
    var probe = Box3.simulate(Box3.oneYearInvest(input.invest.start, 0, input.partner), params);
    var text;
    if (input.invest.start <= 0 || be == null) {
      text = "Er is geen omslagpunt binnen deze vergelijking.";
    } else if (probe.rows[0].huidig.forfaitTax <= 1e-6) {
      text = "Dit startvermogen valt onder het heffingsvrij vermogen. De forfaitaire belasting is € 0, ook bij een hoge koerswinst, want tegenbewijs mag de aanslag niet verhogen. In het voorstel ontstaat belasting zodra het resultaat boven de vrijstelling uitkomt, vanaf ongeveer " + formatPct(be) + "% koersstijging.";
    } else {
      text = "Het omslagpunt ligt rond " + formatPct(be) + "% gerealiseerde koerswinst. Daarboven is het voorstel in dit ene jaar duurder dan het huidige stelsel met tegenbewijs. Daaronder kan de vrijstelling van " + euro0.format(input.partner ? params.exemptionResultPartner : params.exemptionResult) + " het voorstel goedkoper maken. Bij een laag rendement wint het tegenbewijs het bovendien van het forfait.";
    }
    block.append(el("p", { text: text }));
    return block;
  }

  function renderCheck() {
    var root = document.getElementById("check");
    root.replaceChildren();
    root.append(el("h2", { id: "check-title", text: "Controle op het rekenvoorbeeld" }));
    root.append(el("p", { text: "Deze bedragen hangen niet af van de invoer hierboven. Zij gebruiken de parameters uit het databestand en de uitgangspunten van het rekenvoorbeeld met € 100.000: één persoon, geen dividend, geen inleg, belasting aan het eind van het jaar uit de portefeuille. De koers +42,9% is precies 30/70, zodat −30% daarna zonder belasting terugkomt op € 100.000." }));
    var presets = Box3.articlePresets();
    var rows = [
      ["€ 100.000, 15% gerealiseerd, belasting", presets.flat15.input, "tax"],
      ["Eerst +42,9%, dan −30%, eindvermogen", presets.gainThenLoss.input, "end"],
      ["Eerst −30%, dan +42,9%, eindvermogen", presets.lossThenGain.input, "end"],
      ["Zelfde koersen, aanhouden en pas op het eind verkopen", presets.holdRoundTrip.input, "end"]
    ];
    var table = el("table");
    var hr = el("tr");
    ["Uitgangspunt", "Zonder box 3", "Huidig met tegenbewijs", "Voorstel"].forEach(function (name) {
      hr.append(el("th", { scope: "col", text: name }));
    });
    table.append(el("thead", {}, [hr]));
    var tb = el("tbody");
    rows.forEach(function (spec) {
      var sim = Box3.simulate(spec[1], params);
      var pick = spec[2];
      var tr = el("tr");
      [spec[0], money(sim.totals.zonder[pick]), money(sim.totals.huidig[pick]), money(sim.totals.nieuw[pick])].forEach(function (cell, index) {
        tr.append(el(index === 0 ? "th" : "td", index === 0 ? { scope: "row", text: cell } : { text: cell }));
      });
      tb.append(tr);
    });
    table.append(tb);
    var wrap = el("div", { class: "table-wrap panel" });
    wrap.append(table);
    root.append(wrap);
    var gain = Box3.simulate(presets.gainThenLoss.input, params);
    root.append(el("p", { class: "small", text: "Na eerst winst en dan verlies staat nog " + money(gain.totals.nieuw.lossCarry) + " verrekenbaar verlies open. Het rekenvoorbeeld noemt ongeveer € 37.985. De belasting in het winstjaar is " + money(gain.rows[0].nieuw.tax) + ", in dat voorbeeld ongeveer € 14.575. Afronding op hele euro's." }));
  }

  function renderNews() {
    var root = document.getElementById("news");
    root.replaceChildren();
    data.news.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).forEach(function (item) {
      root.append(el("article", {}, [
        el("time", { datetime: item.date, text: formatDate(item.date) }),
        el("h3", { text: item.title }),
        el("p", { text: item.summary }),
        el("p", {}, [el("a", { href: item.source, text: "Bron" })])
      ]));
    });
  }

  function renderDocs() {
    var list = document.getElementById("docs");
    list.replaceChildren();
    (data.documents || []).forEach(function (doc) {
      list.append(el("li", {}, [
        el("a", { href: doc.url, text: doc.title }),
        document.createTextNode(" · gelezen " + formatDate(doc.as_of))
      ]));
    });
  }

  function walk(node, pathName, out) {
    if (!node || typeof node !== "object") return;
    if (!Array.isArray(node) && Object.prototype.hasOwnProperty.call(node, "value")) {
      out.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(function (item) { walk(item, pathName, out); });
      return;
    }
    Object.keys(node).forEach(function (key) {
      if (key === "news" || key === "documents" || key === "notes_for_updates") return;
      walk(node[key], pathName, out);
    });
  }

  function renderParams() {
    var leaves = [];
    walk(data, "", leaves);
    var root = document.getElementById("params");
    var pills = document.getElementById("pills");
    root.replaceChildren();
    pills.replaceChildren();
    var featured = [
      data.huidig_stelsel.tarief,
      data.huidig_stelsel.heffingsvrij_vermogen,
      data.huidig_stelsel.forfaitaire_rendementen.jaren[0].banktegoeden,
      data.huidig_stelsel.forfaitaire_rendementen.jaren[0].overige_bezittingen,
      data.nieuw_stelsel.status,
      data.nieuw_stelsel.ingangsjaar,
      data.nieuw_stelsel.heffingvrij_resultaat,
      data.nieuw_stelsel.tarief_regulier,
      data.nieuw_stelsel.tarief_top,
      data.nieuw_stelsel.verliesdrempel
    ];
    featured.forEach(function (node) {
      var statusBit = node.status && String(node.status) !== String(node.value) ? " · " + node.status : "";
      pills.append(el("span", { class: "pill " + statusClass(node.status), title: node.note || node.source }, [
        node.label + ": ",
        el("strong", { text: formatValue(node) }),
        statusBit
      ]));
    });
    leaves.forEach(function (node) {
      var block = el("div", { class: "param" });
      block.append(el("h3", { text: node.label || "Parameter" }));
      block.append(el("p", {}, [
        el("strong", { text: formatValue(node) }),
        " · ",
        el("span", { class: "status", text: node.status })
      ]));
      if (node.note) block.append(el("p", { class: "small", text: node.note }));
      block.append(el("p", { class: "small" }, [
        "Stand ",
        formatDate(node.as_of),
        " · ",
        el("a", { href: node.source, text: node.source_label || node.source })
      ]));
      root.append(block);
    });
    document.getElementById("updated").textContent = "Parameters bijgewerkt: " + formatDate(data.last_updated) + " (" + data.last_updated + ").";
  }

  function syncYears(which) {
    if (which === "beleggen") {
      var n = clampYears(document.getElementById("b-years").value);
      var fill = parsePct(document.getElementById("b-uniform").value);
      var list = document.getElementById("b-year-list");
      var have = list.querySelectorAll("input.year").length;
      if (have === n) return;
      var values = readSimple(list);
      while (values.length < n) values.push(fill);
      values.length = n;
      buildSimpleYears(list, n, values);
    } else if (which === "sparen") {
      n = clampYears(document.getElementById("s-years").value);
      fill = parsePct(document.getElementById("s-uniform").value);
      list = document.getElementById("s-year-list");
      have = list.querySelectorAll("input.year").length;
      if (have === n) return;
      values = readSimple(list);
      while (values.length < n) values.push(fill);
      values.length = n;
      buildSimpleYears(list, n, values);
    } else if (which === "crypto") {
      n = clampYears(document.getElementById("c-years").value);
      fill = parsePct(document.getElementById("c-uniform").value);
      list = document.getElementById("c-year-list");
      have = list.querySelectorAll("input.year").length;
      if (have === n) return;
      values = readSimple(list);
      while (values.length < n) values.push(fill);
      values.length = n;
      buildSimpleYears(list, n, values);
    } else if (which === "mix") {
      n = clampYears(document.getElementById("m-years").value);
      list = document.getElementById("m-year-list");
      have = list.querySelectorAll(".year-row.mix").length;
      if (have === n) return;
      buildMixYears(n);
    }
  }

  function fillSimple(listId, uniformId, yearsId) {
    var n = clampYears(document.getElementById(yearsId).value);
    var value = parsePct(document.getElementById(uniformId).value);
    var values = [];
    for (var i = 0; i < n; i++) values.push(value);
    buildSimpleYears(document.getElementById(listId), n, values);
    renderResults();
  }

  function applyPreset(id) {
    var preset = Box3.articlePresets()[id];
    if (!preset) return;
    var input = preset.input;
    selectTab("tab-beleggen");
    document.getElementById("b-start").value = String(input.invest.start);
    document.getElementById("b-inleg").value = String(input.invest.inleg || 0);
    document.getElementById("b-div").value = formatPct(input.invest.dividend || 0);
    document.getElementById("b-years").value = String(input.years);
    document.getElementById("b-partner").checked = !!input.partner;
    document.getElementById("b-mode").value = input.invest.mode;
    var exacts = input.invest.price.map(function (rate) {
      return Math.abs(rate - Box3.RECOVERY) < 1e-12 ? String(Box3.RECOVERY) : "";
    });
    buildSimpleYears(document.getElementById("b-year-list"), input.years, input.invest.price, exacts);
    renderResults();
  }

  function selectTab(id) {
    document.querySelectorAll('[role="tab"]').forEach(function (tab) {
      var on = tab.id === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    renderResults();
  }

  function retune(changed) {
    var keys = ["m-bank", "m-invest", "m-crypto"];
    var value = Math.max(0, Math.min(100, Math.round(Number(document.getElementById(changed).value))));
    document.getElementById(changed).value = String(value);
    var others = keys.filter(function (key) { return key !== changed; });
    var rest = 100 - value;
    var a = Number(document.getElementById(others[0]).value);
    var b = Number(document.getElementById(others[1]).value);
    if (a + b <= 0) {
      document.getElementById(others[0]).value = String(Math.floor(rest / 2));
      document.getElementById(others[1]).value = String(rest - Math.floor(rest / 2));
    } else {
      var first = Math.round(rest * a / (a + b));
      document.getElementById(others[0]).value = String(first);
      document.getElementById(others[1]).value = String(rest - first);
    }
    labelAlloc();
  }

  function labelAlloc() {
    var total = Math.max(0, parseEuro(document.getElementById("m-total").value));
    [["m-bank", "m-bank-label"], ["m-invest", "m-invest-label"], ["m-crypto", "m-crypto-label"]].forEach(function (pair) {
      var pct = Number(document.getElementById(pair[0]).value);
      document.getElementById(pair[1]).textContent = pct + "% · " + euro0.format(Math.round(total * pct / 100));
    });
  }

  function bind() {
    document.querySelectorAll('[role="tab"]').forEach(function (tab) {
      tab.addEventListener("click", function () { selectTab(tab.id); });
    });
    document.querySelectorAll("[data-preset]").forEach(function (button) {
      button.addEventListener("click", function () { applyPreset(button.getAttribute("data-preset")); });
    });
    document.getElementById("b-fill").addEventListener("click", function () { fillSimple("b-year-list", "b-uniform", "b-years"); });
    document.getElementById("s-fill").addEventListener("click", function () { fillSimple("s-year-list", "s-uniform", "s-years"); });
    document.getElementById("c-fill").addEventListener("click", function () { fillSimple("c-year-list", "c-uniform", "c-years"); });
    ["b-years", "s-years", "c-years", "m-years"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", function () {
        syncYears(id.slice(0, 1) === "b" ? "beleggen" : id.slice(0, 1) === "s" ? "sparen" : id.slice(0, 1) === "c" ? "crypto" : "mix");
        renderResults();
      });
    });
    ["m-bank", "m-invest", "m-crypto"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", function () {
        retune(id);
        renderResults();
      });
    });
    document.getElementById("m-total").addEventListener("input", function () {
      labelAlloc();
      renderResults();
    });
    document.getElementById("main").addEventListener("input", function (event) {
      if (event.target.id === "m-bank" || event.target.id === "m-invest" || event.target.id === "m-crypto" || event.target.id === "m-total") return;
      if (event.target.id === "b-years" || event.target.id === "s-years" || event.target.id === "c-years" || event.target.id === "m-years") return;
      renderResults();
    });
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", renderResults);
    }
  }

  function boot(json) {
    data = json;
    params = Box3.parseParams(data);
    renderParams();
    renderNews();
    renderDocs();
    renderCheck();
    buildSimpleYears(document.getElementById("b-year-list"), 1, [0.15]);
    buildSimpleYears(document.getElementById("s-year-list"), 5, [0.0128, 0.0128, 0.0128, 0.0128, 0.0128]);
    buildSimpleYears(document.getElementById("c-year-list"), 4, [0.8, -0.6, 1.2, -0.3]);
    buildMixYears(5);
    labelAlloc();
    bind();
    renderResults();
  }

  fetch("data.json").then(function (response) {
    if (!response.ok) throw new Error("data.json HTTP " + response.status);
    return response.json();
  }).then(boot).catch(function (error) {
    console.error(error);
    document.getElementById("results").textContent = "De parameters konden niet worden geladen.";
  });
})();
