/* SpaceX Stock. Daily refresh edits data.json only:
   updated, market, vol, factors (scores, news, and the rest of each factor),
   today, catalysts, pillars, shortWeights, and append one closes row plus one
   history entry (priceDate = the close it is based on). Never edit past entries. */
(function () {
  const ANCHOR = {
    rise: [0.55, 0.6, 0.62],
    x2: [0.1, 0.35, 0.45],
    x10: [0.002, 0.02, 0.06],
    x100: [0.00001, 0.0005, 0.003],
    top1: [0.1, 0.3, 0.35],
  };
  const K = 4;
  const KS = 1;
  const T_YEARS = [1 / 252, 5 / 252, 21 / 252];
  const SESSIONS = [1, 5, 21, 252, 1260, 2520];
  const APPLE_T = 5.096;
  const H_KEYS = ["1d", "1w", "1m", "1y", "5y", "10y"];
  const H_SHORT = H_KEYS.slice();
  const H_LABEL = ["1 trading day", "1 week", "1 month", "1 year (Nov 2027)", "5 years (2031)", "10 years (2036)"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const TABS = [
    ["meter", "Chance meter"],
    ["history", "History"],
    ["thesis", "Thesis tracker"],
    ["ecosystem", "Ecosystem"],
    ["scenarios", "Scenarios"],
    ["today", "Today"],
    ["catalysts", "Coming up"],
    ["sources", "Sources"],
  ];
  const TARGETS = [
    { id: "rise", label: "Rise vs fall", row: null },
    { id: "x2", label: "2X", row: "2X share price" },
    { id: "x10", label: "10X", row: "10X share price" },
    { id: "x100", label: "100X", row: "100X share price" },
    { id: "top1", label: "#1 company", row: "#1 most valuable" },
  ];

  const state = {
    h: 3,
    shortH: 0,
    longH: 3,
    target: "rise",
    weights: null,
    adjust: false,
    pillar: "launch",
    mult: "10",
    theme: "dark",
  };

  let DATA = null;
  let LINKS = null;
  let NET0 = null;
  let visualShown = 0;
  let gaugeToken = 0;
  const view = document.getElementById("main");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function sig(x) { return 1 / (1 + Math.exp(-x)); }
  function logit(p) { return Math.log(p / (1 - p)); }
  function fmtP(p) {
    if (p < 0.001) return "<0.1%";
    if (p < 0.01) return `${(p * 100).toFixed(1)}%`;
    return `${Math.round(p * 100)}%`;
  }
  function fmtT(v) {
    if (v >= 1000) return `$${(v / 1000).toFixed(2)} quadrillion`;
    if (v >= 1) return `$${v.toFixed(v >= 100 ? 0 : 1)}T`;
    return `$${Math.round(v * 1000)}B`;
  }
  function countdown(ms) {
    if (ms <= 0) return "Now";
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
  }
  function countdownText(at, mode) {
    const ms = at - Date.now();
    if (mode === "status") return ms > 0 ? `in ${countdown(ms)}` : "Passed";
    return countdown(ms);
  }

  function weightOf(f) {
    const s = (DATA.shortWeights && DATA.shortWeights[f.id]) || [0, 0, 0];
    return [s[0], s[1], s[2], f.w[0], f.w[1], f.w[2]];
  }
  function defaultW() {
    const o = {};
    DATA.factors.forEach((f) => { o[f.id] = weightOf(f).slice(); });
    return o;
  }
  function netScore(ws, h) {
    let num = 0;
    let den = 0;
    DATA.factors.forEach((f) => {
      const w = ws[f.id][h];
      num += w * f.score;
      den += w * 5;
    });
    return den > 0 ? num / den : 0;
  }
  function normTail(x) {
    const z = Math.abs(x);
    const t = 1 / (1 + 0.2316419 * z);
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x >= 0 ? p : 1 - p;
  }
  function touchProb(k, hi) {
    const z = Math.log(k) / (DATA.vol.iv * Math.sqrt(T_YEARS[hi]));
    return Math.min(0.999, Math.max(1e-12, 2 * normTail(z)));
  }
  function barrier(t) {
    if (t === "x2") return 2;
    if (t === "x10") return 10;
    if (t === "x100") return 100;
    if (t === "top1") return APPLE_T / DATA.market.capT;
    return 1;
  }
  function prob(t, h, net) {
    if (h < 3) {
      const base = t === "rise" ? 0.5 : touchProb(barrier(t), h);
      return sig(logit(base) + KS * net);
    }
    return sig(logit(ANCHOR[t][h - 3]) + K * (net - NET0[h]));
  }
  function defaultProb(t, h) {
    return prob(t, h, NET0[h]);
  }
  function isCustom() {
    return DATA.factors.some((f) => weightOf(f).some((v, i) => state.weights[f.id][i] !== v));
  }
  function md(date) {
    return `${MON[Number(date.slice(5, 7)) - 1]} ${Number(date.slice(8, 10))}`;
  }
  function actualSeries() {
    const m = {};
    DATA.closes.forEach((c) => { m[c.date] = c.close; });
    DATA.history.forEach((e) => {
      if (m[e.priceDate] === undefined) m[e.priceDate] = e.price;
    });
    return Object.keys(m).sort().map((date) => ({ date, close: m[date] }));
  }
  function outcome(e, hi, t) {
    const after = actualSeries().filter((c) => c.date > e.priceDate);
    const n = SESSIONS[hi];
    if (t === "rise") {
      if (after.length < n) return { status: "pending", left: n - after.length };
      const c = after[n - 1];
      return { status: c.close > e.price ? "hit" : "miss", date: c.date, close: c.close };
    }
    const level = barrier(t) * e.price;
    const win = after.slice(0, n);
    const touch = win.find((c) => c.close >= level);
    if (touch) return { status: "hit", date: touch.date, close: touch.close };
    if (after.length < n) return { status: "pending", left: n - after.length };
    return { status: "miss", date: win[n - 1].date, close: win[n - 1].close };
  }
  function logWindow() {
    const actual = actualSeries();
    const first = actual.findIndex((c) => c.date >= DATA.history[0].priceDate);
    return actual.slice(Math.max(0, first - 20));
  }
  function current() {
    const net = netScore(state.weights, state.h);
    return { net, p: prob(state.target, state.h, net) };
  }
  function money2(v) {
    return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function money0(v) {
    return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  function caption(target, h) {
    const horizon = H_LABEL[h];
    const price = DATA.market.price;
    const px = money2(price);
    const note = DATA.market.changeNote;
    if (target === "rise") return `Chance SPCX is higher than today's price of $${px} (${note}) in ${horizon}`;
    if (target === "x2") return `Chance SPCX at least doubles from today's $${px} to $${money2(price * 2)} within ${horizon}`;
    if (target === "x10") return `Chance SPCX goes 10X from today's $${px} to $${money0(price * 10)} within ${horizon}`;
    if (target === "x100") return `Chance SPCX goes 100X from today's $${px} to $${money0(price * 100)} within ${horizon}`;
    const cap = `$${DATA.market.capT.toFixed(2)}T`;
    return `Chance SpaceX (today ${cap} market cap at $${px}) becomes the world's most valuable company at some point within ${horizon}`;
  }
  function scoreClass(score) {
    if (score > 0) return "bull";
    if (score < 0) return "bear";
    return "flat";
  }
  function scoreLabel(score) {
    if (score > 0) return `Bullish +${score}`;
    if (score < 0) return `Bearish ${score}`;
    return "Neutral 0";
  }
  function pullText(contrib) {
    const n = (contrib * 100).toFixed(1);
    return `Pull on meter ${contrib >= 0 ? "+" : ""}${n} pts`;
  }

  function route() {
    const raw = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (raw.startsWith("factor/")) {
      const id = raw.slice("factor/".length);
      const factor = DATA.factors.find((f) => f.id === id) || null;
      return { tab: "meter", factor, missing: !factor };
    }
    const known = TABS.some(([id]) => id === raw);
    return { tab: known ? raw : "meter", factor: null, missing: false };
  }

  function seg(options, current, attr, extraClass) {
    const cur = String(current);
    return `<div class="seg ${extraClass || ""}" role="group">${options.map((o) => `
      <button type="button" class="${o.value === cur ? "on" : ""}" data-${attr}="${esc(o.value)}" data-focus-key="${attr}-${esc(o.value)}" aria-pressed="${o.value === cur}">${esc(o.label)}</button>
    `).join("")}</div>`;
  }

  function linkCards(ids, numbered) {
    return `<div class="linkgrid">${ids.map((id, i) => {
      const l = LINKS[id];
      if (!l) return "";
      const meta = [l.site, l.date].filter(Boolean).join(" · ");
      return `<a class="linkcard" href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">
        ${numbered ? `<span class="lnum">${i + 1}</span>` : ""}
        <span class="lbody"><span class="ltitle">${esc(l.title)}</span>${meta ? `<span class="lmeta">${esc(meta)}</span>` : ""}</span>
        <span class="lgo" aria-hidden="true">↗</span>
      </a>`;
    }).join("")}</div>`;
  }

  function props(items) {
    return `<dl class="props">${items.map((it) => `<div><dt>${esc(it.label)}</dt><dd>${it.html || esc(it.value)}</dd></div>`).join("")}</dl>`;
  }

  function newsList(items) {
    return `<ul class="rows">${items.map((r) => `
      <li>
        <span class="lead">${esc(r.lead)}</span>
        <span class="rtitle">${esc(r.title)}</span>
        <span class="rmeta">${esc(r.meta)}</span>
      </li>`).join("")}</ul>`;
  }

  function table(columns, rows, emphasis) {
    return `<div class="table-scroll"><table>
      <thead><tr>${columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr class="${i === emphasis ? "emph" : ""}">${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>`;
  }

  function hBars(items, emphasis, scale) {
    const max = scale || Math.max(...items.map((i) => i.value), 0.0001);
    return `<div class="hbars">${items.map((it, i) => {
      const pct = Math.max(0, Math.min(100, (it.value / max) * 100));
      return `<div class="hbar ${i === emphasis ? "emph" : ""}">
        <div class="hbar-name">${esc(it.label)}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%"></div></div>
        <div class="hbar-val">${esc(it.display)}</div>
      </div>`;
    }).join("")}</div>`;
  }

  function fmtSubs(v) { return `${v.toFixed(1)}M`; }
  function fmtMoneyB(v) { return v >= 1000 ? `$${(v / 1000).toFixed(2)}T` : `$${v}B`; }
  function fmtMcap(v) { return `$${v.toFixed(2)}T`; }
  function fmtRev(v) { return `$${v.toFixed(1)}B`; }

  function lineChart(spec, format) {
    const W = 720;
    const H = 330;
    const pad = { l: 78, r: 36, t: 36, b: 42 };
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const pts = spec.points;
    const n = pts.length;
    const yOf = (v) => pad.t + (1 - (v - spec.floor) / (spec.ceiling - spec.floor)) * ih;
    const xOf = (i) => pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
    let grid = "";
    for (let i = 0; i <= 4; i++) {
      const val = spec.floor + ((spec.ceiling - spec.floor) * i) / 4;
      const y = yOf(val);
      grid += `<line x1="${pad.l}" y1="${y.toFixed(1)}" x2="${W - pad.r}" y2="${y.toFixed(1)}" class="grid"/>`;
      grid += `<text x="${pad.l - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="axis">${esc(format(val))}</text>`;
    }
    const d = pts.map((p, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)},${yOf(p.value).toFixed(1)}`).join(" ");
    const area = `${d} L${xOf(n - 1).toFixed(1)},${yOf(spec.floor).toFixed(1)} L${xOf(0).toFixed(1)},${yOf(spec.floor).toFixed(1)} Z`;
    const dots = pts.map((p, i) => {
      const x = xOf(i);
      const y = yOf(p.value);
      const title = `${p.label ? p.label + ": " : ""}${format(p.value)}`;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" class="dot"><title>${esc(title)}</title></circle>`;
    }).join("");
    const labels = pts.map((p, i) => {
      if (!p.label) return "";
      const x = xOf(i);
      const y = H - 16;
      return `<text x="${x.toFixed(1)}" y="${y}" text-anchor="middle" class="axis xlab">${esc(p.label)}</text>`;
    }).join("");
    const anns = (spec.annotations || []).map((a, idx) => {
      const x = xOf(a.at);
      const y = 16 + (idx % 2) * 14;
      return `<line x1="${x.toFixed(1)}" y1="${pad.t}" x2="${x.toFixed(1)}" y2="${(pad.t + ih).toFixed(1)}" class="ann"/>
        <text x="${(x + 4).toFixed(1)}" y="${y}" class="ann-label">${esc(a.label)}</text>`;
    }).join("");
    const aria = `${spec.label}. ${pts.filter((p) => p.label).map((p) => `${p.label} ${format(p.value)}`).join(", ")}`;
    return `<figure class="chart"><figcaption>${esc(spec.label)}</figcaption>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">${grid}${anns}<path d="${area}" class="area"/><path d="${d}" class="line"/>${dots}${labels}</svg>
    </figure>`;
  }

  function columnChart(spec) {
    const W = 720;
    const H = 330;
    const pad = { l: 78, r: 16, t: 28, b: 46 };
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const all = spec.series.flatMap((s) => s.values);
    let min = Math.min(0, ...all);
    let max = Math.max(0, ...all);
    const span = (max - min) || 1;
    min -= span * 0.08;
    max += span * 0.16;
    const yOf = (v) => pad.t + (1 - (v - min) / (max - min)) * ih;
    const y0 = yOf(0);
    const gap = iw / spec.labels.length;
    const barW = Math.min(26, gap * 0.26);
    let grid = "";
    for (let i = 0; i <= 4; i++) {
      const val = min + ((max - min) * i) / 4;
      const y = yOf(val);
      grid += `<line x1="${pad.l}" y1="${y.toFixed(1)}" x2="${W - pad.r}" y2="${y.toFixed(1)}" class="grid"/>`;
      grid += `<text x="${pad.l - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="axis">${esc(fmtRev(val))}</text>`;
    }
    grid += `<line x1="${pad.l}" y1="${y0.toFixed(1)}" x2="${W - pad.r}" y2="${y0.toFixed(1)}" class="zero"/>`;
    let bars = "";
    let labels = "";
    spec.labels.forEach((lab, i) => {
      const cx = pad.l + gap * (i + 0.5);
      labels += `<text x="${cx.toFixed(1)}" y="${H - 16}" text-anchor="middle" class="axis">${esc(lab)}</text>`;
      spec.series.forEach((s, si) => {
        const v = s.values[i];
        const x = cx + (si - (spec.series.length - 1) / 2) * (barW + 8) - barW / 2;
        const y = yOf(v);
        const top = Math.min(y, y0);
        const h = Math.max(1.5, Math.abs(y - y0));
        const tone = si === 0 ? "s0" : v < 0 ? "sneg" : "s1";
        bars += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${barW}" height="${h.toFixed(1)}" rx="3" class="bar ${tone}"><title>${esc(s.name)}: ${esc(fmtRev(v))}</title></rect>`;
        const ly = v >= 0 ? top - 6 : top + h + 13;
        bars += `<text x="${(x + barW / 2).toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" class="barlab">${esc(fmtRev(v))}</text>`;
      });
    });
    const legend = `<div class="legend"><span class="leg"><i class="s0"></i>Revenue</span><span class="leg"><i class="s1"></i>Net income</span></div>`;
    const aria = spec.labels.map((lab, i) => `${lab}: revenue ${fmtRev(spec.series[0].values[i])}, net income ${fmtRev(spec.series[1].values[i])}`).join(". ");
    return `<figure class="chart">${legend}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">${grid}${bars}${labels}</svg></figure>`;
  }

  function chartFor(kind) {
    if (kind === "subs") return lineChart(DATA.charts.subs, fmtSubs);
    if (kind === "revenue") return columnChart(DATA.charts.revenue);
    if (kind === "valuation") return lineChart(DATA.charts.valuation, fmtMoneyB);
    if (kind === "mcap") return lineChart(DATA.charts.mcap, fmtMcap);
    if (kind === "price") return priceDrillChart();
    return "";
  }

  function priceDrillChart() {
    const actual = actualSeries();
    const points = actual.map((c, i) => ({
      label: i === 0 || i === actual.length - 1 || i % 7 === 0 ? md(c.date) : "",
      value: c.close,
    }));
    return lineChart({
      label: "SPCX daily close",
      floor: 100,
      ceiling: 180,
      points,
      annotations: [
        { at: Math.max(0, actual.findIndex((c) => c.date === "2026-10-22")), label: "Unlock" },
        { at: Math.max(0, actual.findIndex((c) => c.date === "2026-11-05")), label: "Midterms" },
      ],
    }, (v) => `$${v.toFixed(2)}`);
  }

  function gaugeSvg(p) {
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const a = Math.PI * (1 - t);
      const x = 200 + 188 * Math.cos(a);
      const y = 214 - 188 * Math.sin(a) + (t === 0 || t === 1 ? 18 : 0);
      const anchor = t === 0 ? "start" : t === 1 ? "end" : "middle";
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" class="gauge-tick">${t * 100}%</text>`;
    }).join("");
    const cap = caption(state.target, state.h);
    return `<svg id="gauge" viewBox="0 0 400 256" role="img" aria-label="${esc(cap)}: ${esc(fmtP(p))}">
      <path id="gauge-track" d="M 40 210 A 160 160 0 0 1 360 210"/>
      <path id="gauge-arc" data-tone="bad" d="M 40 210 A 160 160 0 0 1 360 210" stroke-dasharray="502.65" stroke-dashoffset="502.65"/>
      ${ticks}
      <g id="gauge-needle" transform="rotate(-90 200 210)"><line x1="200" y1="210" x2="200" y2="78"/></g>
      <circle id="gauge-hub" cx="200" cy="210" r="10"/>
      <text id="gauge-readout" class="gauge-readout" x="200" y="158" text-anchor="middle">${esc(fmtP(p))}</text>
      <text id="gauge-sub" class="gauge-sub" x="200" y="246" text-anchor="middle"></text>
    </svg>`;
  }

  function drawGauge(shown, p) {
    const arc = document.getElementById("gauge-arc");
    const needle = document.getElementById("gauge-needle");
    const readout = document.getElementById("gauge-readout");
    const sub = document.getElementById("gauge-sub");
    const svg = document.getElementById("gauge");
    if (!arc || !needle) return;
    const len = arc.getTotalLength() || Math.PI * 160;
    const v = Math.max(0, Math.min(1, shown));
    const vis = Math.max(0.004, v);
    arc.style.strokeDasharray = String(len);
    arc.style.strokeDashoffset = String(len * (1 - vis));
    arc.dataset.tone = v >= 0.55 ? "good" : v >= 0.35 ? "warn" : "bad";
    needle.setAttribute("transform", `rotate(${(-90 + 180 * v).toFixed(2)} 200 210)`);
    const { net } = current();
    readout.textContent = fmtP(p);
    sub.textContent = state.target === "rise"
      ? `Falls: ${fmtP(1 - p)}`
      : `Net factor score ${(net * 100).toFixed(0)} of ±100`;
    svg.setAttribute("aria-label", `${caption(state.target, state.h)}: ${fmtP(p)}`);
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function kickGauge(p) {
    const arc = document.getElementById("gauge-arc");
    if (!arc) return;
    const token = ++gaugeToken;
    const from = visualShown;
    const to = p;
    drawGauge(from, p);
    if (reduceMotion || Math.abs(to - from) < 0.0005) {
      visualShown = to;
      drawGauge(to, p);
      return;
    }
    const t0 = performance.now();
    const dur = 1400;
    const step = (now) => {
      if (token !== gaugeToken) return;
      const t = Math.min(1, (now - t0) / dur);
      const v = from + (to - from) * easeOut(t);
      visualShown = v;
      drawGauge(v, p);
      if (t < 1) requestAnimationFrame(step);
      else { visualShown = to; drawGauge(to, p); }
    };
    setTimeout(() => { if (token === gaugeToken) requestAnimationFrame(step); }, 80);
  }

  function factorCard(f, den) {
    const w = state.weights[f.id][state.h];
    const contrib = den > 0 ? (w * f.score) / den : 0;
    const pct = (Math.abs(f.score) / 5) * 50;
    const left = f.score >= 0 ? 50 : 50 - pct;
    const tone = scoreClass(f.score);
    return `<article class="factor" data-factor="${esc(f.id)}" data-tone="${tone}" style="opacity:${w === 0 ? 0.5 : 1}">
      <button type="button" class="hit" data-open="${esc(f.id)}">
        <span class="fhead"><span class="fname">${esc(f.name)}</span><span class="fscore ${tone}">${esc(scoreLabel(f.score))}</span></span>
        <span class="fkind">${esc(f.link)} · ${esc(f.group)}</span>
        <span class="scorebar" aria-hidden="true"><span class="mid"></span><span class="fill ${tone}" style="left:${left}%;width:${pct}%"></span></span>
        <span class="fline">${esc(f.line)}</span>
        <span class="fmeta"><span class="w-val">Weight ${w.toFixed(1)}</span><span class="pull-val">${esc(pullText(contrib))}</span></span>
      </button>
      ${state.adjust ? `<input type="range" min="0" max="5" step="0.5" value="${w}" data-weight="${esc(f.id)}" aria-label="Weight for ${esc(f.name)}">` : ""}
    </article>`;
  }

  function factorBoard(items) {
    let den = 0;
    DATA.factors.forEach((f) => { den += state.weights[f.id][state.h] * 5; });
    return `<div class="factor-grid">${items.map((f) => factorCard(f, den)).join("")}</div>`;
  }

  function meterView() {
    const { p } = current();
    const custom = isCustom();
    const note = custom
      ? `Your weights move the reading from my default of ${fmtP(defaultProb(state.target, state.h))}.`
      : "Tap a factor below for the why, metrics, news and sources.";
    const m = DATA.market;
    const at = Date.parse(m.nextCatalyst.at);
    const changeTone = String(m.change).startsWith("+") ? "good" : "bad";
    const internal = DATA.factors.filter((f) => f.group === "Internal driver");
    const external = DATA.factors.filter((f) => f.group === "External influence");
    const anchorRows = TARGETS.map((t) => [
      esc(t.id === "rise" ? `Price above $${m.price}` : t.row),
      ...H_KEYS.map((_, i) => esc(fmtP(defaultProb(t.id, i)))),
    ]);
    const usd = m.changeUsd;
    const dayChange = `${usd >= 0 ? "+" : "-"}$${Math.abs(usd).toFixed(2)} (${m.change})`;
    return `<section class="section">
      <h2 id="chance-heading">${esc(caption(state.target, state.h))}</h2>
      <p class="caption">Opinion-based model, not advice. Updated ${esc(DATA.updated)}.</p>
      <div class="meter-grid">
        <div class="panel gauge-panel">${gaugeSvg(p)}</div>
        <div class="panel controls">
          <h3>Model controls</h3>
          ${seg(H_SHORT.map((label, i) => ({ value: String(i), label })), state.h, "h")}
          ${seg(TARGETS.map((t) => ({ value: t.id, label: t.label })), state.target, "target")}
          <label class="switch"><input type="checkbox" id="adjust" ${state.adjust ? "checked" : ""}><span class="track"><span class="knob"></span></span><span>Adjust factor weights</span></label>
          <button type="button" class="btn" id="reset-weights" ${custom ? "" : "hidden"}>Reset weights</button>
          <p class="note" id="weight-note">${esc(note)}</p>
        </div>
      </div>
      <h3 class="spark-title">This reading over time: ${esc(TARGETS.find((t) => t.id === state.target).label)}, ${esc(H_SHORT[state.h])}</h3>
      ${sparkline()}
      <p class="kicker">SPCX now, and the next event that can move it:</p>
      <div class="kpis">
        <article class="kpi"><span class="val">$${esc(m.price)}</span><span class="lbl">SPCX price</span><span class="sub">${esc(m.changeNote)}</span></article>
        <article class="kpi"><span class="val">$${m.capT.toFixed(2)}T</span><span class="lbl">Market cap</span><span class="sub">World #6\u20137</span></article>
        <article class="kpi"><span class="val val-long ${changeTone}">${esc(dayChange)}</span><span class="lbl">Day change</span></article>
        <article class="kpi"><span class="val" data-countdown="${at}">${esc(countdown(at - Date.now()))}</span><span class="lbl">${esc(m.nextCatalyst.name)}</span><span class="sub">${esc(m.nextCatalyst.when)}</span></article>
      </div>
    </section>
    <section class="section">
      <h2>Internal drivers</h2>
      <p class="caption">What SpaceX itself owns or builds. Score: -5 very bearish to +5 very bullish.</p>
      ${factorBoard(internal)}
    </section>
    <section class="section">
      <h2>External influences</h2>
      <p class="caption">Forces outside SpaceX's control that still move the stock.</p>
      ${factorBoard(external)}
    </section>
    <details class="how" id="how">
      <summary>How the meter works</summary>
      <p>Each factor has a score from -5 to +5 and a weight per horizon. The net score is the weighted average, scaled to ±100. For 1y, 5y and 10y I set a default probability by judgment at today's scores; changing weights shifts its log-odds by 4 times the change in net score.</p>
      <p>For 1d, 1w and 1m the rise reading starts at 50/50 and shifts by 1 times the net score, so it stays near a coin flip. Momentum, sentiment, rates, catalysts and X mood carry most weight there. The 2X, 10X, 100X and #1 targets use the chance of touching that price at SPCX's options-implied volatility of ${(DATA.vol.iv * 100).toFixed(1)}% (flowmonkey.net, Nov 9 close; 20-day realized ${(DATA.vol.rv20 * 100).toFixed(1)}%), with zero drift. #1 means passing Apple's $5.10T, about ${(APPLE_T / m.capT).toFixed(2)}x today.</p>
      ${table(["Target", ...H_SHORT], anchorRows)}
    </details>`;
  }

  function factorView(f) {
    const w = state.weights[f.id][state.h];
    const tone = scoreClass(f.score);
    const lead = f.score > 0 ? "Bullish" : f.score < 0 ? "Bearish" : "Neutral";
    const marker = f.score > 0 ? "pro" : f.score < 0 ? "con" : "dot";
    const scoreBit = `${f.score > 0 ? "+" : ""}${f.score}`;
    const chart = f.chart !== "none" ? chartFor(f.chart) : "";
    const metrics = props(f.metrics);
    return `<button type="button" class="back" data-back>← Back to the meter</button>
      <section class="section">
        <h2>${esc(f.name)}</h2>
        <p class="caption">${esc(f.link)} · ${esc(f.group)} · score ${esc(scoreBit)} · weight ${w.toFixed(1)} at ${H_SHORT[state.h]}</p>
        <div class="callout ${tone}"><strong class="${tone}">${lead}</strong><span>${esc(f.line)}</span></div>
        <h3>Why</h3>
        <ul class="why ${marker}">${f.why.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        ${chart ? `<div class="split">${metrics}${chart}</div>` : metrics}
        ${f.news.length ? `<h3>Recent news</h3>${newsList(f.news)}` : ""}
        <h3>Sources</h3>
        ${linkCards(f.links, false)}
      </section>`;
  }

  function thesisView() {
    const bars = hBars(
      DATA.pillars.map((p) => ({ label: p.name, value: p.conf, display: `${p.conf}%` })),
      DATA.pillars.length - 1,
      100,
    );
    const pl = DATA.pillars.find((p) => p.key === state.pillar) || DATA.pillars[0];
    const confTone = pl.conf >= 60 ? "good" : pl.conf >= 40 ? "warn" : "bad";
    return `<section class="section">
      <h2>Your thesis: the full stack makes SpaceX the most valuable company ever</h2>
      <p class="caption">Confidence is my opinion, as of 10 Nov 2026.</p>
      ${bars}
      <p>Fair read: launch and Starlink are proven and owned. Own chips and orbital compute are plans with hard dates still years out, so the full stack is half real today.</p>
    </section>
    <section class="section">
      <h2>Pillar detail</h2>
      ${seg(DATA.pillars.map((p) => ({ value: p.key, label: p.name })), state.pillar, "pillar", "stack")}
      ${props([
        { label: "Status", html: `<span class="status ${esc(pl.tone)}">${esc(pl.status)}</span>` },
        { label: "Confidence", html: `<span class="conf"><span class="conf-track"><span class="conf-fill ${confTone}" style="width:${pl.conf}%"></span></span><span class="conf-n">${pl.conf}%</span></span>` },
      ])}
      <div class="procon">
        <div><h3>Evidence for</h3><ul class="why pro">${pl.for.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div><h3>Evidence against</h3><ul class="why con">${pl.against.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      </div>
    </section>`;
  }

  function ecosystemView() {
    const rows = DATA.ecosystem.map((r) => [
      esc(r.item),
      `<span class="status ${esc(r.tone)}">${esc(r.type)}</span>`,
      esc(r.facts),
      esc(r.effect),
    ]);
    return `<section class="section">
      <h2>Musk ecosystem and synergies</h2>
      <p class="caption">Direct = owned by SpaceX. Shared = joint venture with Tesla. Indirect = another company; reaches SpaceX via supply, contracts, shared tech, or Musk's attention and capital.</p>
      ${table(["Item", "Type", "Sourced facts", "Effect on SpaceX"], rows)}
      <div style="height:14px"></div>
      ${linkCards(DATA.ecosystemLinks, false)}
    </section>`;
  }

  function scenariosView() {
    const m = Number(state.mult);
    const targetCap = DATA.market.capT * m;
    const price = (DATA.market.price * m).toLocaleString("en-US", { maximumFractionDigits: 0 });
    const facts = [
      { label: "Target market cap", value: fmtT(targetCap) },
      { label: "Share price, no dilution", value: `$${price}` },
      { label: "Cap needed with 2%/yr dilution over 10 years", value: fmtT(targetCap * 1.219) },
      { label: "Versus Apple ($5.10T)", value: `${(targetCap / 5.096).toFixed(1)}x Apple` },
      { label: "Versus 2026 world GDP ($128.0T)", value: `${((targetCap / 128.004) * 100).toFixed(1)}%` },
      { label: "Revenue needed at 10x sales", value: fmtT(targetCap / 10) },
    ];
    const bars = [
      { label: `SpaceX at ${state.mult}X`, value: targetCap, display: fmtT(targetCap) },
      { label: "World GDP 2026", value: 128.0, display: "$128.0T" },
      { label: "Apple", value: 5.096, display: "$5.10T" },
      { label: "Nvidia", value: 4.306, display: "$4.31T" },
      { label: "Microsoft", value: 4.0, display: "$4.0T" },
      { label: "SpaceX today", value: DATA.market.capT, display: "$1.93T" },
      { label: "Tesla", value: 1.494, display: "$1.49T" },
    ].sort((a, b) => b.value - a.value);
    const rows = DATA.scenarios.map((s) => [esc(s.name), esc(s.cap), esc(s.multiple), esc(s.probability)]);
    return `<section class="section">
      <h2>Valuation history</h2>
      <p class="caption">$B. Private marks to Feb 2026 (SpaceX plus xAI), then month-end public market cap.</p>
      ${chartFor("valuation")}
    </section>
    <section class="section">
      <h2>What a multiple means</h2>
      <p class="caption">Comparison caps: Nov 9 2026 closes. World GDP: IMF, 2026 nominal.</p>
      ${seg(["2", "10", "100", "1000"].map((x) => ({ value: x, label: `${x}X` })), state.mult, "mult")}
      <div class="split" style="margin-top:14px">${props(facts)}${hBars(bars)}</div>
    </section>
    <section class="section">
      <h2>Ten-year scenarios (opinion)</h2>
      ${table(["Scenario", "Market cap 2036", "Multiple", "Probability"], rows, 1)}
    </section>`;
  }

  function todayView() {
    return `<section class="section">
      <h2>What changed today</h2>
      <p class="caption">${esc(DATA.updated)}</p>
      ${newsList(DATA.today)}
      <div style="height:14px"></div>
      ${linkCards(DATA.todayLinks, false)}
    </section>`;
  }

  function catalystsView() {
    const sorted = DATA.catalysts.slice().sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const list = `<ul class="rows">${sorted.map((c) => {
      const at = Date.parse(c.at);
      return `<li>
        <span class="lead">${esc(c.label)}</span>
        <span class="rtitle">${esc(c.title)}</span>
        <span class="rmeta">${esc(c.meta)}</span>
        <span class="rpill" data-countdown="${at}" data-countdown-mode="status">${esc(countdownText(at, "status"))}</span>
      </li>`;
    }).join("")}</ul>`;
    return `<section class="section">
      <h2>Coming up</h2>
      <p class="caption">Countdowns from now; dates are company or press targets and often slip.</p>
      ${list}
    </section>`;
  }

  function sparkline() {
    const win = logWindow();
    const n = win.length;
    const W0 = 600;
    const H0 = 84;
    const xAt = (i) => (n <= 1 ? W0 / 2 : 40 + (i * (W0 - 80)) / (n - 1));
    const lo = Math.min(...win.map((c) => c.close));
    const hiC = Math.max(...win.map((c) => c.close));
    const yC = (v) => 60 - ((v - lo) / (hiC - lo || 1)) * 44;
    const key = H_KEYS[state.h];
    const pMax = state.target === "rise" ? 1 : Math.max(0.01, ...DATA.history.map((e) => e.readings[key][state.target] * 1.3));
    const yP = (p) => 60 - (Math.min(p, pMax) / pMax) * 44;
    const pts = DATA.history.map((e) => ({
      x: xAt(win.findIndex((c) => c.date === e.priceDate)),
      p: e.readings[key][state.target],
      o: outcome(e, state.h, state.target),
    }));
    const last = pts[pts.length - 1];
    const closeLine = n > 1 ? `<polyline points="${win.map((c, i) => `${xAt(i).toFixed(1)},${yC(c.close).toFixed(1)}`).join(" ")}" class="spark-close"/>` : "";
    const readLine = pts.length > 1 ? `<polyline points="${pts.map((z) => `${z.x.toFixed(1)},${yP(z.p).toFixed(1)}`).join(" ")}" class="spark-read"/>` : "";
    const dots = pts.map((z) => {
      const ring = z.o.status === "pending"
        ? `<circle cx="${z.x.toFixed(1)}" cy="${yP(z.p).toFixed(1)}" r="9" class="spark-pending"/>`
        : `<circle cx="${z.x.toFixed(1)}" cy="${z.o.status === "hit" ? 16 : 60}" r="5" class="spark-out ${z.o.status}"/>`;
      return `<g><circle cx="${z.x.toFixed(1)}" cy="${yP(z.p).toFixed(1)}" r="5" class="spark-read-dot"/>${ring}</g>`;
    }).join("");
    return `<button type="button" class="spark" data-tab="history">
      <svg viewBox="0 0 ${W0} ${H0}" role="img" aria-label="Reading history with actual SPCX close">
        <line x1="40" x2="${W0 - 40}" y1="60" y2="60" class="spark-base"/>
        ${closeLine}${readLine}${dots}
        <text x="${(last.x - 12).toFixed(1)}" y="${(yP(last.p) - 12).toFixed(1)}" text-anchor="end" class="spark-val">${esc(fmtP(last.p))} · ${last.o.status === "pending" ? "pending" : esc(last.o.status)}</text>
        <text x="40" y="80" class="spark-date">${esc(md(win[0].date))}</text>
        <text x="${W0 - 40}" y="80" text-anchor="end" class="spark-date">Reading and real SPCX close · ${esc(md(win[n - 1].date))}</text>
      </svg>
    </button>`;
  }

  function predictionChart() {
    const win = logWindow();
    const n = win.length;
    const W0 = 1200;
    const H0 = 330;
    const L0 = 70;
    const R0 = 80;
    const T0 = 28;
    const B0 = 40;
    const pw = W0 - L0 - R0;
    const ph = H0 - T0 - B0;
    const xAt = (i) => L0 + (n <= 1 ? pw / 2 : (i * pw) / (n - 1));
    const key = H_KEYS[state.h];
    const pMax = state.target === "rise" ? 1 : Math.max(0.01, ...DATA.history.map((e) => e.readings[key][state.target] * 1.3));
    const yP = (p) => T0 + ph - (Math.min(p, pMax) / pMax) * ph;
    const lo = Math.min(...win.map((c) => c.close)) * 0.97;
    const hiC = Math.max(...win.map((c) => c.close)) * 1.03;
    const yC = (v) => T0 + ph - ((v - lo) / (hiC - lo)) * ph;
    const iLog = Math.max(0, win.findIndex((c) => c.date === DATA.history[0].priceDate));
    const ticks = n <= 6 ? win.map((_, i) => i) : [0, 1, 2, 3, 4, 5].map((k) => Math.round((k * (n - 1)) / 5));
    const pts = DATA.history.map((e) => ({
      x: xAt(Math.max(0, win.findIndex((c) => c.date === e.priceDate))),
      p: e.readings[key][state.target],
      o: outcome(e, state.h, state.target),
    }));
    const grid = [0, 0.5, 1].map((f) => `
      <line x1="${L0}" x2="${W0 - R0}" y1="${yP(f * pMax).toFixed(1)}" y2="${yP(f * pMax).toFixed(1)}" class="grid"/>
      <text x="${L0 - 10}" y="${(yP(f * pMax) + 4).toFixed(1)}" text-anchor="end" class="axis">${esc(fmtP(f * pMax))}</text>
      <text x="${W0 - R0 + 10}" y="${(yC(lo + f * (hiC - lo)) + 4).toFixed(1)}" class="axis">$${Math.round(lo + f * (hiC - lo))}</text>`).join("");
    const marks = pts.map((z) => {
      const stem = z.o.status !== "pending"
        ? `<line x1="${z.x.toFixed(1)}" x2="${z.x.toFixed(1)}" y1="${yP(z.p).toFixed(1)}" y2="${(z.o.status === "hit" ? yP(pMax) : yP(0)).toFixed(1)}" class="ann"/>`
        : "";
      const out = z.o.status === "pending"
        ? `<circle cx="${z.x.toFixed(1)}" cy="${yP(z.p).toFixed(1)}" r="12" class="spark-pending"/>`
        : `<circle cx="${z.x.toFixed(1)}" cy="${(z.o.status === "hit" ? yP(pMax) : yP(0)).toFixed(1)}" r="7" class="out-dot ${z.o.status}"/>`;
      return `<g>${stem}<circle cx="${z.x.toFixed(1)}" cy="${yP(z.p).toFixed(1)}" r="6" class="spark-read-dot"/>${out}</g>`;
    }).join("");
    const pending = pts.length && pts[pts.length - 1].o.status === "pending"
      ? `<text x="${(pts[pts.length - 1].x + 16).toFixed(1)}" y="${(yP(pts[pts.length - 1].p) + 4).toFixed(1)}" class="axis">${esc(fmtP(pts[pts.length - 1].p))} · pending, ${pts[pts.length - 1].o.left} sessions left</text>`
      : "";
    const readLine = pts.length > 1 ? `<polyline points="${pts.map((z) => `${z.x.toFixed(1)},${yP(z.p).toFixed(1)}`).join(" ")}" class="spark-read" stroke-width="3"/>` : "";
    return `<svg viewBox="0 0 ${W0} ${H0}" role="img" aria-label="Model readings, realized outcomes and actual SPCX close">
      ${grid}
      <polyline points="${win.map((c, i) => `${xAt(i).toFixed(1)},${yC(c.close).toFixed(1)}`).join(" ")}" class="spark-close" stroke-width="2.5"/>
      <line x1="${xAt(iLog).toFixed(1)}" x2="${xAt(iLog).toFixed(1)}" y1="${T0}" y2="${T0 + ph}" class="ann"/>
      <text x="${(xAt(iLog) - 8).toFixed(1)}" y="${T0 - 10}" text-anchor="end" class="axis">Prediction log starts</text>
      ${readLine}${marks}${pending}
      ${ticks.map((i) => `<text x="${xAt(i).toFixed(1)}" y="${H0 - 12}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}" class="axis">${esc(md(win[i].date))}</text>`).join("")}
    </svg>`;
  }

  function fullPriceChart() {
    const data = actualSeries();
    const n = data.length;
    const W0 = 1200;
    const H0 = 360;
    const L0 = 70;
    const R0 = 190;
    const T0 = 28;
    const B0 = 40;
    const pw = W0 - L0 - R0;
    const ph = H0 - T0 - B0;
    const maxC = Math.max(...data.map((c) => c.close));
    const minC = Math.min(...data.map((c) => c.close));
    const ref = DATA.history[DATA.history.length - 1].price;
    const names = { x2: "2X", x10: "10X", x100: "100X", top1: "#1 company (price proxy)" };
    const levels = [
      { label: "IPO price $135", v: 135 },
      ...["x2", "top1", "x10", "x100"].map((t) => ({
        label: `${names[t]} $${Math.round(barrier(t) * ref).toLocaleString("en-US")}`,
        v: barrier(t) * ref,
      })),
    ];
    const fits = levels.filter((l) => l.v <= maxC * 2.5);
    const off = levels.filter((l) => l.v > maxC * 2.5);
    const top = Math.max(maxC, ...fits.map((l) => l.v)) * 1.05;
    const bot = Math.min(minC, ...fits.map((l) => l.v)) * 0.92;
    const xAt = (i) => L0 + (n <= 1 ? pw / 2 : (i * pw) / (n - 1));
    const y = (v) => T0 + ph - ((v - bot) / (top - bot)) * ph;
    const iLog = Math.max(0, data.findIndex((c) => c.date === DATA.history[0].priceDate));
    const ticks = [0, 1, 2, 3, 4, 5].map((k) => Math.round((k * (n - 1)) / 5));
    const yt = [0, 0.25, 0.5, 0.75, 1].map((f) => bot + f * (top - bot));
    const guides = fits.map((l) => `
      <line x1="${L0}" x2="${L0 + pw}" y1="${y(l.v).toFixed(1)}" y2="${y(l.v).toFixed(1)}" class="guide"/>
      <text x="${L0 + pw + 8}" y="${(y(l.v) + 4).toFixed(1)}" class="guide-label">${esc(l.label)}</text>`).join("");
    const logs = DATA.history.map((e, i) => {
      const j = data.findIndex((c) => c.date === e.priceDate);
      const label = i === DATA.history.length - 1
        ? `<text x="${(xAt(j) - 10).toFixed(1)}" y="${(y(e.price) - 12).toFixed(1)}" text-anchor="end" class="spark-val">Logged $${e.price.toFixed(2)}</text>`
        : "";
      return `<g><circle cx="${xAt(j).toFixed(1)}" cy="${y(e.price).toFixed(1)}" r="6" class="spark-close-dot"/>${label}</g>`;
    }).join("");
    return `<svg viewBox="0 0 ${W0} ${H0}" role="img" aria-label="Actual SPCX daily close with logged prices and target levels">
      ${yt.map((v) => `<g><line x1="${L0}" x2="${L0 + pw}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="grid"/><text x="${L0 - 10}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" class="axis">$${Math.round(v)}</text></g>`).join("")}
      ${guides}
      <polyline points="${data.map((c, i) => `${xAt(i).toFixed(1)},${y(c.close).toFixed(1)}`).join(" ")}" class="spark-read" stroke-width="2.5"/>
      <line x1="${xAt(iLog).toFixed(1)}" x2="${xAt(iLog).toFixed(1)}" y1="${T0}" y2="${T0 + ph}" class="ann"/>
      <text x="${(xAt(iLog) - 8).toFixed(1)}" y="${T0 - 10}" text-anchor="end" class="axis">Prediction log starts</text>
      ${logs}
      ${ticks.map((i) => `<text x="${xAt(i).toFixed(1)}" y="${H0 - 12}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}" class="axis">${esc(md(data[i].date))}</text>`).join("")}
      ${off.length ? `<text x="${L0 + 8}" y="${T0 + 14}" class="axis">Off scale: ${esc(off.map((l) => l.label).join(" · "))}</text>` : ""}
    </svg>`;
  }

  function callMark(e, hi) {
    const p = e.readings[H_KEYS[hi]].rise;
    const o = outcome(e, hi, "rise");
    if (o.status === "pending") return { status: "pending", p, left: o.left };
    const right = (p > 0.5) === (o.status === "hit");
    return { status: right ? "right" : "wrong", p, left: 0 };
  }

  function layoutChart(spec) {
    const closes = spec.closes;
    const n = closes.length;
    const W = 1100;
    const H = 340;
    const L = 52;
    const R = 56;
    const T = 16;
    const B = 34;
    const pw = W - L - R;
    const ph = H - T - B;
    const xAt = (i) => L + (n <= 1 ? pw / 2 : (i * pw) / Math.max(1, n - 1));
    const yP = (v) => T + ph - ((v - spec.pMin) / (spec.pMax - spec.pMin)) * ph;
    const yC = (v) => T + ph - ((v - spec.cMin) / (spec.cMax - spec.cMin)) * ph;
    const idx = new Map(closes.map((c, i) => [c.date, i]));
    const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const pv = spec.pMin + f * (spec.pMax - spec.pMin);
      const cv = spec.cMin + f * (spec.cMax - spec.cMin);
      const y = yP(pv);
      return `<line x1="${L}" x2="${L + pw}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="grid"/>
        <text x="${L - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="axis">${esc(spec.pFmt(pv))}</text>
        <text x="${L + pw + 8}" y="${(yC(cv) + 4).toFixed(1)}" class="axis">${esc(spec.cFmt(cv))}</text>`;
    }).join("");
    const price = spec.price === false || n < 2
      ? ""
      : `<polyline points="${closes.map((c, i) => `${xAt(i).toFixed(1)},${yC(c.close).toFixed(1)}`).join(" ")}" class="hc-price"/>`;
    const guides = (spec.guides || []).map((g) => {
      const y = g.axis === "p" ? yP(g.value) : yC(g.value);
      if (g.value < (g.axis === "p" ? spec.pMin : spec.cMin) || g.value > (g.axis === "p" ? spec.pMax : spec.cMax)) return "";
      return `<line x1="${L}" x2="${L + pw}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="hc-guide"/>
        ${g.label ? `<text x="${L + pw - 4}" y="${(y - 4).toFixed(1)}" text-anchor="end" class="hc-guide-label">${esc(g.label)}</text>` : ""}`;
    }).join("");
    const lines = (spec.lines || []).map((line) => {
      const pts = line.points.filter((p) => idx.has(p.date));
      if (pts.length < 2) return "";
      return `<polyline points="${pts.map((p) => `${xAt(idx.get(p.date)).toFixed(1)},${yP(p.value).toFixed(1)}`).join(" ")}" class="${line.cls}"/>`;
    }).join("");
    const dots = (spec.dots || []).map((d) => {
      if (!idx.has(d.date)) return "";
      const x = xAt(idx.get(d.date));
      const y = yP(d.value);
      if (d.kind === "pending") return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" class="hc-read-dot"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" class="hc-pending"><title>${esc(d.title || "")}</title></circle>`;
      if (d.kind === "right") return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" class="hc-right"><title>${esc(d.title || "")}</title></circle>`;
      if (d.kind === "wrong") return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" class="hc-wrong"><title>${esc(d.title || "")}</title></circle>`;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" class="${d.cls}"><title>${esc(d.title || "")}</title></circle>`;
    }).join("");
    const step = Math.max(1, Math.round((n - 1) / 5));
    const tickIdx = [];
    for (let i = 0; i < n; i += step) tickIdx.push(i);
    if (tickIdx[tickIdx.length - 1] !== n - 1) tickIdx.push(n - 1);
    const ticks = tickIdx.map((i) => `<text x="${xAt(i).toFixed(1)}" y="${H - 10}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}" class="axis">${esc(md(closes[i].date))}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.aria)}">${grid}${guides}${price}${lines}${dots}${ticks}</svg>`;
  }

  function emptyChart(message) {
    return `<svg viewBox="0 0 1100 280" role="img" aria-label="${esc(message)}">
      <line x1="52" x2="1044" y1="132" y2="132" class="hc-guide"/>
      <text x="44" y="136" text-anchor="end" class="axis">50%</text>
      <text x="550" y="168" text-anchor="middle" class="hc-empty">${esc(message)}</text>
    </svg>`;
  }

  function historyView() {
    if (!DATA.history.length || !DATA.closes.length) {
      return `<section class="hpanel"><h2>History</h2><p class="caption">Waiting for data. No readings have been logged yet.</p></section>`;
    }
    const closes = actualSeries();
    const cLo = Math.min(...closes.map((c) => c.close));
    const cHi = Math.max(...closes.map((c) => c.close));
    const short = state.shortH;
    const long = state.longH;
    const shortName = { 0: "1-day", 1: "1-week", 2: "1-month" }[short];
    const shortCall = { 0: "next day", 1: "next week", 2: "next month" }[short];
    const marks = DATA.history.map((e) => ({ e, m: callMark(e, short) })).filter((row) => closes.some((c) => c.date === row.e.priceDate));
    const risePts = marks.map((row) => ({ date: row.e.priceDate, value: row.m.p * 100 }));
    const pVals = risePts.map((p) => p.value);
    const pMin = Math.min(30, ...pVals, 50);
    const pMax = Math.max(80, ...pVals, 50);
    const latest = marks[marks.length - 1];
    const shortNote = !latest
      ? "No logged readings yet."
      : latest.m.status === "pending"
        ? `${marks.length} logged ${H_SHORT[short]} rise ${marks.length === 1 ? "call" : "calls"}. Latest is ${fmtP(latest.m.p)}, pending, ${latest.m.left} session${latest.m.left === 1 ? "" : "s"} left. A line is drawn once a second call is logged.`
        : `${marks.length} logged ${H_SHORT[short]} rise calls. Green is a right call, red a wrong one.`;
    const ref = DATA.history[DATA.history.length - 1].price;
    const twoX = barrier("x2") * ref;
    const riseLong = DATA.history.filter((e) => closes.some((c) => c.date === e.priceDate)).map((e) => ({ date: e.priceDate, value: e.readings[H_KEYS[long]].rise * 100 }));
    const x2Long = DATA.history.filter((e) => closes.some((c) => c.date === e.priceDate)).map((e) => ({ date: e.priceDate, value: e.readings[H_KEYS[long]].x2 * 100 }));
    const when = { 3: "Nov 2027", 4: "2031", 5: "2036" }[long];
    const longLeft = outcome(DATA.history[DATA.history.length - 1], long, "rise");
    const longNote = `Rise and 2X are the logged readings only. These ${H_SHORT[long]} calls resolve after ${SESSIONS[long]} trading sessions${longLeft.status === "pending" ? `, ${longLeft.left} session${longLeft.left === 1 ? "" : "s"} left on the latest call` : ""}, around ${when}.`;
    const resolved = DATA.history.map((e) => ({ e, m: callMark(e, short) })).filter((row) => row.m.status !== "pending");
    let trackSvg;
    let trackNote;
    if (resolved.length < 20) {
      trackSvg = emptyChart(`Waiting for data. The rolling 20-call hit rate needs 20 resolved ${H_SHORT[short]} calls. Resolved so far: ${resolved.length}.`);
      trackNote = "No hit-rate points are drawn until 20 calls have a real close at the end of the window. The dashed line is 50%, a coin flip.";
    } else {
      const roll = [];
      for (let i = 19; i < resolved.length; i++) {
        const w = resolved.slice(i - 19, i + 1);
        roll.push({
          date: w[w.length - 1].e.priceDate,
          hit: (w.filter((r) => r.m.status === "right").length / 20) * 100,
          pred: (w.reduce((s, r) => s + r.m.p, 0) / 20) * 100,
        });
      }
      const rollCloses = roll.map((r) => {
        const c = closes.find((x) => x.date === r.date);
        return c || { date: r.date, close: ref };
      });
      trackSvg = layoutChart({
        aria: `${H_SHORT[short]} rolling hit rate and average predicted chance`,
        closes: rollCloses,
        pMin: 20,
        pMax: 80,
        cMin: 20,
        cMax: 80,
        pFmt: (v) => `${Math.round(v)}%`,
        price: false,
        cFmt: () => "",
        guides: [{ axis: "p", value: 50, label: "50%" }],
        lines: [
          { cls: "hc-right-line", points: roll.map((r) => ({ date: r.date, value: r.hit })) },
          { cls: "hc-pred", points: roll.map((r) => ({ date: r.date, value: r.pred })) },
        ],
      });
      trackNote = `Each point is the last 20 resolved ${H_SHORT[short]} calls: green is how often the call was right, blue is their average predicted chance of a rise.`;
    }
    const cPad = (cHi - cLo) * 0.08 || 1;
    return `<section class="hpanel">
      <div class="hhead">
        <h2>${esc(shortName)} horizon: ${short === 0 ? "daily" : short === 1 ? "weekly" : "monthly"} rise call vs. actual price</h2>
        ${seg([{ value: "0", label: "1d" }, { value: "1", label: "1w" }, { value: "2", label: "1m" }], short, "short")}
      </div>
      <ul class="hlegend">
        <li><i class="swatch read"></i>Model: chance of rise ${esc(shortCall)} (%)</li>
        <li><i class="swatch right"></i>Call right</li>
        <li><i class="swatch wrong"></i>Call wrong</li>
        <li><i class="swatch price"></i>Actual SPCX close ($)</li>
      </ul>
      <figure class="chart">${layoutChart({
        aria: `${shortName} rise calls against the actual close`,
        closes,
        pMin,
        pMax,
        cMin: cLo - cPad,
        cMax: cHi + cPad,
        pFmt: (v) => `${Math.round(v)}`,
        cFmt: (v) => `$${Math.round(v)}`,
        guides: [{ axis: "p", value: 50, label: "50%" }],
        lines: [{ cls: "hc-read", points: risePts }],
        dots: marks.map((row) => ({ date: row.e.priceDate, value: row.m.p * 100, kind: row.m.status, title: `${row.e.date} ${fmtP(row.m.p)} ${row.m.status}` })),
      })}</figure>
      <p class="caption">${esc(shortNote)} A dashed ring is still pending.</p>
    </section>
    <section class="hpanel">
      <div class="hhead">
        <h2>${esc({ 3: "1-year", 4: "5-year", 5: "10-year" }[long])} horizon: how the long-term odds drifted (outcomes resolve ${esc(when)})</h2>
        ${seg([{ value: "3", label: "1y" }, { value: "4", label: "5y" }, { value: "5", label: "10y" }], long, "long")}
      </div>
      <ul class="hlegend">
        <li><i class="swatch read"></i>Model: rise within ${esc(H_SHORT[long])} (%)</li>
        <li><i class="swatch x2"></i>Model: 2X within ${esc(H_SHORT[long])} (%)</li>
        <li><i class="swatch price"></i>Actual SPCX close ($)</li>
      </ul>
      <figure class="chart">${layoutChart({
        aria: `${H_SHORT[long]} rise and 2X readings against the actual close`,
        closes,
        pMin: 0,
        pMax: 100,
        cMin: Math.min(cLo, 135) * 0.92,
        cMax: Math.max(cHi, twoX) * 1.04,
        pFmt: (v) => `${Math.round(v)}`,
        cFmt: (v) => `$${Math.round(v)}`,
        guides: [
          { axis: "c", value: 135, label: "IPO $135" },
          { axis: "c", value: twoX, label: `2X $${Math.round(twoX).toLocaleString("en-US")}` },
        ],
        lines: [
          { cls: "hc-read", points: riseLong },
          { cls: "hc-x2", points: x2Long },
        ],
        dots: [
          ...riseLong.map((p) => ({ date: p.date, value: p.value, kind: "read", cls: "hc-read-dot", title: `Rise ${p.value.toFixed(0)}%` })),
          ...x2Long.map((p) => ({ date: p.date, value: p.value, kind: "x2", cls: "hc-x2-dot", title: `2X ${p.value.toFixed(0)}%` })),
        ],
      })}</figure>
      <p class="caption">${esc(longNote)}</p>
    </section>
    <section class="hpanel">
      <div class="hhead">
        <h2>Track record: is the model better than a coin flip?</h2>
      </div>
      <ul class="hlegend">
        <li><i class="swatch right"></i>${esc(H_SHORT[short])} hit rate, rolling 20 calls</li>
        <li><i class="swatch pred"></i>Average predicted chance</li>
      </ul>
      <figure class="chart">${trackSvg}</figure>
      <p class="caption">${esc(trackNote)}</p>
    </section>`;
  }

  function sourcesView() {
    return `<section class="section">
      <h2>Sources</h2>
      <p class="caption">Accessed 10 Nov 2026.</p>
      ${linkCards(DATA.links.map((l) => l.id), true)}
    </section>`;
  }

  function shell(tab, body) {
    const light = state.theme === "light";
    const tabs = `<nav class="tabs" aria-label="Sections">${TABS.map(([id, label]) => `
      <button type="button" class="tab ${id === tab ? "on" : ""}" role="tab" data-tab="${id}" aria-selected="${id === tab}">
        ${esc(label)}${id === "today" ? `<span class="badge">${DATA.today.length}</span>` : ""}${id === "history" ? `<span class="badge">${DATA.history.length}</span>` : ""}
      </button>`).join("")}</nav>`;
    return `<header class="hero">
      <div>
        <p class="eyebrow">Opinion model · Not financial advice</p>
        <h1>SpaceX Stock</h1>
        <p class="summary">A chance meter for SPCX built from weighted, sourced factors. Scores, weights and probabilities are my opinion-based model, not financial advice.</p>
      </div>
      <button type="button" class="theme-btn" data-theme-toggle>${light ? "Dark mode" : "Light mode"}</button>
    </header>
    ${tabs}
    ${body}
    <p class="site-foot">Opinion-based model, not financial advice. Updated ${esc(DATA.updated)}.</p>`;
  }

  function render() {
    const r = route();
    let body = "";
    if (r.tab === "meter" && r.factor) body = factorView(r.factor);
    else if (r.tab === "meter" && r.missing) {
      body = `<button type="button" class="back" data-back>← Back to the meter</button><p class="caption">That factor is not on the board.</p>`;
    }     else if (r.tab === "meter") body = meterView();
    else if (r.tab === "history") body = historyView();
    else if (r.tab === "thesis") body = thesisView();
    else if (r.tab === "ecosystem") body = ecosystemView();
    else if (r.tab === "scenarios") body = scenariosView();
    else if (r.tab === "today") body = todayView();
    else if (r.tab === "catalysts") body = catalystsView();
    else body = sourcesView();
    return shell(r.tab, body);
  }

  function paint(opts) {
    const preserve = !!(opts && opts.preserve);
    const y = preserve ? window.scrollY : 0;
    const focusKey = preserve && document.activeElement ? document.activeElement.dataset.focusKey : "";
    const howOpen = preserve && document.getElementById("how") ? document.getElementById("how").open : false;
    gaugeToken += 1;
    view.innerHTML = render();
    if (preserve) {
      window.scrollTo(0, y);
      if (howOpen) {
        const how = document.getElementById("how");
        if (how) how.open = true;
      }
      if (focusKey) {
        const el = view.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`);
        if (el) el.focus();
      }
    } else {
      visualShown = 0;
      window.scrollTo(0, 0);
    }
    if (document.getElementById("gauge")) kickGauge(current().p);
  }

  function patchMeter() {
    const { p } = current();
    const heading = document.getElementById("chance-heading");
    if (heading) heading.textContent = caption(state.target, state.h);
    kickGauge(p);
    let den = 0;
    DATA.factors.forEach((f) => { den += state.weights[f.id][state.h] * 5; });
    DATA.factors.forEach((f) => {
      const el = view.querySelector(`[data-factor="${CSS.escape(f.id)}"]`);
      if (!el) return;
      const w = state.weights[f.id][state.h];
      const contrib = den > 0 ? (w * f.score) / den : 0;
      el.style.opacity = w === 0 ? "0.5" : "1";
      const wEl = el.querySelector(".w-val");
      const pEl = el.querySelector(".pull-val");
      if (wEl) wEl.textContent = `Weight ${w.toFixed(1)}`;
      if (pEl) pEl.textContent = pullText(contrib);
    });
    const custom = isCustom();
    const note = document.getElementById("weight-note");
    if (note) {
      note.textContent = custom
        ? `Your weights move the reading from my default of ${fmtP(defaultProb(state.target, state.h))}.`
        : "Tap a factor below for the why, metrics, news and sources.";
    }
    const reset = document.getElementById("reset-weights");
    if (reset) reset.hidden = !custom;
  }

  function patchCountdowns() {
    view.querySelectorAll("[data-countdown]").forEach((el) => {
      const at = Number(el.dataset.countdown);
      el.textContent = countdownText(at, el.dataset.countdownMode || "");
    });
  }

  function navigate(hash) {
    const next = "#" + hash;
    if (location.hash === next) paint({ preserve: false });
    else location.hash = next;
  }

  function toggleTheme() {
    state.theme = state.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = state.theme;
    try { localStorage.setItem("spacex-stock-theme", state.theme); } catch (err) { /* ignore */ }
    const btn = view.querySelector("[data-theme-toggle]");
    if (btn) btn.textContent = state.theme === "light" ? "Dark mode" : "Light mode";
  }

  view.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-theme-toggle]")) { toggleTheme(); return; }
    if (t.closest("#reset-weights")) {
      state.weights = defaultW();
      patchMeter();
      return;
    }
    const tab = t.closest("[data-tab]");
    if (tab) { navigate(tab.dataset.tab); return; }
    const hBtn = t.closest("[data-h]");
    if (hBtn) { state.h = Number(hBtn.dataset.h); paint({ preserve: true }); return; }
    const shortBtn = t.closest("[data-short]");
    if (shortBtn) { state.shortH = Number(shortBtn.dataset.short); paint({ preserve: true }); return; }
    const longBtn = t.closest("[data-long]");
    if (longBtn) { state.longH = Number(longBtn.dataset.long); paint({ preserve: true }); return; }
    const targetBtn = t.closest("[data-target]");
    if (targetBtn) { state.target = targetBtn.dataset.target; paint({ preserve: true }); return; }
    const pillarBtn = t.closest("[data-pillar]");
    if (pillarBtn) { state.pillar = pillarBtn.dataset.pillar; paint({ preserve: true }); return; }
    const multBtn = t.closest("[data-mult]");
    if (multBtn) { state.mult = multBtn.dataset.mult; paint({ preserve: true }); return; }
    if (t.closest("[data-back]")) { navigate("meter"); return; }
    const open = t.closest("[data-open]");
    if (open) navigate("factor/" + open.dataset.open);
  });

  view.addEventListener("change", (e) => {
    if (e.target.id === "adjust") {
      state.adjust = e.target.checked;
      paint({ preserve: true });
    }
  });

  view.addEventListener("input", (e) => {
    const id = e.target.dataset.weight;
    if (!id) return;
    state.weights[id][state.h] = Number(e.target.value);
    patchMeter();
  });

  window.addEventListener("hashchange", () => paint({ preserve: false }));
  setInterval(patchCountdowns, 30000);

  try {
    const saved = localStorage.getItem("spacex-stock-theme");
    if (saved === "light" || saved === "dark") state.theme = saved;
  } catch (err) { /* ignore */ }
  document.documentElement.dataset.theme = state.theme;

  fetch("data.json", { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    })
    .then((data) => {
      DATA = data;
      LINKS = Object.fromEntries(data.links.map((l) => [l.id, l]));
      state.weights = defaultW();
      NET0 = H_KEYS.map((_, h) => netScore(defaultW(), h));
      paint({ preserve: false });
    })
    .catch(() => {
      view.innerHTML = `<p class="loading">Could not load data.json.</p>`;
    });
})();
