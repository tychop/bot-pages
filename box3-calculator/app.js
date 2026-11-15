"use strict";

(function () {
  var euro0 = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var rules = null;

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
  var SPLITS = [
    { value: "100-0-0", label: "Alleen sparen", bank: 100, invest: 0, crypto: 0 },
    { value: "0-100-0", label: "Alleen beleggen", bank: 0, invest: 100, crypto: 0 },
    { value: "0-0-100", label: "Alleen crypto", bank: 0, invest: 0, crypto: 100 },
    { value: "50-50-0", label: "Sparen en beleggen", bank: 50, invest: 50, crypto: 0 },
    { value: "70-30-0", label: "Vooral sparen", bank: 70, invest: 30, crypto: 0 },
    { value: "30-70-0", label: "Vooral beleggen", bank: 30, invest: 70, crypto: 0 },
    { value: "40-40-20", label: "Mix 40 / 40 / 20", bank: 40, invest: 40, crypto: 20 },
    { value: "60-20-20", label: "Sparen met risico", bank: 60, invest: 20, crypto: 20 },
    { value: "zelf", label: "Zelf, in stappen van 10%", bank: null, invest: null, crypto: null }
  ];

  function moneyOpts(list) {
    return list.map(function (n) { return { value: n, label: euro0.format(n) }; });
  }

  function pctOpts(list) {
    return list.map(function (n) { return { value: n, label: pctLabel(n) }; });
  }

  function pctLabel(fraction) {
    var v = Math.round(fraction * 10000) / 100;
    var digits = 0;
    if (Math.abs(v * 100 - Math.round(v * 100)) > 1e-6) digits = 2;
    else if (Math.abs(v - Math.round(v)) > 1e-6) digits = Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 ? 1 : 2;
    return new Intl.NumberFormat("nl-NL", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(v) + "%";
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

  function field(id, label, options, selected) {
    var sel = el("select", { id: id });
    options.forEach(function (opt) {
      var o = el("option", { value: String(opt.value), text: opt.label });
      if (String(opt.value) === String(selected)) o.selected = true;
      sel.append(o);
    });
    var box = el("label", { class: "field", id: id + "-field" }, [el("span", { text: label }), sel]);
    return box;
  }

  function val(id) { return document.getElementById(id).value; }
  function num(id) { return Number(val(id)); }
  function setVal(id, value) {
    var node = document.getElementById(id);
    if (node) node.value = String(value);
  }

  function fill(n, rate) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(rate);
    return out;
  }

  function path(scenario, years, base, kind) {
    var loss = kind === "crypto" ? -0.5 : -0.2;
    var crash = kind === "crypto" ? -0.5 : -0.3;
    var rebound = kind === "crypto" ? 0.4 : Math.min(Math.max(base, 0.1), 0.3);
    var i;
    var out = fill(years, base);
    if (scenario === "flat15") return fill(years, 0.15);
    if (scenario === "gainThenLoss" || scenario === "holdRoundTrip") {
      for (i = 0; i < years; i++) out[i] = i % 2 === 0 ? Box3.RECOVERY : -0.3;
      return out;
    }
    if (scenario === "lossThenGain") {
      for (i = 0; i < years; i++) out[i] = i % 2 === 0 ? -0.3 : Box3.RECOVERY;
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

  function readCustom(containerId, years, fallback) {
    var inputs = document.getElementById(containerId).querySelectorAll("select");
    var out = [];
    for (var i = 0; i < years; i++) out.push(inputs[i] ? Number(inputs[i].value) : fallback);
    return out;
  }

  function investScenarios() {
    return [
      { value: "gelijk", label: "Gelijkmatig" },
      { value: "midden", label: "Verliesjaar in het midden" },
      { value: "winst-verlies", label: "Eerst winst, dan verlies" },
      { value: "verlies-winst", label: "Eerst verlies, dan winst" },
      { value: "crash", label: "Crash en herstel" },
      { value: "flat15", label: "Artikel: 15% op € 100.000" },
      { value: "gainThenLoss", label: "Artikel: eerst +42,9%, dan −30%" },
      { value: "lossThenGain", label: "Artikel: eerst −30%, dan +42,9%" },
      { value: "holdRoundTrip", label: "Artikel: aanhouden" },
      { value: "aangepast", label: "Aangepast per jaar" }
    ];
  }

  function priceScenarios() {
    return investScenarios().filter(function (item) {
      return item.value.indexOf("flat") !== 0 && item.value.indexOf("gain") !== 0 && item.value.indexOf("lossThen") !== 0 && item.value !== "holdRoundTrip";
    });
  }

  function zeros(n) {
    return fill(n, 0);
  }

  function readBeleggen() {
    var years = num("b-years");
    var scenario = val("b-scenario");
    var base = num("b-rate");
    var prices = scenario === "aangepast" ? readCustom("b-custom", years, base) : path(scenario, years, base, "invest");
    return {
      partner: val("b-partner") === "1",
      years: years,
      debt: 0,
      debtRate: 0,
      bank: { start: 0, inleg: 0, rates: zeros(years) },
      invest: {
        start: num("b-wealth"),
        inleg: num("b-inleg"),
        price: prices,
        dividend: num("b-div"),
        mode: scenario === "holdRoundTrip" ? "hold" : val("b-mode")
      },
      crypto: { start: 0, inleg: 0, price: zeros(years) }
    };
  }

  function readSparen() {
    var years = num("s-years");
    var scenario = val("s-scenario");
    var base = num("s-rate");
    var rates = scenario === "aangepast" ? readCustom("s-custom", years, base) : path(scenario, years, base, "save");
    return {
      partner: val("s-partner") === "1",
      years: years,
      debt: 0,
      debtRate: 0,
      bank: { start: num("s-wealth"), inleg: num("s-inleg"), rates: rates },
      invest: { start: 0, inleg: 0, price: zeros(years), dividend: 0, mode: "hold" },
      crypto: { start: 0, inleg: 0, price: zeros(years) }
    };
  }

  function readCrypto() {
    var years = num("c-years");
    var scenario = val("c-scenario");
    var base = num("c-rate");
    var prices = scenario === "aangepast" ? readCustom("c-custom", years, base) : path(scenario, years, base, "crypto");
    return {
      partner: val("c-partner") === "1",
      years: years,
      debt: 0,
      debtRate: 0,
      bank: { start: 0, inleg: 0, rates: zeros(years) },
      invest: { start: 0, inleg: 0, price: zeros(years), dividend: 0, mode: "hold" },
      crypto: { start: num("c-wealth"), inleg: num("c-inleg"), price: prices }
    };
  }

  function readMix() {
    var years = num("m-years");
    var scenario = val("m-scenario");
    var total = num("m-wealth");
    var inleg = num("m-inleg");
    var bankPct = num("m-bank") / 100;
    var investPct = num("m-invest") / 100;
    var cryptoPct = num("m-crypto") / 100;
    var bankBase = num("m-save-rate");
    var investBase = num("m-invest-rate");
    var cryptoBase = num("m-crypto-rate");
    var investPath = scenario === "aangepast" ? readCustom("m-invest-custom", years, investBase) : path(scenario, years, investBase, "invest");
    var cryptoPath = scenario === "aangepast" ? readCustom("m-crypto-custom", years, cryptoBase) : path(scenario, years, cryptoBase, "crypto");
    return {
      partner: val("m-partner") === "1",
      years: years,
      debt: num("m-debt"),
      debtRate: num("m-debt-rate"),
      bank: { start: total * bankPct, inleg: inleg * bankPct, rates: fill(years, bankBase) },
      invest: {
        start: total * investPct,
        inleg: inleg * investPct,
        price: investPath,
        dividend: num("m-div"),
        mode: val("m-mode")
      },
      crypto: { start: total * cryptoPct, inleg: inleg * cryptoPct, price: cryptoPath }
    };
  }

  function activeKind() {
    var tab = document.querySelector('[role="tab"][aria-selected="true"]');
    return tab ? tab.getAttribute("data-kind") : "beleggen";
  }

  function currentInput() {
    var kind = activeKind();
    if (kind === "sparen") return readSparen();
    if (kind === "crypto") return readCrypto();
    if (kind === "mix") return readMix();
    return readBeleggen();
  }

  function dark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function chart(series) {
    var w = 640, h = 220, left = 58, right = 8, top = 12, bottom = 22;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("class", "chart");
    svg.setAttribute("role", "img");
    var max = -Infinity;
    var min = Infinity;
    var n = series[0].points.length;
    series.forEach(function (s) {
      s.points.forEach(function (v) {
        if (v > max) max = v;
        if (v < min) min = v;
      });
    });
    if (!isFinite(max) || max === min) { max = (max || 1) + 1; min = (min || 0) - 1; }
    var pad = (max - min) * 0.08;
    max += pad;
    min = Math.max(0, min - pad);
    function x(i) { return left + (w - left - right) * (n <= 1 ? 0.5 : i / (n - 1)); }
    function y(v) { return top + (h - top - bottom) * (1 - (v - min) / (max - min)); }
    var ink = dark() ? "#c4bdb0" : "#5e584e";
    var grid = dark() ? "#31362e" : "#e4ddd2";
    for (var g = 0; g < 3; g++) {
      var value = min + (max - min) * g / 2;
      var yy = y(value);
      var line = document.createElementNS(svg.namespaceURI, "line");
      line.setAttribute("x1", left);
      line.setAttribute("x2", w - right);
      line.setAttribute("y1", yy);
      line.setAttribute("y2", yy);
      line.setAttribute("stroke", grid);
      svg.appendChild(line);
      var label = document.createElementNS(svg.namespaceURI, "text");
      label.setAttribute("x", left - 6);
      label.setAttribute("y", yy + 4);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", ink);
      label.setAttribute("font-size", "11");
      label.textContent = euro0.format(Math.round(value));
      svg.appendChild(label);
    }
    series.forEach(function (s) {
      var d = s.points.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ");
      var pathNode = document.createElementNS(svg.namespaceURI, "path");
      pathNode.setAttribute("d", d);
      pathNode.setAttribute("fill", "none");
      pathNode.setAttribute("stroke", s.color);
      pathNode.setAttribute("stroke-width", "2.5");
      pathNode.setAttribute("stroke-linecap", "round");
      pathNode.setAttribute("stroke-linejoin", "round");
      svg.appendChild(pathNode);
    });
    svg.setAttribute("aria-label", series.map(function (s) {
      return s.name + " " + euro0.format(Math.round(s.points[s.points.length - 1]));
    }).join(", "));
    return svg;
  }

  function render() {
    var input = currentInput();
    var sim = Box3.simulate(input, rules.params);
    var netH = sim.totals.huidig.end - (input.debt || 0);
    var netN = sim.totals.nieuw.end - (input.debt || 0);
    var box = document.getElementById("results");
    box.replaceChildren();
    box.append(el("p", { class: "when", text: "Na " + input.years + (input.years === 1 ? " jaar" : " jaar") }));
    var grid = el("div", { class: "overview" });
    ["", "Huidig forfait/tegenbewijs", "Voorstel werkelijk rendement"].forEach(function (name, index) {
      grid.append(el("div", { class: index ? "h" : "", text: name }));
    });
    function row(label, a, b) {
      grid.append(el("div", { class: "lab", text: label }));
      grid.append(el("b", { class: "old", text: euro0.format(Math.round(a)) }));
      grid.append(el("b", { class: "new", text: euro0.format(Math.round(b)) }));
    }
    row("Belasting", sim.totals.huidig.tax, sim.totals.nieuw.tax);
    row("Eindvermogen", netH, netN);
    box.append(grid);
    var taxGap = sim.totals.nieuw.tax - sim.totals.huidig.tax;
    var taxDelta = Math.abs(taxGap) < 1
      ? "De totale belasting is vrijwel gelijk."
      : taxGap > 0
        ? "Het voorstel kost " + euro0.format(Math.round(taxGap)) + " meer belasting."
        : "Het huidige stelsel kost " + euro0.format(Math.round(-taxGap)) + " meer belasting.";
    box.append(el("p", { class: "delta", text: taxDelta }));
    var gap = netH - netN;
    var delta = Math.abs(gap) < 1 ? "Het eindvermogen is vrijwel gelijk." : gap > 0 ? "Het voorstel laat " + euro0.format(Math.round(gap)) + " minder over." : "Het voorstel laat " + euro0.format(Math.round(-gap)) + " meer over.";
    box.append(el("p", { class: "delta", text: delta }));
    var colors = dark()
      ? { huidig: "#8fd9d1", nieuw: "#fdba74" }
      : { huidig: "#0b6e66", nieuw: "#9a3412" };
    box.append(el("div", { class: "legend" }, [
      el("span", {}, [el("i", { class: "swatch", style: "background:" + colors.huidig }), "Huidig forfait/tegenbewijs"]),
      el("span", {}, [el("i", { class: "swatch", style: "background:" + colors.nieuw }), "Voorstel werkelijk rendement"])
    ]));
    var points = { huidig: [sim.start], nieuw: [sim.start] };
    sim.rows.forEach(function (rowItem) {
      points.huidig.push(rowItem.huidig.end);
      points.nieuw.push(rowItem.nieuw.end);
    });
    box.append(chart([
      { name: "Huidig forfait/tegenbewijs", color: colors.huidig, points: points.huidig },
      { name: "Voorstel werkelijk rendement", color: colors.nieuw, points: points.nieuw }
    ]));
    renderTable(sim, input);
  }

  function renderTable(sim, input) {
    var host = document.getElementById("year-body");
    host.replaceChildren();
    var table = el("table");
    var head = el("tr");
    ["Jaar", "Belasting huidig", "Belasting voorstel", "Eind huidig", "Eind voorstel"].forEach(function (name) {
      head.append(el("th", { scope: "col", text: name }));
    });
    table.append(el("thead", {}, [head]));
    var body = el("tbody");
    sim.rows.forEach(function (row) {
      var tr = el("tr");
      [String(row.year), euro0.format(Math.round(row.huidig.tax)), euro0.format(Math.round(row.nieuw.tax)), euro0.format(Math.round(row.huidig.end)), euro0.format(Math.round(row.nieuw.end))].forEach(function (cell, index) {
        tr.append(el(index ? "td" : "th", index ? { text: cell } : { scope: "row", text: cell }));
      });
      body.append(tr);
    });
    table.append(body);
    var wrap = el("div", { class: "table-wrap" });
    wrap.append(table);
    host.append(wrap);
    var bits = [];
    if (sim.effective.huidig != null) bits.push("Effectief huidig " + pctLabel(sim.effective.huidig) + ".");
    if (sim.effective.nieuw != null) bits.push("Effectief voorstel " + pctLabel(sim.effective.nieuw) + ".");
    if (sim.totals.nieuw.lossCarry > 1) bits.push("Open verlies voor later: " + euro0.format(Math.round(sim.totals.nieuw.lossCarry)) + ". Geen teruggave.");
    if (input.debt > 0) bits.push("Eindvermogen hierboven is het bezit. Netto min de schuld staat in het overzicht.");
    if (bits.length) host.append(el("p", { class: "muted", text: bits.join(" ") }));
  }

  function renderCheck() {
    var host = document.getElementById("check-body");
    var presets = Box3.articlePresets();
    var specs = [
      ["15% op € 100.000, belasting", presets.flat15.input, "tax"],
      ["Eerst +42,9%, dan −30%", presets.gainThenLoss.input, "end"],
      ["Eerst −30%, dan +42,9%", presets.lossThenGain.input, "end"],
      ["Aanhouden, zelfde koersen", presets.holdRoundTrip.input, "end"]
    ];
    var table = el("table");
    var head = el("tr");
    ["Voorbeeld", "Huidig", "Voorstel"].forEach(function (name) { head.append(el("th", { scope: "col", text: name })); });
    table.append(el("thead", {}, [head]));
    var body = el("tbody");
    specs.forEach(function (spec) {
      var sim = Box3.simulate(spec[1], rules.params);
      var tr = el("tr");
      [spec[0], euro0.format(Math.round(sim.totals.huidig[spec[2]])), euro0.format(Math.round(sim.totals.nieuw[spec[2]]))].forEach(function (cell, index) {
        tr.append(el(index ? "td" : "th", index ? { text: cell } : { scope: "row", text: cell }));
      });
      body.append(tr);
    });
    table.append(body);
    var wrap = el("div", { class: "table-wrap" });
    wrap.append(table);
    host.replaceChildren(wrap);
  }

  function renderNotes() {
    var p = rules.params;
    var host = document.getElementById("notes-body");
    host.replaceChildren(
      el("ul", {}, [
        el("li", { text: "Huidig is het forfait van " + p.jaar + " of het tegenbewijs, het lagere bedrag. Tegenbewijs kijkt ook naar koerswinst die u niet verkoopt, zonder vermogensvrijstelling, en een verlies gaat niet mee naar een volgend jaar." }),
        el("li", { text: "Het voorstel is nog geen wet. Eerst " + euro0.format(p.exemptionResult) + " vrij, daarna oud verlies. Alleen het verlies boven " + euro0.format(p.lossThreshold) + " gaat vooruit, niet terug." }),
        el("li", { text: "Tarief in het voorstel: " + pctLabel(p.rateLow) + " tot " + euro0.format(p.bracketLimit) + " resultaat in een jaar, daarna " + pctLabel(p.rateHigh) + "." }),
        el("li", { text: "Aandelen: koerswinst bij verkoop. Kies aanhouden om die winst tot het laatste jaar uit te stellen. Dividend telt elk jaar." }),
        el("li", { text: "Directe crypto: de koersmutatie telt elk jaar, ook zonder verkoop. De belasting gaat in dit model van het vermogen af." }),
        el("li", { text: "Geen kosten, geen vastgoed, geen indexatie. De inleg staat op 1 januari." })
      ])
    );
  }

  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    if (!m) return iso || "";
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
    }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
  }

  function renderNews() {
    var host = document.getElementById("news-body");
    host.replaceChildren();
    rules.data.news.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).forEach(function (item) {
      host.append(el("article", {}, [
        el("p", { class: "muted", text: formatDate(item.date) }),
        el("h3", { text: item.title }),
        el("p", { text: item.summary }),
        el("p", {}, [el("a", { href: item.source, text: "Bron" })])
      ]));
    });
  }

  function renderDocs() {
    var list = document.getElementById("docs");
    list.replaceChildren();
    (rules.data.documents || []).forEach(function (doc) {
      list.append(el("li", {}, [
        el("a", { href: doc.url, text: doc.title }),
        " · " + formatDate(doc.as_of)
      ]));
    });
    var paramsHost = document.getElementById("param-body");
    paramsHost.replaceChildren();
    walk(rules.data, function (node) {
      paramsHost.append(el("p", {}, [
        el("strong", { text: (node.label || "Parameter") + ": " + formatParam(node) }),
        el("span", { class: "muted", text: " · " + node.status + " · " }),
        el("a", { href: node.source, text: node.source_label || "Bron" })
      ]));
    });
    document.getElementById("updated").textContent = "Bijgewerkt " + formatDate(rules.data.last_updated) + ".";
  }

  function formatParam(node) {
    if (node.unit === "eur") return euro0.format(node.value);
    if (node.unit === "fraction") return pctLabel(node.value);
    if (typeof node.value === "boolean") return node.value ? "ja" : "nee";
    return String(node.value);
  }

  function walk(node, fn) {
    if (!node || typeof node !== "object") return;
    if (!Array.isArray(node) && Object.prototype.hasOwnProperty.call(node, "value")) {
      fn(node);
      return;
    }
    var list = Array.isArray(node) ? node : Object.keys(node).filter(function (key) {
      return key !== "news" && key !== "documents" && key !== "notes_for_updates";
    }).map(function (key) { return node[key]; });
    list.forEach(function (item) { walk(item, fn); });
  }

  function nearest(options, target) {
    var best = options[0];
    var bestDist = Infinity;
    options.forEach(function (opt) {
      var dist = Math.abs(opt - target);
      if (dist < bestDist) {
        bestDist = dist;
        best = opt;
      }
    });
    return best;
  }

  function buildCustom(containerId, years, options, prefix, fallback) {
    var box = document.getElementById(containerId);
    var previous = [];
    box.querySelectorAll("select").forEach(function (sel) { previous.push(sel.value); });
    if (previous.length === years && box.childElementCount === years) return;
    box.replaceChildren();
    var start = nearest(options, fallback == null ? 0.05 : fallback);
    for (var i = 0; i < years; i++) {
      box.append(field(prefix + "-y-" + i, "Jaar " + (i + 1), pctOpts(options), previous[i] != null ? previous[i] : start));
    }
  }

  function fixedScenario(scenario) {
    return scenario === "flat15" || scenario === "gainThenLoss" || scenario === "lossThenGain" || scenario === "holdRoundTrip" || scenario === "aangepast";
  }

  function syncBeleggen() {
    var scenario = val("b-scenario");
    document.getElementById("b-rate-field").hidden = fixedScenario(scenario);
    var custom = document.getElementById("b-custom");
    custom.hidden = scenario !== "aangepast";
    if (scenario === "aangepast") buildCustom("b-custom", num("b-years"), INVEST_RATES, "b", num("b-rate"));
    if (scenario === "holdRoundTrip") setVal("b-mode", "hold");
    if (scenario === "flat15" || scenario === "gainThenLoss" || scenario === "lossThenGain") setVal("b-mode", "sell");
  }

  function syncCrypto() {
    var scenario = val("c-scenario");
    document.getElementById("c-rate-field").hidden = scenario === "aangepast";
    var custom = document.getElementById("c-custom");
    custom.hidden = scenario !== "aangepast";
    if (scenario === "aangepast") buildCustom("c-custom", num("c-years"), CRYPTO_RATES, "c", num("c-rate"));
  }

  function syncSparen() {
    var scenario = val("s-scenario");
    document.getElementById("s-rate-field").hidden = scenario === "aangepast";
    var custom = document.getElementById("s-custom");
    custom.hidden = scenario !== "aangepast";
    if (scenario === "aangepast") {
      document.getElementById("s-more").open = true;
      buildCustom("s-custom", num("s-years"), SAVE_RATES, "s", num("s-rate"));
    }
  }

  function syncMix() {
    var scenario = val("m-scenario");
    document.getElementById("m-custom").hidden = scenario !== "aangepast";
    if (scenario === "aangepast") {
      buildCustom("m-invest-custom", num("m-years"), INVEST_RATES, "mi", num("m-invest-rate"));
      buildCustom("m-crypto-custom", num("m-years"), CRYPTO_RATES, "mc", num("m-crypto-rate"));
    }
  }

  function applyArticle(scenario) {
    var years = scenario === "flat15" ? 1 : 2;
    setVal("b-wealth", 100000);
    setVal("b-years", years);
    setVal("b-inleg", 0);
    setVal("b-div", 0);
    setVal("b-partner", "0");
    setVal("b-rate", 0.15);
  }

  function applySplit(openCustom) {
    var id = val("m-split");
    var preset = null;
    SPLITS.forEach(function (item) { if (item.value === id) preset = item; });
    if (!preset || preset.bank == null) {
      if (openCustom) document.getElementById("m-more").open = true;
      return;
    }
    setVal("m-bank", preset.bank);
    setVal("m-invest", preset.invest);
    setVal("m-crypto", preset.crypto);
  }

  function matchSplit() {
    var key = num("m-bank") + "-" + num("m-invest") + "-" + num("m-crypto");
    var found = "zelf";
    SPLITS.forEach(function (item) { if (item.value === key) found = key; });
    setVal("m-split", found);
  }

  function retune(changed) {
    var keys = ["m-bank", "m-invest", "m-crypto"];
    var value = Math.max(0, Math.min(100, Math.round(num(changed) / 10) * 10));
    setVal(changed, value);
    var others = keys.filter(function (key) { return key !== changed; });
    var rest = 100 - value;
    var a = num(others[0]);
    var b = num(others[1]);
    var first = a + b <= 0 ? Math.round(rest / 20) * 10 : Math.round((rest * a / (a + b)) / 10) * 10;
    if (first > rest) first = rest;
    if (first < 0) first = 0;
    setVal(others[0], first);
    setVal(others[1], rest - first);
    matchSplit();
  }

  function selectTab(kind) {
    document.querySelectorAll('[role="tab"]').forEach(function (tab) {
      var on = tab.getAttribute("data-kind") === kind;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      document.getElementById("panel-" + tab.getAttribute("data-kind")).hidden = !on;
    });
    render();
  }

  function steps(max) {
    var out = [];
    for (var i = 0; i <= max; i += 10) out.push({ value: i, label: i + "%" });
    return out;
  }

  function panel(kind, controls, more) {
    var box = el("div", { id: "panel-" + kind, role: "tabpanel" });
    if (kind !== "beleggen") box.hidden = true;
    var grid = el("div", { class: "controls" });
    controls.forEach(function (node) { grid.append(node); });
    box.append(grid);
    if (more) box.append(more);
    return box;
  }

  function more(id, nodes, extraId) {
    var body = el("div", { class: "more-grid" });
    nodes.forEach(function (node) { body.append(node); });
    if (extraId) body.append(el("div", { id: extraId, class: "custom", hidden: "hidden" }));
    var details = el("details", { class: "more", id: id });
    details.append(el("summary", { text: "Meer opties" }));
    details.append(body);
    return details;
  }

  function build() {
    var main = document.getElementById("main");
    main.replaceChildren();
    var tabs = el("div", { class: "tabs", role: "tablist", "aria-label": "Soort vermogen" });
    [["beleggen", "Beleggen"], ["sparen", "Sparen"], ["crypto", "Crypto"], ["mix", "Mix"]].forEach(function (item, index) {
      tabs.append(el("button", {
        type: "button",
        role: "tab",
        "data-kind": item[0],
        "aria-selected": index === 0 ? "true" : "false",
        text: item[1]
      }));
    });
    main.append(tabs);

    var belegPanel = panel("beleggen", [
      field("b-wealth", "Vermogen", moneyOpts(WEALTH), 100000),
      field("b-scenario", "Scenario", investScenarios(), "gelijk"),
      field("b-rate", "Rendement per jaar", pctOpts(INVEST_RATES), 0.07),
      field("b-years", "Jaren", YEARS.map(function (n) { return { value: n, label: String(n) }; }), 10),
      field("b-mode", "Verkoop", [
        { value: "hold", label: "Aanhouden tot het einde (latente heffing meegerekend)" },
        { value: "sell", label: "Elk jaar verkopen" }
      ], "hold")
    ], more("b-more", [
      field("b-inleg", "Inleg per jaar", moneyOpts(INLEG), 0),
      field("b-div", "Dividend", pctOpts(DIVIDEND), 0),
      field("b-partner", "Fiscale partner", [{ value: "0", label: "Nee" }, { value: "1", label: "Ja" }], "0")
    ]));
    belegPanel.insertBefore(el("div", { id: "b-custom", class: "custom", hidden: "hidden" }), belegPanel.querySelector(".more"));
    main.append(belegPanel);

    var sCustom = el("div", { id: "s-custom", class: "custom", hidden: "hidden" });
    main.append(panel("sparen", [
      field("s-wealth", "Spaartegoed", moneyOpts(WEALTH), 150000),
      field("s-rate", "Rente per jaar", pctOpts(SAVE_RATES), 0.015),
      field("s-years", "Jaren", YEARS.map(function (n) { return { value: n, label: String(n) }; }), 10)
    ], (function () {
      var block = more("s-more", [
        field("s-scenario", "Verloop", [
          { value: "gelijk", label: "Gelijkmatig" },
          { value: "stijgend", label: "Oplopend naar de gekozen rente" },
          { value: "dalend", label: "Aflopend vanaf de gekozen rente" },
          { value: "aangepast", label: "Aangepast per jaar" }
        ], "gelijk"),
        field("s-inleg", "Inleg per jaar", moneyOpts(INLEG), 0),
        field("s-partner", "Fiscale partner", [{ value: "0", label: "Nee" }, { value: "1", label: "Ja" }], "0")
      ]);
      block.append(sCustom);
      return block;
    })()));

    main.append(panel("crypto", [
      field("c-wealth", "Startwaarde", moneyOpts(WEALTH), 50000),
      field("c-scenario", "Scenario", priceScenarios(), "gelijk"),
      field("c-rate", "Rendement per jaar", pctOpts(CRYPTO_RATES), 0.2),
      field("c-years", "Jaren", YEARS.map(function (n) { return { value: n, label: String(n) }; }), 5)
    ], (function () {
      var block = more("c-more", [
        field("c-inleg", "Inleg per jaar", moneyOpts(INLEG), 0),
        field("c-partner", "Fiscale partner", [{ value: "0", label: "Nee" }, { value: "1", label: "Ja" }], "0")
      ]);
      return block;
    })()));
    var cryptoPanel = main.lastElementChild;
    cryptoPanel.insertBefore(el("div", { id: "c-custom", class: "custom", hidden: "hidden" }), cryptoPanel.querySelector(".more"));

    main.append(panel("mix", [
      field("m-wealth", "Vermogen", moneyOpts(WEALTH), 100000),
      field("m-split", "Verdeling", SPLITS.map(function (item) { return { value: item.value, label: item.label }; }), "50-50-0"),
      field("m-scenario", "Scenario", priceScenarios(), "gelijk"),
      field("m-years", "Jaren", YEARS.map(function (n) { return { value: n, label: String(n) }; }), 10)
    ], (function () {
      var block = more("m-more", [
        field("m-bank", "Sparen", steps(100), 50),
        field("m-invest", "Beleggen", steps(100), 50),
        field("m-crypto", "Crypto", steps(100), 0),
        field("m-save-rate", "Rente sparen", pctOpts(SAVE_RATES), 0.015),
        field("m-invest-rate", "Rendement beleggen", pctOpts(INVEST_RATES), 0.07),
        field("m-crypto-rate", "Rendement crypto", pctOpts(CRYPTO_RATES), 0.1),
        field("m-inleg", "Inleg per jaar", moneyOpts(INLEG), 0),
        field("m-div", "Dividend op beleggen", pctOpts(DIVIDEND), 0),
        field("m-mode", "Beleggingen", [
          { value: "hold", label: "Aanhouden tot het einde (latente heffing)" },
          { value: "sell", label: "Elk jaar verkopen" }
        ], "hold"),
        field("m-partner", "Fiscale partner", [{ value: "0", label: "Nee" }, { value: "1", label: "Ja" }], "0"),
        field("m-debt", "Schuld", moneyOpts(DEBT), 0),
        field("m-debt-rate", "Rente op de schuld", pctOpts(DEBT_RATE), 0.04)
      ]);
      return block;
    })()));
    var mixPanel = main.lastElementChild;
    var mixCustom = el("div", { id: "m-custom", hidden: "hidden" });
    mixCustom.append(el("p", { class: "muted", text: "Beleggen per jaar" }));
    mixCustom.append(el("div", { id: "m-invest-custom", class: "custom" }));
    mixCustom.append(el("p", { class: "muted", text: "Crypto per jaar" }));
    mixCustom.append(el("div", { id: "m-crypto-custom", class: "custom" }));
    mixPanel.insertBefore(mixCustom, mixPanel.querySelector(".more"));

    main.append(el("div", { id: "results", "aria-live": "polite" }));

    function fold(id, title, kids) {
      var details = el("details", { class: "fold" });
      details.append(el("summary", { text: title }));
      var body = el("div", { class: "body", id: id });
      (kids || []).forEach(function (kid) { body.append(kid); });
      details.append(body);
      return details;
    }

    var folds = el("div", { class: "folds" });
    folds.append(fold("year-body", "Jaar voor jaar"));
    folds.append(fold("check-body", "Controle op het rekenvoorbeeld"));
    folds.append(fold("notes-body", "Uitgangspunten"));
    folds.append(fold("news-body", "Laatste ontwikkelingen"));
    var bron = fold("docs-wrap", "Bronnen");
    bron.querySelector(".body").append(el("p", { id: "updated", class: "muted" }));
    bron.querySelector(".body").append(el("ul", { class: "docs", id: "docs" }));
    bron.querySelector(".body").append(el("div", { id: "param-body" }));
    folds.append(bron);
    main.append(folds);
  }

  function bind() {
    document.getElementById("main").addEventListener("click", function (event) {
      var tab = event.target.closest("[data-kind]");
      if (tab && tab.getAttribute("role") === "tab") selectTab(tab.getAttribute("data-kind"));
    });
    document.getElementById("main").addEventListener("change", function (event) {
      var id = event.target.id;
      if (id === "b-scenario") {
        var scenario = val("b-scenario");
        if (scenario === "flat15" || scenario === "gainThenLoss" || scenario === "lossThenGain" || scenario === "holdRoundTrip") applyArticle(scenario);
        syncBeleggen();
      } else if (id === "b-years") syncBeleggen();
      else if (id === "c-scenario" || id === "c-years") syncCrypto();
      else if (id === "s-scenario" || id === "s-years") syncSparen();
      else if (id === "m-scenario" || id === "m-years") syncMix();
      else if (id === "m-split") applySplit(true);
      else if (id === "m-bank" || id === "m-invest" || id === "m-crypto") retune(id);
      render();
    });
    if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
  }

  function boot(data) {
    rules = { id: "nl", data: data, params: Box3.parseParams(data) };
    build();
    bind();
    syncBeleggen();
    syncSparen();
    syncCrypto();
    syncMix();
    renderCheck();
    renderNotes();
    renderNews();
    renderDocs();
    render();
  }

  fetch("data.json").then(function (response) {
    if (!response.ok) throw new Error("data.json HTTP " + response.status);
    return response.json();
  }).then(boot).catch(function () {
    document.getElementById("main").textContent = "De vergelijking kon niet worden geladen.";
  });
})();
