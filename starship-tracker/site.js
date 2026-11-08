/* Multi-page Starship tracker. Pages set body[data-page]; shared.js provides Starship.*. */
(function () {
  var S = window.Starship;
  if (!S) {
    document.getElementById("main").innerHTML = '<p class="loading">Could not load scripts.</p>';
    return;
  }

  var PAGE = document.body.getAttribute("data-page") || "home";
  var ASSET_V = "20261108a";

  var NAV = [
    { id: "home", href: "index.html", label: "Home" },
    { id: "flights", href: "flights.html", label: "Flights" },
    { id: "compare", href: "compare.html", label: "Compare" },
    { id: "costs", href: "costs.html", label: "Costs" },
    { id: "about", href: "about.html", label: "About" },
  ];

  redirectLegacyHash();

  S.loadData()
    .then(function (data) {
      paintChrome(data);
      try {
        if (PAGE === "home") renderHome(data);
        else if (PAGE === "flights") renderFlights(data);
        else if (PAGE === "flight") renderFlight(data);
        else if (PAGE === "compare") renderCompare(data);
        else if (PAGE === "costs") renderCosts(data);
        else if (PAGE === "about") renderAbout(data);
        else renderHome(data);
      } catch (err) {
        console.error(err);
        document.getElementById("main").innerHTML = '<p class="loading">Something went wrong rendering this page.</p>';
      }
      S.bindStickyOffsets();
      bindTimelineDelegation();
      bindNavToggle();
    })
    .catch(function (err) {
      console.error(err);
      var main = document.getElementById("main");
      if (main) main.innerHTML = '<p class="loading">Could not load flight data.</p>';
    });

  function redirectLegacyHash() {
    if (PAGE !== "home") return;
    var hash = (location.hash || "").toLowerCase();
    var map = {
      "#flights": "flights.html",
      "#next": "index.html",
      "#compare": "compare.html",
      "#costs": "costs.html",
      "#later": "about.html#roadmap",
      "#notes": "about.html",
      "#credits": "about.html#photography",
      "#overview": "index.html",
      "#next-detail": "index.html",
    };
    if (map[hash]) {
      location.replace(map[hash]);
    }
  }

  function paintChrome(data) {
    var top = document.getElementById("topbar");
    if (!top) return;
    var active = PAGE === "flight" ? "flights" : PAGE;
    var links = NAV.map(function (item) {
      var isActive = item.id === active;
      return '<a href="' + item.href + '"' + (isActive ? ' aria-current="page" class="is-active"' : "") + ">" +
        S.esc(item.label) + "</a>";
    }).join("");
    top.innerHTML =
      '<a class="wordmark" href="index.html">Starship</a>' +
      '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>' +
      '<nav class="topnav" id="site-nav" aria-label="Site">' + links + "</nav>" +
      '<p class="updated" id="updated"></p>';
    var stamp = document.getElementById("updated");
    if (stamp) stamp.textContent = "Last updated " + (data.lastUpdatedLabel || data.lastUpdated || "");
    if (data.title) {
      var titles = {
        home: data.title,
        flights: "Flights · " + data.title,
        flight: "Flight · " + data.title,
        compare: "Compare · " + data.title,
        costs: "Costs · " + data.title,
        about: "About · " + data.title,
      };
      document.title = titles[PAGE] || data.title;
    }
  }

  function bindNavToggle() {
    var btn = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
      btn.textContent = open ? "Close" : "Menu";
    });
  }

  function bindTimelineDelegation() {
    var main = document.getElementById("main");
    if (!main) return;
    main.addEventListener("click", function (event) {
      var expandAllBtn = event.target.closest(".tl-expand-all");
      if (expandAllBtn) {
        var timeline = expandAllBtn.closest(".timeline");
        if (!timeline) return;
        var open = expandAllBtn.getAttribute("data-expanded") !== "true";
        timeline.querySelectorAll(".tl-summary[aria-expanded]").forEach(function (btn) {
          S.setTimelineRow(btn, open);
        });
        expandAllBtn.setAttribute("data-expanded", open ? "true" : "false");
        expandAllBtn.textContent = open ? "Collapse all" : "Expand all";
        return;
      }
      var tlSummary = event.target.closest(".tl-summary[aria-expanded]");
      if (tlSummary) {
        var next = tlSummary.getAttribute("aria-expanded") !== "true";
        S.setTimelineRow(tlSummary, next);
        S.syncTimelineExpandAll(tlSummary.closest(".timeline"));
      }
    });
  }

  function resultClass(result) {
    return result === "Failure" ? " failure" : "";
  }

  function livestreamHtml(detail) {
    var v = detail && detail.video;
    if (!v) return "";
    var href = v.url || v.missionPage || "";
    if (!href) {
      return '<p class="home-stream muted">Webcast not posted yet — usually ~30 minutes before liftoff on spacex.com / X.</p>';
    }
    var label = v.url ? "Watch livestream" : "Flight page / webcast";
    return '<p class="home-stream"><a class="btn" href="' + S.esc(href) + '" target="_blank" rel="noopener noreferrer">' +
      label + "</a></p>";
  }

  function renderHome(data) {
    S.resetMediaClaims();
    var upcoming = S.upcomingFlight(data);
    var last = S.lastFlownFlight(data);
    var photo = S.SITE_PHOTOS[0];
    S.claimMedia(photo.src);
    var main = document.getElementById("main");
    if (!upcoming) {
      main.innerHTML =
        '<section class="home-hero bare">' +
        '<div class="wrap">' +
        '<p class="eyebrow">Starship</p>' +
        "<h1>No upcoming flight listed</h1>" +
        '<p class="lede">Check the <a href="flights.html">flights list</a> for the latest flown missions.</p>' +
        lastCard(last) +
        "</div></section>";
      return;
    }
    var detail = S.detailOf(upcoming);
    var brief = data.next && Number(data.next.aboutFlight) === upcoming.n ? data.next : null;
    var goals = (upcoming.goals || []).slice(0, 3);
    var vehicles = (upcoming.boosterShort || upcoming.booster || "") + " / " + (upcoming.shipShort || upcoming.ship || "");
    var faa = (brief && brief.status) || upcoming.faa || "FAA status not published";
    var tzLabel = /CEST/i.test(upcoming.dateLocal || "") ? "CEST (UTC+2)" : /CET/i.test(upcoming.dateLocal || "") ? "CET (UTC+1)" : "Netherlands time";

    main.innerHTML =
      '<section class="home-hero">' +
      S.heroPhotoHtml(photo) +
      '<div class="hero-shade"></div>' +
      '<div class="hero-copy wrap-hero">' +
      '<p class="eyebrow">Next launch</p>' +
      '<h1 class="hero-flight"><span>Flight</span> ' + S.esc(upcoming.n) + "</h1>" +
      '<p class="hero-date">' + S.esc(upcoming.dateLocal) + '</p>' +
      '<p class="hero-tz">Liftoff time in ' + S.esc(tzLabel) + "</p>" +
      '<div id="countdown" class="home-countdown" hidden></div>' +
      '<p class="status-line">' + S.esc(faa) + "</p>" +
      '<p class="hero-vehicles">' + S.esc(vehicles) +
      (upcoming.version ? " · " + S.esc(upcoming.version) : "") +
      (upcoming.pad ? " · " + S.esc(upcoming.pad) : "") +
      "</p>" +
      (goals.length
        ? '<ul class="home-goals">' + goals.map(function (g) { return "<li>" + S.esc(g) + "</li>"; }).join("") + "</ul>"
        : "") +
      livestreamHtml(detail) +
      '<p class="hero-actions"><a class="text-link" href="flight.html?n=' + upcoming.n + '">Full flight details</a></p>' +
      "</div>" +
      '<p class="hero-credit">' + S.shortCredit(photo) +
      (photo.href ? ' <a href="' + S.esc(photo.href) + '">Source</a>.' : "") +
      "</p>" +
      "</section>" +
      '<section class="home-below wrap">' + lastCard(last) + "</section>";

    S.startCountdown(upcoming);
  }

  function lastCard(last) {
    if (!last) return "";
    return '<a class="last-flight" href="flight.html?n=' + last.n + '">' +
      '<p class="eyebrow">Last flight</p>' +
      '<p class="last-n">Flight ' + S.esc(last.n) + "</p>" +
      '<p class="last-meta">' + S.esc(last.dateLocal) + "</p>" +
      '<p class="last-result"><span class="tag' + resultClass(last.result) + '">' + S.esc(last.result) + "</span></p>" +
      "</a>";
  }

  function thumbForFlight(flight) {
    var detail = S.detailOf(flight);
    var images = (detail && detail.images) || [];
    for (var i = 0; i < images.length; i += 1) {
      var reserved = S.reservePhoto(images[i]);
      if (!reserved) continue;
      return '<div class="flight-thumb photo-frame">' +
        S.photoImgHtml({
          src: reserved.src,
          fallback: reserved.fallback,
          page: reserved.page,
          alt: images[i].alt || ("Flight " + flight.n),
          loading: "lazy",
        }) +
        "</div>";
    }
    return '<div class="flight-thumb is-empty" aria-hidden="true"></div>';
  }

  function renderFlights(data) {
    S.resetMediaClaims();
    S.reserveHeroMedia();
    var list = S.sortedFlights(data, true);
    var rows = list.map(function (flight) {
      var uncertain = flight.uncertain && flight.uncertain.length;
      return '<a class="flight-row" href="flight.html?n=' + flight.n + '">' +
        thumbForFlight(flight) +
        '<span class="flight-row-n">' + S.esc(flight.n) + "</span>" +
        '<span class="flight-row-main">' +
        '<span class="flight-row-date">' + S.esc(flight.dateLocal) + "</span>" +
        '<span class="flight-row-sub">' + S.esc(flight.boosterShort) + " / " + S.esc(flight.shipShort) +
        " · " + S.esc(flight.era) + "</span></span>" +
        '<span class="flight-row-marks">' +
        '<span class="tag' + resultClass(flight.result) + '">' + S.esc(flight.result) + "</span>" +
        (uncertain ? '<span class="tag uncertain">Uncertain</span>' : "") +
        "</span></a>";
    }).join("");

    document.getElementById("main").innerHTML =
      '<section class="page-band">' +
      '<div class="wrap">' +
      '<header class="page-head band-head"><h1>Flights</h1>' +
      '<p class="lede">Every integrated flight. Open one for timeline, photos and sources.</p></header>' +
      '<div class="flight-index">' + rows + "</div>" +
      "</div></section>";
  }

  function renderFlight(data) {
    S.resetMediaClaims();
    S.reserveHeroMedia();
    S.state.expandAll = true;
    var params = new URLSearchParams(location.search);
    var n = Number(params.get("n"));
    var flight = S.flightByN(data, n);
    var main = document.getElementById("main");
    if (!flight) {
      main.innerHTML = '<section class="page-band"><div class="wrap"><h1>Flight not found</h1>' +
        '<p class="lede"><a href="flights.html">Back to all flights</a></p></div></section>';
      return;
    }
    document.title = "Flight " + flight.n + " · " + (data.title || "Starship");
    var uncertain = flight.uncertain && flight.uncertain.length;
    var goalsTitle = flight.result === "Upcoming" ? "Planned goals" : "Mission goals";
    var lessonsTitle = flight.result === "Upcoming" ? "Preparation so far" : "Lessons and changes afterwards";
    var sorted = S.sortedFlights(data, false);
    var idx = sorted.findIndex(function (f) { return f.n === flight.n; });
    var prev = idx > 0 ? sorted[idx - 1] : null;
    var next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;

    var body =
      '<p class="launch-outcome">' +
      '<span class="tag' + resultClass(flight.result) + '">' + S.esc(flight.result) + "</span>" +
      (uncertain ? '<span class="tag uncertain">Uncertain</span>' : "") +
      "</p>" +
      '<p class="summary">' + S.esc(flight.summary) + "</p>" +
      S.estimateBlock(flight.costEstimate, flight.cost) +
      '<dl class="facts">' +
      S.prop("Liftoff", (flight.dateLocal || "") + (flight.utc ? " (" + flight.utc + ")" : "")) +
      S.prop("Booster / ship", (flight.booster || "") + " / " + (flight.ship || "")) +
      S.prop("Version", flight.version) +
      S.prop("Launch pad", flight.pad) +
      S.prop("Booster outcome", flight.boosterOutcome) +
      S.prop("Ship outcome", flight.shipOutcome) +
      S.prop("FAA", flight.faa) +
      "</dl>" +
      S.bullets(goalsTitle, flight.goals) +
      S.splitBlock(flight.achieved, flight.failed) +
      S.bullets(lessonsTitle, flight.lessons) +
      (uncertain
        ? '<section class="uncertain"><h4>Uncertain or disputed</h4><ul>' +
          flight.uncertain.map(function (item) { return "<li>" + S.esc(item) + "</li>"; }).join("") +
          "</ul></section>"
        : "") +
      S.detailsPanel(flight) +
      S.sourceList(flight.sources, "Sources");

    main.innerHTML =
      '<section class="page-band flight-detail">' +
      '<div class="wrap">' +
      '<header class="page-head band-head flight-sticky-title">' +
      '<p class="eyebrow"><a href="flights.html">All flights</a></p>' +
      "<h1>Flight " + S.esc(flight.n) + "</h1>" +
      '<p class="hero-date">' + S.esc(flight.dateLocal) + "</p>" +
      '<p class="flight-sub">' + S.esc(flight.boosterShort) + " / " + S.esc(flight.shipShort) +
      " · " + S.esc(flight.era) + "</p>" +
      "</header>" +
      '<div class="flight-detail-body">' + body + "</div>" +
      '<nav class="flight-pager" aria-label="Adjacent flights">' +
      (prev
        ? '<a class="pager-link" href="flight.html?n=' + prev.n + '"><span class="pager-label">Previous</span><span class="pager-n">Flight ' +
          S.esc(prev.n) + "</span></a>"
        : '<span></span>') +
      (next
        ? '<a class="pager-link next" href="flight.html?n=' + next.n + '"><span class="pager-label">Next</span><span class="pager-n">Flight ' +
          S.esc(next.n) + "</span></a>"
        : '<span></span>') +
      "</nav>" +
      "</div></section>";
  }

  function renderCompare(data) {
    S.resetMediaClaims();
    S.state.compareA = S.state.compareA || 14;
    S.state.compareB = S.state.compareB || 15;
    var options = data.flights.map(function (f) {
      return '<option value="' + f.n + '">Flight ' + f.n + " · " + S.esc(f.result) + "</option>";
    }).join("");
    document.getElementById("main").innerHTML =
      '<section class="page-band"><div class="wide wrap-wide">' +
      '<header class="page-head band-head"><h1>Compare</h1>' +
      '<p class="lede">Text and stats only — no photos or webcasts.</p></header>' +
      '<div class="compare-picks">' +
      '<label class="field"><span class="lbl">Flight A</span><select id="compare-a">' + options + "</select></label>" +
      '<label class="field"><span class="lbl">Flight B</span><select id="compare-b">' + options + "</select></label>" +
      '</div><div id="compare-out"></div></div></section>';
    document.getElementById("compare-a").value = String(S.state.compareA);
    document.getElementById("compare-b").value = String(S.state.compareB);
    document.getElementById("compare-out").innerHTML = S.compareTable(data);
    document.getElementById("compare-a").addEventListener("change", function (event) {
      S.state.compareA = Number(event.target.value);
      document.getElementById("compare-out").innerHTML = S.compareTable(data);
    });
    document.getElementById("compare-b").addEventListener("change", function (event) {
      S.state.compareB = Number(event.target.value);
      document.getElementById("compare-out").innerHTML = S.compareTable(data);
    });
  }

  function renderCosts(data) {
    S.resetMediaClaims();
    var html = S.costsHtml(data);
    // costsHtml already wraps in a band with h2 — restyle via page class
    document.getElementById("main").innerHTML = '<div class="page-costs">' + html + "</div>";
  }

  function renderAbout(data) {
    S.resetMediaClaims();
    var notes = (data.notes || []).map(function (note) { return "<li>" + S.esc(note) + "</li>"; }).join("");
    document.getElementById("main").innerHTML =
      '<section class="page-band" id="notes"><div class="wrap">' +
      '<header class="page-head band-head"><h1>About</h1>' +
      '<p class="lede">' + S.esc(data.intro || "") + "</p></header>" +
      (data.timezoneNote ? '<p class="timezone">' + S.esc(data.timezoneNote) + "</p>" : "") +
      "<h2>Notes and uncertainties</h2>" +
      '<ul class="about-notes">' + notes + "</ul>" +
      S.sourceList(data.indexLinks, "Further reading") +
      "</div></section>" +
      S.laterHtml(data).replace('id="later"', 'id="roadmap"') +
      S.creditsHtml().replace('id="credits"', 'id="photography"');
  }
})();
