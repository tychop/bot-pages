/* Renders flights.json. Daily updates should edit that file only. */
(function () {
  var PHOTOS = {
    hero: {
      src: "img/hero.webp",
      position: "center 42%",
      alt: "Starship lifting off beside the Starbase tower during Flight 5, exhaust clouds glowing over the water",
      caption: "Flight 5 liftoff, 13 October 2024",
      credit: "Steve Jurvetson",
      license: "CC BY 2.0",
      licenseHref: "https://creativecommons.org/licenses/by/2.0/",
      href: "https://commons.wikimedia.org/wiki/File:SpaceX_Ignition_(54063834163).jpg",
    },
    V1: {
      src: "img/v1.webp",
      position: "center 46%",
      alt: "Starship Ship 25 and Booster 9 climbing on a bright exhaust plume during Flight 2",
      caption: "Flight 2 ascent, Ship 25 and Booster 9",
      credit: "Osunpokeh",
      license: "CC BY-SA 4.0",
      licenseHref: "https://creativecommons.org/licenses/by-sa/4.0/",
      href: "https://commons.wikimedia.org/wiki/File:Starship-IFT2-ascent.jpg",
    },
    V2: {
      src: "img/v2.webp",
      position: "center 38%",
      alt: "Starship climbing away from a smoke cloud over the water during Flight 11",
      caption: "Flight 11 liftoff from Starbase",
      credit: "Shujianyang",
      license: "CC BY-SA 4.0",
      licenseHref: "https://creativecommons.org/licenses/by-sa/4.0/",
      href: "https://commons.wikimedia.org/wiki/File:Starship_lifted_off_from_Starbase_during_flight_test_11.jpg",
    },
    V3: {
      src: "img/v3.webp",
      position: "center 28%",
      alt: "Booster 7 and Ship 24 stacked beside the launch tower at Starbase under a blue sky",
      caption: "Booster 7 and Ship 24 at Starbase, 16 April 2023",
      credit: "Jenny Hautmann",
      license: "CC BY-SA 4.0",
      licenseHref: "https://creativecommons.org/licenses/by-sa/4.0/",
      href: "https://commons.wikimedia.org/wiki/File:Full_Stack_starship.jpg",
    },
  };

  var BY_FLIGHT = {
    5: {
      src: "img/catch.webp",
      position: "center 42%",
      alt: "Super Heavy descending in flame beside the launch tower as the arms close during Flight 5",
      caption: "Flight 5, booster catch",
      credit: "Steve Jurvetson",
      license: "CC BY 2.0",
      licenseHref: "https://creativecommons.org/licenses/by/2.0/",
      href: "https://commons.wikimedia.org/wiki/File:Starship_Booster_Landing_on_Mechzilla_(54064036815).jpg",
    },
    6: {
      src: "img/iss.webp",
      position: "center center",
      alt: "The Flight 6 launch plume and booster splashdown seen from the International Space Station",
      caption: "Flight 6, seen from the International Space Station, 19 November 2024",
      credit: "NASA",
      license: "Public domain",
      href: "https://commons.wikimedia.org/wiki/File:Launch_of_SpaceX_Starship_6_rocket_seen_from_the_International_Space_Station_(iss072e220161,_cropped).jpg",
    },
  };

  var MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

  var app = document.getElementById("app");
  var state = {
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
      app.innerHTML = '<p class="loading">Could not load flights.json.</p>';
    });

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function photoFor(flight) {
    return BY_FLIGHT[flight.n] || PHOTOS[flight.era] || PHOTOS.V1;
  }

  function allPhotos() {
    var list = [PHOTOS.hero, PHOTOS.V1, PHOTOS.V2, PHOTOS.V3, BY_FLIGHT[5], BY_FLIGHT[6]];
    var seen = {};
    return list.filter(function (photo) {
      if (!photo || seen[photo.src]) return false;
      seen[photo.src] = true;
      return true;
    });
  }

  function licenseHtml(photo) {
    return photo.licenseHref
      ? '<a href="' + esc(photo.licenseHref) + '">' + esc(photo.license) + "</a>"
      : esc(photo.license);
  }

  function shortCredit(photo) {
    return esc(photo.caption) + ". " + esc(photo.credit) + ", " + licenseHtml(photo) + ".";
  }

  function creditLine(photo) {
    return shortCredit(photo) + ' <a href="' + esc(photo.href) + '">File</a>. Resized and re-encoded as WebP.';
  }

  function liftoffInstant(flight) {
    if (!flight || flight.result !== "Upcoming") return null;
    var text = flight.dateLocal || "";
    if (/not announced|tbd|tba|unknown/i.test(text)) return null;
    var match = text.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4}),\s*(\d{1,2}):(\d{2})\s*(CET|CEST)/);
    if (!match) return null;
    var month = MONTHS[match[2].slice(0, 3).toLowerCase()];
    if (month == null) return null;
    var offset = match[6] === "CEST" ? 2 : 1;
    var utc = Date.UTC(+match[3], month, +match[1], +match[4] - offset, +match[5]);
    return isNaN(utc) ? null : utc;
  }

  function listPhrase(nums) {
    if (!nums.length) return "None yet";
    if (nums.length === 1) return "Flight " + nums[0];
    if (nums.length === 2) return "Flights " + nums[0] + " and " + nums[1];
    return "Flights " + nums.slice(0, -1).join(", ") + " and " + nums[nums.length - 1];
  }

  function haystack(flight) {
    var parts = [];
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
    var exact = needle.match(/^flight\s+(\d+)$/);
    if (exact) return flight.n === Number(exact[1]);
    return haystack(flight).indexOf(needle) !== -1;
  }

  function shownFlights(data) {
    var needle = state.q.trim().toLowerCase();
    var list = data.flights.filter(function (flight) { return matches(flight, needle); });
    list.sort(function (a, b) { return state.newestFirst ? b.n - a.n : a.n - b.n; });
    return list;
  }

  function isOpen(n) {
    return state.expandAll || state.open.has(n);
  }

  function bullets(title, items) {
    if (!items || !items.length) return "";
    return '<section class="block"><h4>' + esc(title) + "</h4><ul>" +
      items.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") +
      "</ul></section>";
  }

  function splitBlock(achieved, failed) {
    function col(title, items, cls) {
      if (!items || !items.length) return "";
      return '<div class="' + cls + '"><h4>' + esc(title) + "</h4><ul>" +
        items.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") +
        "</ul></div>";
    }
    var html = col("Achieved", achieved, "achieved") + col("Failed or not achieved", failed, "failed");
    return html ? '<div class="split">' + html + "</div>" : "";
  }

  function sourceList(links, heading) {
    if (!links || !links.length) return "";
    var cards = links.map(function (link) {
      var title = esc(link.title || link.href || "Source");
      var site = link.site ? '<span class="link-site">' + esc(link.site) + "</span>" : "";
      var href = typeof link.href === "string" && /^https:\/\//.test(link.href) ? link.href : "";
      var inner = '<span class="link-title">' + title + "</span>" + site;
      if (!href) return '<li><span class="source-card">' + inner + "</span></li>";
      return '<li><a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' +
        inner + '<span class="vh"> (opens in a new tab)</span></a></li>';
    }).join("");
    return '<section class="block"><h4>' + esc(heading) + '</h4><ul class="sources">' + cards + "</ul></section>";
  }

  function prop(label, value) {
    if (!value) return "";
    return "<div><dt>" + esc(label) + "</dt><dd>" + esc(value) + "</dd></div>";
  }

  function flightCard(flight) {
    var open = isOpen(flight.n);
    var photo = photoFor(flight);
    var uncertain = flight.uncertain && flight.uncertain.length;
    var goalsTitle = flight.result === "Upcoming" ? "Planned goals" : "Mission goals";
    var lessonsTitle = flight.result === "Upcoming" ? "Preparation so far" : "Lessons and changes afterwards";
    var resultCls = flight.result === "Failure" ? " failure" : "";
    var marks = '<span class="tag' + resultCls + '">' + esc(flight.result) + "</span>" +
      (uncertain ? '<span class="tag uncertain">Uncertain</span>' : "");
    var body =
      '<figure class="launch-photo"><img src="' + esc(photo.src) + '" alt="' + esc(photo.alt) + '" style="object-position:' + esc(photo.position) + '" loading="lazy" decoding="async">' +
      "<figcaption>" + shortCredit(photo) + "</figcaption></figure>" +
      '<p class="summary">' + esc(flight.summary) + "</p>" +
      '<dl class="facts">' +
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
      sourceList(flight.sources, "Sources");

    return '<article class="launch" id="flight-' + flight.n + '">' +
      '<h3><button type="button" class="launch-toggle" data-flight="' + flight.n + '" aria-expanded="' + open + '" aria-controls="flight-panel-' + flight.n + '">' +
      '<span class="launch-n">' + esc(flight.n) + "</span>" +
      '<span class="launch-main"><span class="launch-date">' + esc(flight.dateLocal) + "</span>" +
      '<span class="launch-sub">' + esc(flight.boosterShort) + " / " + esc(flight.shipShort) + " · " + esc(flight.era) + "</span></span>" +
      '<span class="launch-marks">' + marks + "</span>" +
      '<span class="chev" aria-hidden="true"></span>' +
      "</button></h3>" +
      '<div class="launch-body" id="flight-panel-' + flight.n + '"' + (open ? "" : " hidden") + ">" + body + "</div></article>";
  }

  function render(data) {
    var flights = data.flights;
    var flown = flights.filter(function (f) { return f.result !== "Upcoming"; });
    var successes = flown.filter(function (f) { return f.result === "Success"; }).length;
    var failures = flown.filter(function (f) { return f.result === "Failure"; }).length;
    var catchNums = flown.filter(function (f) { return (f.boosterOutcome || "").startsWith("Caught"); }).map(function (f) { return f.n; });
    var upcoming = flights.filter(function (f) { return f.result === "Upcoming"; }).sort(function (a, b) { return a.n - b.n; })[0];
    var summary = data.summary || {};
    var counts = { all: flights.length, V1: 0, V2: 0, V3: 0, upcoming: 0 };
    flights.forEach(function (f) {
      if (counts[f.era] != null) counts[f.era] += 1;
      if (f.result === "Upcoming") counts.upcoming += 1;
    });
    var years = yearCounts(flown);
    var maxYear = years.reduce(function (max, row) { return Math.max(max, row.value); }, 0) || 1;

    document.getElementById("updated").textContent = "Last updated " + (data.lastUpdatedLabel || data.lastUpdated || "");
    if (data.title) document.title = data.title;

    app.innerHTML =
      heroHtml(data, upcoming) +
      nextDetail(data, upcoming) +
      '<section class="band" id="overview"><div class="wrap">' +
      "<h2>Overview</h2>" +
      (data.overview ? '<p class="lede">' + esc(data.overview) + "</p>" : "") +
      (data.intro ? '<p class="lede">' + esc(data.intro) + "</p>" : "") +
      (data.timezoneNote ? '<p class="timezone">' + esc(data.timezoneNote) + "</p>" : "") +
      '<div class="stats">' +
      stat(String(flown.length), summary.flownLabel || "Flights flown", summary.flownRange || "") +
      stat(successes + " / " + failures, summary.outcomeLabel || "Successes / failures", summary.outcomeNote || "") +
      stat(String(catchNums.length), summary.catchesLabel || "Booster tower catches", listPhrase(catchNums)) +
      stat(summary.nextShort || (upcoming ? "Flight " + upcoming.n : "None"), upcoming ? "Next: Flight " + upcoming.n : "Next flight", summary.nextDetail || "") +
      "</div>" +
      '<div class="panels"><div><h3>Flights per year</h3>' +
      years.map(function (row) {
        var width = Math.round((row.value / maxYear) * 100);
        return '<div class="year"><span class="year-label">' + esc(row.label) + '</span><span class="track"><span style="width:' + width + '%"></span></span><span class="year-value">' + row.value + "</span></div>";
      }).join("") +
      "</div><div><h3>Launch outcomes</h3>" +
      '<div class="outcome-bar" role="img" aria-label="' + successes + " successes and " + failures + ' failures">' +
      '<span class="good" style="flex:' + successes + '"></span><span class="bad" style="flex:' + failures + '"></span></div>' +
      '<p class="outcome-key"><span>' + successes + ' successes</span> · <span class="bad">' + failures + " failures</span></p>" +
      (summary.outcomeNote ? '<p class="fine">' + esc(summary.outcomeNote) + "</p>" : "") +
      "</div></div></div></section>" +
      '<section class="band" id="flights"><div class="wide">' +
      "<h2>All flights</h2>" +
      '<p class="lede">Open a flight for goals, results, causes, lessons and sources. Times are CET/CEST as listed.</p>' +
      '<div class="era" role="radiogroup" aria-label="Vehicle version">' +
      eraButton("all", "All", counts.all) +
      eraButton("V1", "V1", counts.V1) +
      eraButton("V2", "V2", counts.V2) +
      eraButton("V3", "V3", counts.V3) +
      eraButton("upcoming", "Upcoming", counts.upcoming) +
      "</div>" +
      '<form class="tools" id="filters">' +
      '<label class="field"><span class="lbl">Outcome</span><select id="outcome">' +
      option("any", "Any outcome") + option("Success", "Success") + option("Failure", "Failure") + option("Upcoming", "Upcoming") +
      "</select></label>" +
      '<label class="field search"><span class="lbl">Search</span><input id="q" type="search" placeholder="Catch, relight, Starlink" autocomplete="off" value="' + esc(state.q) + '"></label>' +
      '<label class="check"><input id="newest" type="checkbox"' + (state.newestFirst ? " checked" : "") + "> Newest first</label>" +
      '<label class="check"><input id="expand" type="checkbox"' + (state.expandAll ? " checked" : "") + "> Expand all</label>" +
      "</form>" +
      '<p class="showing" id="showing"></p><div id="list"></div></div></section>' +
      laterHtml(data) +
      costsHtml(data) +
      notesHtml(data) +
      creditsHtml() +
      '<div class="wrap"><p class="top-link"><a href="#overview">Back to top</a></p></div>';

    document.getElementById("outcome").value = state.result;
    bind(data);
    renderList(data);
    startCountdown(upcoming);
  }

  function stat(value, label, detail) {
    var long = String(value).length > 6 ? " long" : "";
    return '<article class="stat"><span class="stat-value' + long + '">' + esc(value) + '</span><span class="stat-label">' + esc(label) + '</span><span class="stat-detail">' + esc(detail) + "</span></article>";
  }

  function eraButton(value, label, count) {
    return '<button type="button" role="radio" data-era="' + value + '" aria-checked="' + (state.era === value) + '">' +
      esc(label) + ' <span class="count">' + count + "</span></button>";
  }

  function option(value, label) {
    return '<option value="' + value + '">' + esc(label) + "</option>";
  }

  function yearCounts(flown) {
    var map = {};
    flown.forEach(function (flight) {
      var match = String(flight.dateLocal || "").match(/\b(20\d{2})\b/);
      if (!match) return;
      map[match[1]] = (map[match[1]] || 0) + 1;
    });
    return Object.keys(map).sort().map(function (year) { return { label: year, value: map[year] }; });
  }

  function heroHtml(data, upcoming) {
    var photo = PHOTOS.hero;
    if (!upcoming) {
      return '<section class="hero" id="next"><img class="hero-img" src="' + esc(photo.src) + '" alt="' + esc(photo.alt) + '">' +
        '<div class="hero-shade"></div><div class="hero-copy"><p class="eyebrow">Starship</p><h1 class="hero-flight"><span>Flight</span> tracker</h1></div>' +
        '<p class="hero-credit">' + shortCredit(photo) + "</p></section>";
    }
    var brief = data.next && Number(data.next.aboutFlight) === upcoming.n ? data.next : null;
    var vehicles = (upcoming.boosterShort || upcoming.booster) + " / " + (upcoming.shipShort || upcoming.ship);
    var meta = [vehicles, upcoming.version, upcoming.pad].filter(Boolean).join("  ·  ");
    return '<section class="hero" id="next">' +
      '<img class="hero-img" src="' + esc(photo.src) + '" alt="' + esc(photo.alt) + '" style="object-position:' + esc(photo.position) + '">' +
      '<div class="hero-shade"></div>' +
      '<div class="hero-copy"><p class="eyebrow">Next launch</p>' +
      '<h1 class="hero-flight"><span>Flight</span> ' + esc(upcoming.n) + "</h1>" +
      '<p class="hero-date">' + esc(upcoming.dateLocal) + "</p>" +
      '<p class="hero-vehicles">' + esc(meta) + "</p>" +
      (brief && brief.status ? '<p class="status-line">' + esc(brief.status) + "</p>" : "") +
      '<div id="countdown" hidden></div>' +
      "</div>" +
      '<p class="hero-credit">' + shortCredit(photo) + "</p></section>";
  }

  function nextDetail(data, upcoming) {
    if (!upcoming) {
      return '<section class="band"><div class="wrap"><h2>Next flight</h2><p class="empty">No upcoming flight is listed.</p></div></section>';
    }
    var brief = data.next && Number(data.next.aboutFlight) === upcoming.n ? data.next : null;
    var rows = [
      prop("Target", upcoming.dateLocal),
      prop("Vehicles", upcoming.booster + " / " + upcoming.ship + (upcoming.version ? ", " + upcoming.version : "")),
      prop("Pad", upcoming.pad),
    ];
    if (brief) {
      rows.splice(1, 0, prop("Time zone", brief.timezone));
      rows.push(prop("Plan", brief.plan), prop("Hardware", brief.hardware));
    }
    return '<section class="band" id="next-detail"><div class="wrap"><p class="kicker">Up next</p><h2>Flight ' + esc(upcoming.n) + "</h2>" +
      (upcoming.summary ? '<p class="lede">' + esc(upcoming.summary) + "</p>" : "") +
      '<dl class="facts">' + rows.join("") + "</dl>" +
      (brief && brief.callout ? '<p class="callout">' + esc(brief.callout) + "</p>" : "") +
      "</div></section>";
  }

  function laterHtml(data) {
    var cards = (data.later || []).map(function (item) {
      return '<li><p class="when">' + esc(item.when) + "</p><h3>" + esc(item.mission) + "</h3>" +
        '<p class="meta">' + esc(item.vehicles) + " · " + esc(item.site) + "</p>" +
        "<p>" + esc(item.note) + "</p>" +
        '<p class="meta">Basis: ' + esc(item.confidence) + "</p></li>";
    }).join("");
    return '<section class="band" id="later"><div class="wrap"><h2>Later on the manifest</h2>' +
      (data.laterCaption ? '<p class="lede">' + esc(data.laterCaption) + "</p>" : "") +
      '<ol class="manifest">' + cards + "</ol>" +
      (data.laterNote ? '<p class="note">' + esc(data.laterNote) + "</p>" : "") +
      "</div></section>";
  }

  function costsHtml(data) {
    var cards = (data.costs || []).map(function (cost) {
      return '<li><p class="cost-figure">' + esc(cost.figure) + ' <span class="estimate">Estimate</span></p>' +
        "<p>" + esc(cost.covers) + '</p><p class="meta">Source: ' + esc(cost.source) + "</p></li>";
    }).join("");
    return '<section class="band" id="costs"><div class="wrap"><h2>What it costs</h2>' +
      '<ol class="manifest">' + cards + "</ol>" +
      (data.costNote ? '<p class="note">' + esc(data.costNote) + "</p>" : "") +
      "</div></section>";
  }

  function notesHtml(data) {
    var notes = (data.notes || []).map(function (note) { return "<li>" + esc(note) + "</li>"; }).join("");
    return '<section class="band" id="notes"><div class="wrap"><h2>Notes and uncertainties</h2>' +
      '<ul class="block">' + notes + "</ul>" +
      sourceList(data.indexLinks, "Further reading") +
      "</div></section>";
  }

  function creditsHtml() {
    var items = allPhotos().map(function (photo) {
      return "<li>" + creditLine(photo) + "</li>";
    }).join("");
    return '<section class="band" id="credits"><div class="wrap"><h2>Photography</h2>' +
      '<p class="lede">Launch photographs are hosted with this page. Creative Commons images were resized and re-encoded as WebP; those adaptations stay under the same license.</p>' +
      '<ul class="credits">' + items + "</ul></div></section>";
  }

  function renderList(data) {
    var list = shownFlights(data);
    var order = state.newestFirst ? "newest first" : "oldest first";
    document.getElementById("showing").textContent = "Showing " + list.length + " of " + data.flights.length + ", " + order + ".";
    document.getElementById("list").innerHTML = list.length
      ? list.map(flightCard).join("")
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
      var button = event.target.closest(".launch-toggle");
      if (!button) return;
      var n = Number(button.getAttribute("data-flight"));
      if (state.expandAll) {
        state.expandAll = false;
        state.open = new Set(shownFlights(data).map(function (flight) { return flight.n; }));
        state.open.delete(n);
        document.getElementById("expand").checked = false;
      } else if (state.open.has(n)) state.open.delete(n);
      else state.open.add(n);
      renderList(data);
      var again = app.querySelector('.launch-toggle[data-flight="' + n + '"]');
      if (again) again.focus();
    });
  }

  function startCountdown(flight) {
    var el = document.getElementById("countdown");
    if (!el) return;
    var when = liftoffInstant(flight);
    if (when == null) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function tick() {
      var diff = when - Date.now();
      if (diff <= 0) {
        el.innerHTML = '<p class="status-line">Liftoff time has passed</p>';
        return;
      }
      var seconds = Math.floor(diff / 1000);
      var days = Math.floor(seconds / 86400);
      var hours = Math.floor((seconds % 86400) / 3600);
      var mins = Math.floor((seconds % 3600) / 60);
      var secs = seconds % 60;
      el.innerHTML = '<ol class="countdown" aria-label="Time until liftoff">' +
        "<li><strong>" + days + "</strong><span>Days</span></li>" +
        "<li><strong>" + pad(hours) + "</strong><span>Hours</span></li>" +
        "<li><strong>" + pad(mins) + "</strong><span>Minutes</span></li>" +
        "<li><strong>" + pad(secs) + "</strong><span>Seconds</span></li></ol>";
    }
    tick();
    setInterval(tick, 1000);
  }

})();
