/* Renders flights.json. Daily updates should edit that file only. */
(function () {
  const app = document.getElementById("app");
  const state = {
    era: "all",
    result: "any",
    q: "",
    newestFirst: true,
    expandAll: false,
    open: new Set(),
  };

  fetch("flights.json")
    .then(function (response) {
      if (!response.ok) throw new Error("status " + response.status);
      return response.json();
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.flights)) throw new Error("bad shape");
      render(data);
    })
    .catch(function () {
      app.innerHTML = '<p class="status">Could not load flights.json.</p>';
    });

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tone(text) {
    const s = text || "";
    if (s.startsWith("Caught") || s.startsWith("Controlled") || s.startsWith("Soft")) return "tone-good";
    if (s.startsWith("Lost")) return "tone-bad";
    if (s.startsWith("Planned")) return "tone-planned";
    return "";
  }

  function resultClass(result) {
    if (result === "Success") return "success";
    if (result === "Failure") return "failure";
    if (result === "Upcoming") return "upcoming";
    return "";
  }

  function listPhrase(nums) {
    if (!nums.length) return "None yet";
    const label = nums.length === 1 ? "Flight" : "Flights";
    if (nums.length === 1) return label + " " + nums[0];
    if (nums.length === 2) return label + " " + nums[0] + " and " + nums[1];
    return label + " " + nums.slice(0, -1).join(", ") + " and " + nums[nums.length - 1];
  }

  function bullets(title, items) {
    if (!items || !items.length) return "";
    return (
      '<section class="block"><h4>' + esc(title) + "</h4><ul>" +
      items.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") +
      "</ul></section>"
    );
  }

  function splitBlock(achieved, failed) {
    const col = function (title, items, cls) {
      if (!items || !items.length) return "";
      return (
        '<div class="' + cls + '"><h4>' + esc(title) + "</h4><ul>" +
        items.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") +
        "</ul></div>"
      );
    };
    const html = col("Achieved", achieved, "achieved") + col("Failed or not achieved", failed, "failed");
    return html ? '<div class="split">' + html + "</div>" : "";
  }

  function sourceList(links) {
    if (!links || !links.length) return "";
    const cards = links.map(function (link) {
      const title = esc(link.title || link.href || "Source");
      const site = link.site ? '<span class="link-site">' + esc(link.site) + "</span>" : "";
      const href = typeof link.href === "string" && /^https:\/\//.test(link.href) ? link.href : "";
      const inner = '<span class="link-title">' + title + "</span>" + site;
      if (!href) return "<li><span class=\"source-card\">" + inner + "</span></li>";
      return (
        '<li><a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' +
        inner + '<span class="vh"> (opens in a new tab)</span></a></li>'
      );
    }).join("");
    return '<section class="block"><h4>Sources</h4><ul class="sources">' + cards + "</ul></section>";
  }

  function haystack(flight) {
    const parts = [];
    function walk(value) {
      if (value == null) return;
      if (typeof value === "string" || typeof value === "number") parts.push(String(value));
      else if (Array.isArray(value)) value.forEach(walk);
      else if (typeof value === "object") {
        Object.keys(value).forEach(function (key) {
          if (key !== "href") walk(value[key]);
        });
      }
    }
    walk(flight);
    return parts.join(" ").toLowerCase();
  }

  function matches(flight, needle) {
    if (state.era === "upcoming" && flight.result !== "Upcoming") return false;
    if (state.era !== "all" && state.era !== "upcoming" && flight.era !== state.era) return false;
    if (state.result !== "any" && flight.result !== state.result) return false;
    if (!needle) return true;
    const exact = needle.match(/^flight\s+(\d+)$/);
    if (exact) return flight.n === Number(exact[1]);
    return haystack(flight).indexOf(needle) !== -1;
  }

  function shownFlights(data) {
    const needle = state.q.trim().toLowerCase();
    const list = data.flights.filter(function (flight) { return matches(flight, needle); });
    list.sort(function (a, b) { return state.newestFirst ? b.n - a.n : a.n - b.n; });
    return list;
  }

  function isOpen(n) {
    return state.expandAll || state.open.has(n);
  }

  function flightCard(flight) {
    const open = isOpen(flight.n);
    const uncertain = flight.uncertain && flight.uncertain.length;
    const goalsTitle = flight.result === "Upcoming" ? "Planned goals" : "Mission goals";
    const lessonsTitle = flight.result === "Upcoming" ? "Preparation so far" : "Lessons and changes afterwards";
    const flag = uncertain ? '<span class="flag">Uncertain</span>' : "";
    const body =
      '<p class="summary">' + esc(flight.summary) + "</p>" +
      '<dl class="props">' +
      prop("Liftoff", (flight.dateLocal || "") + (flight.utc ? " (" + flight.utc + ")" : "")) +
      prop("Booster / ship", (flight.booster || "") + " / " + (flight.ship || "")) +
      prop("Version", flight.version) +
      prop("Launch pad", flight.pad) +
      prop("Booster outcome", flight.boosterOutcome) +
      prop("Ship outcome", flight.shipOutcome) +
      prop("FAA", flight.faa) +
      prop("Cost estimate", flight.cost) +
      "</dl>" +
      bullets(goalsTitle, flight.goals) +
      splitBlock(flight.achieved, flight.failed) +
      bullets(lessonsTitle, flight.lessons) +
      bullets("Notable firsts", flight.firsts) +
      (uncertain
        ? '<section class="uncertain"><h4>Uncertain or disputed</h4><ul>' +
          flight.uncertain.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") +
          "</ul></section>"
        : "") +
      sourceList(flight.sources);

    return (
      '<article class="flight is-' + resultClass(flight.result) + '" id="flight-' + flight.n + '">' +
      "<h3><button type=\"button\" class=\"flight-toggle\" data-flight=\"" + flight.n + "\" aria-expanded=\"" + open + "\" aria-controls=\"flight-panel-" + flight.n + "\">" +
      '<span class="num">Flight ' + esc(flight.n) + "</span>" +
      '<span class="date">' + esc(flight.dateLocal) + "</span>" +
      '<span class="vehicles">' + esc(flight.boosterShort) + " / " + esc(flight.shipShort) + "</span>" +
      '<span class="era">' + esc(flight.era) + "</span>" +
      '<span class="result"><span class="badge ' + resultClass(flight.result) + '">' + esc(flight.result) + "</span>" + flag + "</span>" +
      '<span class="booster ' + tone(flight.boosterOutcome) + '">' + esc(flight.boosterOutcome) + "</span>" +
      '<span class="ship ' + tone(flight.shipOutcome) + '">' + esc(flight.shipOutcome) + "</span>" +
      '<span class="chevron" aria-hidden="true"></span>' +
      "</button></h3>" +
      '<div class="flight-body" id="flight-panel-' + flight.n + '"' + (open ? "" : " hidden") + ">" + body + "</div>" +
      "</article>"
    );
  }

  function prop(label, value) {
    return "<div><dt>" + esc(label) + "</dt><dd>" + esc(value) + "</dd></div>";
  }

  function render(data) {
    const flights = data.flights;
    const flown = flights.filter(function (f) { return f.result !== "Upcoming"; });
    const successes = flown.filter(function (f) { return f.result === "Success"; }).length;
    const failures = flown.filter(function (f) { return f.result === "Failure"; }).length;
    const catchNums = flown.filter(function (f) { return (f.boosterOutcome || "").startsWith("Caught"); }).map(function (f) { return f.n; });
    const upcoming = flights.filter(function (f) { return f.result === "Upcoming"; }).sort(function (a, b) { return a.n - b.n; })[0];
    const summary = data.summary || {};
    const counts = { all: flights.length, V1: 0, V2: 0, V3: 0, upcoming: 0 };
    flights.forEach(function (f) {
      if (counts[f.era] != null) counts[f.era] += 1;
      if (f.result === "Upcoming") counts.upcoming += 1;
    });

    document.getElementById("intro").textContent = data.intro || document.getElementById("intro").textContent;
    document.getElementById("updated").textContent = "Last updated " + (data.lastUpdatedLabel || data.lastUpdated || "");
    document.getElementById("timezone").textContent = data.timezoneNote || "";
    if (data.title) document.title = data.title;

    const years = yearCounts(flown);
    const maxYear = years.reduce(function (max, row) { return Math.max(max, row.value); }, 0) || 1;

    app.innerHTML =
      '<section id="overview">' +
      "<h2>Overview</h2>" +
      (data.overview ? '<p class="lede">' + esc(data.overview) + "</p>" : "") +
      '<div class="metrics">' +
      metric(String(flown.length), summary.flownLabel || "Flights flown", summary.flownRange || "") +
      metric(successes + " / " + failures, summary.outcomeLabel || "Successes / failures", summary.outcomeNote || "") +
      metric(String(catchNums.length), summary.catchesLabel || "Booster tower catches", listPhrase(catchNums)) +
      metric(
        summary.nextShort || (upcoming ? upcoming.dateLocal : "None listed"),
        upcoming ? "Next: Flight " + upcoming.n : "Next flight",
        summary.nextDetail || ""
      ) +
      "</div>" +
      '<div class="overview-grid">' +
      '<div class="panel"><h3>Flights per year</h3>' + years.map(function (row) {
        const width = Math.round((row.value / maxYear) * 100);
        return '<div class="year"><span class="year-label">' + esc(row.label) + '</span><span class="bar"><span style="width:' + width + '%"></span></span><span class="year-value">' + row.value + "</span></div>";
      }).join("") + "</div>" +
      '<div class="panel"><h3>Launch outcomes</h3>' +
      '<div class="outcome-bar" role="img" aria-label="' + successes + " successes and " + failures + ' failures">' +
      '<span class="good" style="flex:' + successes + '"></span><span class="bad" style="flex:' + failures + '"></span></div>' +
      '<p class="outcome-key"><span class="good">' + successes + ' successes</span> · <span class="bad">' + failures + " failures</span></p>" +
      '<p class="caption">' + esc(summary.outcomeNote || "") + "</p></div></div></section>" +
      renderNext(data, upcoming) +
      '<section id="flights"><h2>All flights</h2>' +
      '<p class="caption">Open a flight for goals, results, causes, lessons and sources. Times are CET/CEST as listed.</p>' +
      '<div class="segment" role="radiogroup" aria-label="Vehicle version">' +
      eraButton("all", "All", counts.all) +
      eraButton("V1", "V1", counts.V1) +
      eraButton("V2", "V2", counts.V2) +
      eraButton("V3", "V3", counts.V3) +
      eraButton("upcoming", "Upcoming", counts.upcoming) +
      "</div>" +
      '<form class="control-row" id="filters">' +
      '<label class="field">Outcome<select id="outcome">' +
      option("any", "Any outcome") + option("Success", "Success") + option("Failure", "Failure") + option("Upcoming", "Upcoming") +
      "</select></label>" +
      '<label class="field search">Search<input id="q" type="search" placeholder="e.g. catch, relight, Starlink" autocomplete="off" value="' + esc(state.q) + '"></label>' +
      '<label class="check"><input id="newest" type="checkbox"' + (state.newestFirst ? " checked" : "") + "> Newest first</label>" +
      '<label class="check"><input id="expand" type="checkbox"' + (state.expandAll ? " checked" : "") + "> Expand all</label>" +
      "</form>" +
      '<p class="showing" id="showing"></p>' +
      '<div id="list"></div></section>' +
      renderLater(data) +
      renderCosts(data) +
      renderNotes(data) +
      '<p class="top-link"><a href="#overview">Back to top</a></p>';

    document.getElementById("outcome").value = state.result;
    bind(data);
    renderList(data);
  }

  function metric(value, label, detail) {
    return '<article class="metric"><span class="metric-value">' + esc(value) + '</span><span class="metric-label">' + esc(label) + '</span><span class="metric-detail">' + esc(detail) + "</span></article>";
  }

  function eraButton(value, label, count) {
    const checked = state.era === value;
    return '<button type="button" role="radio" data-era="' + value + '" aria-checked="' + checked + '">' + esc(label) + ' <span class="count">' + count + "</span></button>";
  }

  function option(value, label) {
    return '<option value="' + value + '">' + esc(label) + "</option>";
  }

  function yearCounts(flown) {
    const map = {};
    flown.forEach(function (flight) {
      const match = String(flight.dateLocal || "").match(/\b(20\d{2})\b/);
      if (!match) return;
      map[match[1]] = (map[match[1]] || 0) + 1;
    });
    return Object.keys(map).sort().map(function (year) { return { label: year, value: map[year] }; });
  }

  function renderNext(data, upcoming) {
    if (!upcoming) {
      return '<section id="next"><h2>Next flight</h2><p class="empty">No upcoming flight is listed.</p></section>';
    }
    const brief = data.next && Number(data.next.aboutFlight) === upcoming.n ? data.next : null;
    const rows = [
      ["Target", upcoming.dateLocal],
      ["Vehicles", upcoming.booster + " / " + upcoming.ship + (upcoming.version ? ", " + upcoming.version : "")],
      ["Pad", upcoming.pad],
    ];
    let status = "";
    if (brief) {
      status = '<p class="status-line"><span class="status-pill">' + esc(brief.status) + "</span></p>";
      rows.splice(1, 0, ["Time zone", brief.timezone]);
      rows.push(["Plan", brief.plan], ["Hardware", brief.hardware]);
    }
    return (
      '<section id="next"><h2>Next up: Flight ' + esc(upcoming.n) + "</h2>" +
      (upcoming.summary ? '<p class="lede">' + esc(upcoming.summary) + "</p>" : "") +
      status +
      '<dl class="props">' + rows.map(function (row) { return prop(row[0], row[1]); }).join("") + "</dl>" +
      (brief && brief.callout ? '<p class="callout">' + esc(brief.callout) + "</p>" : "") +
      "</section>"
    );
  }

  function renderLater(data) {
    const items = data.later || [];
    const cards = items.map(function (item) {
      return (
        '<article class="card"><p class="when">' + esc(item.when) + "</p>" +
        '<h3 class="mission">' + esc(item.mission) + "</h3>" +
        '<p class="meta">' + esc(item.vehicles) + " · " + esc(item.site) + "</p>" +
        "<p>" + esc(item.note) + "</p>" +
        '<p class="meta">Basis: ' + esc(item.confidence) + "</p></article>"
      );
    }).join("");
    return (
      '<section id="later"><h2>Later on the manifest</h2>' +
      (data.laterCaption ? '<p class="caption">' + esc(data.laterCaption) + "</p>" : "") +
      '<div class="cards two">' + cards + "</div>" +
      (data.laterNote ? "<p>" + esc(data.laterNote) + "</p>" : "") +
      "</section>"
    );
  }

  function renderCosts(data) {
    const cards = (data.costs || []).map(function (cost) {
      return (
        '<article class="card"><p class="when">' + esc(cost.figure) + ' <span class="estimate-tag">Estimate</span></p>' +
        "<p>" + esc(cost.covers) + "</p>" +
        '<p class="meta">Source: ' + esc(cost.source) + "</p></article>"
      );
    }).join("");
    return (
      '<section id="costs"><h2>What it costs</h2>' +
      '<div class="cards two">' + cards + "</div>" +
      (data.costNote ? "<p>" + esc(data.costNote) + "</p>" : "") +
      "</section>"
    );
  }

  function renderNotes(data) {
    const notes = (data.notes || []).map(function (note) { return "<li>" + esc(note) + "</li>"; }).join("");
    return (
      '<section id="notes"><h2>Notes and uncertainties</h2>' +
      '<ul class="notes">' + notes + "</ul>" +
      sourceList(data.indexLinks).replace("<h4>Sources</h4>", "<h4>Further reading</h4>") +
      "</section>"
    );
  }

  function renderList(data) {
    const list = shownFlights(data);
    const total = data.flights.length;
    const order = state.newestFirst ? "newest first" : "oldest first";
    document.getElementById("showing").textContent = "Showing " + list.length + " of " + total + ", " + order + ".";
    const head =
      '<div class="list-head" aria-hidden="true"><span>Flight</span><span>Date (NL time)</span><span>Vehicles</span><span>Version</span><span>Outcome</span><span>Booster</span><span>Ship</span><span></span></div>';
    document.getElementById("list").innerHTML = list.length
      ? head + list.map(flightCard).join("")
      : '<p class="empty">No flights match these filters.</p>';
  }

  function bind(data) {
    app.querySelectorAll("[data-era]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.era = button.getAttribute("data-era");
        app.querySelectorAll("[data-era]").forEach(function (other) {
          other.setAttribute("aria-checked", String(other === button));
        });
        renderList(data);
      });
    });

    document.getElementById("outcome").addEventListener("change", function (event) {
      state.result = event.target.value;
      renderList(data);
    });

    document.getElementById("q").addEventListener("input", function (event) {
      state.q = event.target.value;
      renderList(data);
    });

    document.getElementById("newest").addEventListener("change", function (event) {
      state.newestFirst = event.target.checked;
      renderList(data);
    });

    document.getElementById("expand").addEventListener("change", function (event) {
      state.expandAll = event.target.checked;
      if (!state.expandAll) state.open.clear();
      renderList(data);
    });

    document.getElementById("filters").addEventListener("submit", function (event) {
      event.preventDefault();
    });

    document.getElementById("flights").addEventListener("click", function (event) {
      const button = event.target.closest(".flight-toggle");
      if (!button) return;
      const n = Number(button.getAttribute("data-flight"));
      if (state.expandAll) {
        state.expandAll = false;
        state.open = new Set(shownFlights(data).map(function (flight) { return flight.n; }));
        state.open.delete(n);
        document.getElementById("expand").checked = false;
      } else if (state.open.has(n)) {
        state.open.delete(n);
      } else {
        state.open.add(n);
      }
      renderList(data);
      const again = app.querySelector('.flight-toggle[data-flight="' + n + '"]');
      if (again) again.focus();
    });
  }
})();
