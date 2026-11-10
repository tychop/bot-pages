/* SpaceX Stock. Daily refresh edits data.json only:
   updated, market, factors (scores, news, and the rest of each factor),
   today, catalysts, pillars (thesis confidence), charts, links. */
(function () {
  const ANCHOR = {
    rise: [0.55, 0.6, 0.62],
    x2: [0.1, 0.35, 0.45],
    x10: [0.002, 0.02, 0.06],
    x100: [0.00001, 0.0005, 0.003],
    top1: [0.1, 0.3, 0.35],
  };
  const K = 4;
  const H_LABEL = ["1 year (Nov 2027)", "5 years (2031)", "10 years (2036)"];
  const H_SHORT = ["1y", "5y", "10y"];
  const TABS = [
    ["meter", "Chance meter"],
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
    h: 0,
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

  function defaultW() {
    const o = {};
    DATA.factors.forEach((f) => { o[f.id] = [f.w[0], f.w[1], f.w[2]]; });
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
  function prob(t, h, net) {
    return sig(logit(ANCHOR[t][h]) + K * (net - NET0[h]));
  }
  function isCustom() {
    return DATA.factors.some((f) => {
      const c = state.weights[f.id];
      return c[0] !== f.w[0] || c[1] !== f.w[1] || c[2] !== f.w[2];
    });
  }
  function current() {
    const net = netScore(state.weights, state.h);
    return { net, p: prob(state.target, state.h, net) };
  }
  function caption(target, h) {
    const horizon = H_LABEL[h];
    const price = DATA.market.price;
    if (target === "rise") return `Chance SPCX trades above $${price} in ${horizon}`;
    if (target === "x2") return `Chance the share price at least doubles within ${horizon}`;
    if (target === "x10") return `Chance the share price reaches 10X within ${horizon}`;
    if (target === "x100") return `Chance the share price reaches 100X within ${horizon}`;
    return `Chance SpaceX is the world's most valuable company at some point within ${horizon}`;
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
    return "";
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
      ? `Your weights move the reading from my default of ${fmtP(ANCHOR[state.target][state.h])}.`
      : "Tap a factor below for the why, metrics, news and sources.";
    const m = DATA.market;
    const at = Date.parse(m.nextCatalyst.at);
    const changeTone = String(m.change).startsWith("+") ? "good" : "bad";
    const internal = DATA.factors.filter((f) => f.group === "Internal driver");
    const external = DATA.factors.filter((f) => f.group === "External influence");
    const anchorRows = TARGETS.map((t) => [
      esc(t.id === "rise" ? `Price above $${m.price}` : t.row),
      esc(fmtP(ANCHOR[t.id][0])),
      esc(fmtP(ANCHOR[t.id][1])),
      esc(fmtP(ANCHOR[t.id][2])),
    ]);
    return `<section class="section">
      <h2 id="chance-heading">${esc(caption(state.target, state.h))}</h2>
      <p class="caption">Opinion-based model, not advice. Updated ${esc(DATA.updated)}.</p>
      <div class="meter-grid">
        <div class="panel gauge-panel">${gaugeSvg(p)}</div>
        <div class="panel controls">
          <h3>Model controls</h3>
          ${seg([{ value: "0", label: "1y" }, { value: "1", label: "5y" }, { value: "2", label: "10y" }], state.h, "h")}
          ${seg(TARGETS.map((t) => ({ value: t.id, label: t.label })), state.target, "target")}
          <label class="switch"><input type="checkbox" id="adjust" ${state.adjust ? "checked" : ""}><span class="track"><span class="knob"></span></span><span>Adjust factor weights</span></label>
          <button type="button" class="btn" id="reset-weights" ${custom ? "" : "hidden"}>Reset weights</button>
          <p class="note" id="weight-note">${esc(note)}</p>
        </div>
      </div>
      <p class="kicker">SPCX now, and the next event that can move it:</p>
      <div class="kpis">
        <article class="kpi"><span class="val">$${esc(m.price)}</span><span class="lbl">SPCX price</span><span class="sub">${esc(m.changeNote)}</span></article>
        <article class="kpi"><span class="val">$${m.capT.toFixed(2)}T</span><span class="lbl">Market cap</span><span class="sub">World #6\u20137</span></article>
        <article class="kpi"><span class="val ${changeTone}">${esc(m.change)}</span><span class="lbl">Day change</span></article>
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
      <p>Each factor has a score from -5 to +5 and a weight per horizon. The net score is the weighted average, scaled to ±100. For each target I set a default probability by judgment at today's scores; changing weights shifts its log-odds by 4 times the change in net score. Short-term factors (rates, sentiment, unlocks) weigh most at 1 year; orbital compute and competition weigh most at 10 years.</p>
      ${table(["Target", "1y", "5y", "10y"], anchorRows)}
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
        ${esc(label)}${id === "today" ? `<span class="badge">${DATA.today.length}</span>` : ""}
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
    } else if (r.tab === "meter") body = meterView();
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
        ? `Your weights move the reading from my default of ${fmtP(ANCHOR[state.target][state.h])}.`
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
      NET0 = [0, 1, 2].map((h) => netScore(defaultW(), h));
      paint({ preserve: false });
    })
    .catch(() => {
      view.innerHTML = `<p class="loading">Could not load data.json.</p>`;
    });
})();
