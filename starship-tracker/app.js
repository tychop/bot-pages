/* Renders flights.json + flight-details.json. Daily flight edits: flights.json. */
(function () {
  var SITE_PHOTOS = [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SpaceX_Ignition_%2854063834163%29.jpg/1280px-SpaceX_Ignition_%2854063834163%29.jpg",
      alt: "Starship lifting off beside the Starbase tower during Flight 5",
      caption: "Flight 5 liftoff, 13 October 2024",
      credit: "Steve Jurvetson",
      license: "CC BY 2.0",
      licenseHref: "https://creativecommons.org/licenses/by/2.0/",
      href: "https://commons.wikimedia.org/wiki/File:SpaceX_Ignition_(54063834163).jpg",
      position: "center 42%",
      role: "hero",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Starship-IFT2-ascent.jpg/1280px-Starship-IFT2-ascent.jpg",
      alt: "Starship Ship 25 and Booster 9 climbing during Flight 2",
      caption: "Flight 2 ascent, Ship 25 and Booster 9",
      credit: "Osunpokeh",
      license: "CC BY-SA 4.0",
      licenseHref: "https://creativecommons.org/licenses/by-sa/4.0/",
      href: "https://commons.wikimedia.org/wiki/File:Starship-IFT2-ascent.jpg",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Starship_lifted_off_from_Starbase_during_flight_test_11.jpg/1280px-Starship_lifted_off_from_Starbase_during_flight_test_11.jpg",
      alt: "Starship climbing away from a smoke cloud during Flight 11",
      caption: "Flight 11 liftoff from Starbase",
      credit: "Shujianyang",
      license: "CC BY-SA 4.0",
      licenseHref: "https://creativecommons.org/licenses/by-sa/4.0/",
      href: "https://commons.wikimedia.org/wiki/File:Starship_lifted_off_from_Starbase_during_flight_test_11.jpg",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Full_Stack_starship.jpg/1280px-Full_Stack_starship.jpg",
      alt: "Booster 7 and Ship 24 stacked at Starbase",
      caption: "Booster 7 and Ship 24 at Starbase, 16 April 2023",
      credit: "Jenny Hautmann",
      license: "CC BY-SA 4.0",
      licenseHref: "https://creativecommons.org/licenses/by-sa/4.0/",
      href: "https://commons.wikimedia.org/wiki/File:Full_Stack_starship.jpg",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Starship_Booster_Landing_on_Mechzilla_%2854064036815%29.jpg/1280px-Starship_Booster_Landing_on_Mechzilla_%2854064036815%29.jpg",
      alt: "Super Heavy catch during Flight 5",
      caption: "Flight 5, booster catch",
      credit: "Steve Jurvetson",
      license: "CC BY 2.0",
      licenseHref: "https://creativecommons.org/licenses/by/2.0/",
      href: "https://commons.wikimedia.org/wiki/File:Starship_Booster_Landing_on_Mechzilla_(54064036815).jpg",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Launch_of_SpaceX_Starship_6_rocket_seen_from_the_International_Space_Station_%28iss072e220161%2C_cropped%29.jpg/1280px-Launch_of_SpaceX_Starship_6_rocket_seen_from_the_International_Space_Station_%28iss072e220161%2C_cropped%29.jpg",
      alt: "Flight 6 plume seen from the International Space Station",
      caption: "Flight 6, seen from the International Space Station, 19 November 2024",
      credit: "NASA",
      license: "Public domain",
      href: "https://commons.wikimedia.org/wiki/File:Launch_of_SpaceX_Starship_6_rocket_seen_from_the_International_Space_Station_(iss072e220161,_cropped).jpg",
    },
  ];

  var MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  var app = document.getElementById("app");
  var state = {
    era: "all",
    result: "any",
    q: "",
    newestFirst: true,
    expandAll: false,
    open: new Set(),
    compareA: 14,
    compareB: 15,
  };
  var detailsByN = {};
  var mediaClaims = {};

  Promise.all([
    fetch("flights.json").then(function (r) { if (!r.ok) throw new Error("flights"); return r.json(); }),
    fetch("flight-details.json").then(function (r) { if (!r.ok) throw new Error("details"); return r.json(); }),
  ])
    .then(function (pair) {
      var data = pair[0];
      var details = pair[1];
      if (!data || !Array.isArray(data.flights)) throw new Error("bad flights");
      detailsByN = (details && details.flights) || {};
      render(data);
    })
    .catch(function () {
      app.innerHTML = '<p class="loading">Could not load flight data.</p>';
    });

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mediaKey(url) {
    if (!url) return "";
    var clean = String(url).trim();
    clean = clean.replace(/[?&]t=\d+s?/i, function (m, offset) {
      return offset === clean.indexOf(m) && m.charAt(0) === "?" ? "" : "";
    });
    clean = clean.replace(/[?&]t=\d+s?/ig, "");
    clean = clean.replace(/\?&/, "?").replace(/\?$/, "").replace(/&&+/g, "&");
    return clean;
  }

  function claimMedia(url) {
    var key = mediaKey(url);
    if (!key) return false;
    if (mediaClaims[key]) return false;
    mediaClaims[key] = true;
    return true;
  }

  function licenseHtml(license, licenseHref) {
    if (!license) return "";
    return licenseHref
      ? '<a href="' + esc(licenseHref) + '">' + esc(license) + "</a>"
      : esc(license);
  }

  function shortCredit(photo) {
    return esc(photo.caption) + ". " + esc(photo.credit) + ", " + licenseHtml(photo.license, photo.licenseHref || photo.licenseUrl) + ".";
  }

  function liftoffInstant(flight) {
    if (!flight || flight.result !== "Upcoming") return null;
    var text = flight.dateLocal || "";
    if (/not announced|tbd|tba|unknown/i.test(text) && !/\d{1,2}:\d{2}\s*(CET|CEST)/i.test(text)) return null;
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
          if (key !== "href" && key !== "directUrl" && key !== "file") walk(value[key]);
        });
      }
    }
    walk(flight);
    walk(detailsByN[String(flight.n)]);
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
    if (value == null || value === "") return "";
    return "<div><dt>" + esc(label) + "</dt><dd>" + esc(value) + "</dd></div>";
  }

  function millions(amount) {
    return Math.round(Number(amount) / 1e6);
  }

  function formatUsd(amount) {
    return "$" + millions(amount) + "M";
  }

  function formatRange(estimate) {
    if (!estimate) return "";
    return "≈ $" + millions(estimate.low) + "–" + millions(estimate.high) + "M";
  }

  function estimateBlock(estimate, narrative) {
    if (!estimate) return "";
    return '<section class="cost-detail">' +
      '<div class="cost-detail-head"><h4>Estimated direct cost</h4><span class="estimate">Estimate</span></div>' +
      '<p class="cost-range">' + esc(formatRange(estimate)) + "</p>" +
      '<p class="cost-midline">Midpoint ' + esc(formatUsd(estimate.mid)) +
      (estimate.confidence ? " · Confidence: " + esc(estimate.confidence) : "") + "</p>" +
      (estimate.basis ? '<p class="cost-basis">' + esc(estimate.basis) + "</p>" : "") +
      (narrative ? '<p class="cost-narrative"><span class="lbl">Programme note</span> ' + esc(narrative) + "</p>" : "") +
      sourceList(estimate.sources, "Estimate sources") +
      "</section>";
  }

  function detailOf(flight) {
    return detailsByN[String(flight.n)] || null;
  }

  function valOrMissing(value, suffix) {
    if (value == null || value === "") return "Not published";
    return String(value) + (suffix || "");
  }

  function attributedFigure(image) {
    var src = image.src || image.directUrl;
    if (!src || !claimMedia(src)) return "";
    var page = image.pageUrl || image.href || "";
    var lic = licenseHtml(image.license, image.licenseHref || image.licenseUrl);
    var alt = image.alt || image.caption || "Starship photo";
    var img = '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true">';
    var linked = page
      ? '<a class="gallery-link" href="' + esc(page) + '" target="_blank" rel="noopener noreferrer">' + img + "</a>"
      : img;
    var caption = esc(image.caption || "");
    if (image.credit) caption += (caption ? ". " : "") + esc(image.credit);
    if (lic) caption += (caption ? ", " : "") + lic;
    if (page) caption += (caption ? ". " : "") + '<a href="' + esc(page) + '" target="_blank" rel="noopener noreferrer">Source</a>';
    if (caption) caption += ".";
    return '<figure class="gallery-item">' + linked + "<figcaption>" + caption + "</figcaption></figure>";
  }

  function galleryHtml(detail) {
    if (!detail) return "";
    var images = detail.images || [];
    if (!images.length) {
      return '<section class="block gallery-empty"><h4>Photos</h4><p class="fine">' +
        esc(detail.imagesNote || "No freely licensed photos") + "</p></section>";
    }
    var figures = images.map(attributedFigure).join("");
    return '<section class="block gallery"><h4>Photos</h4><div class="gallery-grid">' + figures + "</div></section>";
  }

  function timelineHtml(detail) {
    var items = detail && detail.timeline;
    if (!items || !items.length) return "";
    var rows = items.slice().sort(function (a, b) {
      return (a.sortSec == null ? 1e12 : a.sortSec) - (b.sortSec == null ? 1e12 : b.sortSec);
    }).map(function (row) {
      var cls = "tl-row status-" + esc(row.status || "ok");
      if (row.status === "anomaly") cls += " is-anomaly";
      return '<li class="' + cls + '">' +
        '<div class="tl-times"><span class="tl-planned">' + esc(row.planned || "—") + '</span>' +
        '<span class="tl-actual">' + esc(row.actual || "—") + "</span></div>" +
        '<div class="tl-body"><strong>' + esc(row.event) + "</strong>" +
        (row.note ? '<p class="fine">' + esc(row.note) + "</p>" : "") +
        '<p class="meta">' + esc(row.status || "") + "</p></div></li>";
    }).join("");
    return '<section class="block timeline"><h4>Mission timeline</h4>' +
      '<p class="fine">Planned vs actual T+ times. Anomaly rows are highlighted.</p>' +
      '<div class="tl-head"><span>Planned</span><span>Actual</span><span>Event</span></div>' +
      '<ol class="tl-list">' + rows + "</ol></section>";
  }

  function telemetryHtml(detail) {
    var t = detail && detail.telemetry;
    if (!t) return "";
    var rows = [
      ["Max altitude", valOrMissing(t.maxAltitudeKm, " km"), t.maxAltitudeBasis],
      ["Max speed", valOrMissing(t.maxSpeedKmh, " km/h"), t.maxSpeedBasis],
      ["Duration", valOrMissing(t.flightDuration || (t.flightDurationSec != null ? t.flightDurationSec + " s" : null)), t.flightDurationBasis],
      ["Booster engines", t.boosterEnginesLit != null || t.boosterEnginesPlanned != null
        ? valOrMissing(t.boosterEnginesLit) + " lit / " + valOrMissing(t.boosterEnginesPlanned) + " planned"
        : "Not published", t.boosterEnginesNote],
      ["Ship engines", t.shipEnginesLit != null || t.shipEnginesPlanned != null
        ? valOrMissing(t.shipEnginesLit) + " lit / " + valOrMissing(t.shipEnginesPlanned) + " planned"
        : "Not published", t.shipEnginesNote],
      ["Downrange", valOrMissing(t.downrangeKm, " km"), t.downrangeBasis],
    ];
    if (t.orbitPerigeeKm != null) rows.push(["Orbit perigee", t.orbitPerigeeKm + " km", null]);
    if (t.orbitInclinationDeg != null) rows.push(["Inclination", t.orbitInclinationDeg + "°", null]);
    if (t.stagingAltitudeKm != null) rows.push(["Staging altitude", t.stagingAltitudeKm + " km", null]);
    var body = rows.map(function (row) {
      return "<div><dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) +
        (row[2] ? '<span class="fine"> · ' + esc(row[2]) + "</span>" : "") +
        "</dd></div>";
    }).join("");
    return '<section class="block"><h4>Telemetry</h4>' +
      (t.planned ? '<p class="fine">Planned figures for an upcoming flight.</p>' : "") +
      '<dl class="facts telem">' + body + "</dl>" +
      (t.note ? '<p class="fine">' + esc(t.note) + "</p>" : "") +
      "</section>";
  }

  function vehicleChangesHtml(detail) {
    var items = detail && detail.vehicleChanges && detail.vehicleChanges.items;
    if (!items || !items.length) return "";
    return bullets("Vehicle changes vs previous flight", items);
  }

  function anomalyHtml(detail) {
    var a = detail && detail.anomaly;
    if (!a || !a.hasAnomaly) return "";
    var rows = [
      prop("Type", a.type),
      prop("Summary", a.summary),
      prop("Root cause", a.rootCause),
      prop("Corrective actions", a.correctiveActions != null ? String(a.correctiveActions) : null),
      prop("Actions summary", a.correctiveActionsSummary),
      prop("Investigation", a.investigation),
      prop("Opened", a.opened),
      prop("Closed", a.closed),
      prop("Return to flight", a.returnToFlight),
    ].join("");
    var report = "";
    if (a.reportUrl) {
      if (claimMedia(a.reportUrl)) {
        report = '<p><a href="' + esc(a.reportUrl) + '" target="_blank" rel="noopener noreferrer">Investigation / report</a></p>';
      } else {
        report = '<p class="fine">Report linked once elsewhere on this page.</p>';
      }
    }
    return '<section class="block anomaly"><h4>Anomaly</h4><dl class="facts">' + rows + "</dl>" + report + "</section>";
  }

  function videoHtml(detail) {
    var v = detail && detail.video;
    if (!v) return "";
    var parts = [];
    if (v.url && claimMedia(v.url)) {
      parts.push('<p><a class="webcast" href="' + esc(v.url) + '" target="_blank" rel="noopener noreferrer">Official webcast' +
        (v.platform ? " · " + esc(v.platform) : "") + "</a></p>");
    } else if (v.url) {
      parts.push('<p class="fine">Official webcast linked once elsewhere on this page.</p>');
    }
    if (v.timestamps && v.timestamps.length) {
      parts.push("<ul class=\"ts-list\">" + v.timestamps.map(function (stamp) {
        var label = esc(stamp.label || "Moment");
        var clock = stamp.seconds != null ? " at T+" + formatClock(stamp.seconds) : "";
        var note = stamp.note ? ' <span class="fine">(' + esc(stamp.note) + ")</span>" : "";
        // Do not emit a second link to the same clip; timestamps are text only.
        return "<li>" + label + clock + note + "</li>";
      }).join("") + "</ul>");
    }
    if (v.note) parts.push('<p class="fine">' + esc(v.note) + "</p>");
    if (!parts.length && !v.missionPage) return "";
    return '<section class="block"><h4>Video</h4>' + parts.join("") + "</section>";
  }

  function formatClock(sec) {
    var s = Math.max(0, Math.floor(Number(sec) || 0));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = s % 60;
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return h ? h + ":" + p(m) + ":" + p(r) : p(m) + ":" + p(r);
  }

  function firstsHtml(detail, flight) {
    var items = (detail && detail.firsts && detail.firsts.items) || flight.firsts || [];
    if (!items.length) return "";
    return '<section class="block"><h4>Firsts / records</h4><div class="badge-row">' +
      items.map(function (item) { return '<span class="first-badge">' + esc(item) + "</span>"; }).join("") +
      "</div></section>";
  }

  function trajectoryHtml(detail) {
    var tr = detail && detail.trajectory;
    if (!tr || !tr.launchSite) return "";
    var track = tr.groundTrack || [];
    var svg = track.length >= 2 ? mapSvg(tr) : '<p class="fine">No ground-track waypoints published.</p>';
    return '<section class="block map-block"><h4>Trajectory</h4>' +
      '<p class="fine">Approximate ground track. ' + esc(tr.groundTrackNote || "Paths are approximate.") + "</p>" +
      svg +
      '<dl class="facts">' +
      prop("Launch site", tr.launchSite.name) +
      prop("Booster zone", tr.booster && tr.booster.zone) +
      prop("Ship zone", tr.ship && tr.ship.zone) +
      prop("Inclination", tr.inclinationDeg != null ? tr.inclinationDeg + "°" : null) +
      "</dl></section>";
  }

  function mapSvg(tr) {
    var pts = (tr.groundTrack || []).filter(function (p) { return p && p.length >= 2 && p[0] != null && p[1] != null; });
    if (pts.length < 2) return "";
    var lats = pts.map(function (p) { return p[0]; });
    var lons = pts.map(function (p) { return p[1]; });
    if (tr.launchSite && tr.launchSite.lat != null) { lats.push(tr.launchSite.lat); lons.push(tr.launchSite.lon); }
    var minLat = Math.min.apply(null, lats) - 2;
    var maxLat = Math.max.apply(null, lats) + 2;
    var minLon = Math.min.apply(null, lons) - 2;
    var maxLon = Math.max.apply(null, lons) + 2;
    var w = 640;
    var h = 320;
    var pad = 18;
    function xy(lat, lon) {
      var x = pad + ((lon - minLon) / (maxLon - minLon || 1)) * (w - pad * 2);
      var y = pad + ((maxLat - lat) / (maxLat - minLat || 1)) * (h - pad * 2);
      return [x, y];
    }
    var d = pts.map(function (p, i) {
      var pair = xy(p[0], p[1]);
      return (i ? "L" : "M") + pair[0].toFixed(1) + " " + pair[1].toFixed(1);
    }).join(" ");
    var marks = "";
    if (tr.launchSite && tr.launchSite.lat != null) {
      var a = xy(tr.launchSite.lat, tr.launchSite.lon);
      marks += '<circle cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="4" fill="#fff"></circle>' +
        '<text x="' + (a[0] + 8).toFixed(1) + '" y="' + (a[1] - 8).toFixed(1) + '" fill="#fff" font-size="11">Launch</text>';
    }
    if (tr.booster && tr.booster.lat != null) {
      var b = xy(tr.booster.lat, tr.booster.lon);
      marks += '<circle cx="' + b[0].toFixed(1) + '" cy="' + b[1].toFixed(1) + '" r="3.5" fill="none" stroke="#fff"></circle>' +
        '<text x="' + (b[0] + 8).toFixed(1) + '" y="' + (b[1] + 4).toFixed(1) + '" fill="#bbb" font-size="11">Booster</text>';
    }
    if (tr.ship && tr.ship.lat != null) {
      var s = xy(tr.ship.lat, tr.ship.lon);
      marks += '<circle cx="' + s[0].toFixed(1) + '" cy="' + s[1].toFixed(1) + '" r="3.5" fill="none" stroke="#fff"></circle>' +
        '<text x="' + (s[0] + 8).toFixed(1) + '" y="' + (s[1] + 4).toFixed(1) + '" fill="#bbb" font-size="11">Ship</text>';
    } else if (pts.length) {
      var end = xy(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      marks += '<text x="' + Math.min(end[0], w - 80).toFixed(1) + '" y="' + (end[1] - 8).toFixed(1) + '" fill="#bbb" font-size="11">Approx. path end</text>';
    }
    return '<svg class="track-map" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="Approximate ground track">' +
      '<rect width="' + w + '" height="' + h + '" fill="#0a0a0a"></rect>' +
      '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>' +
      marks + "</svg>";
  }

  function regulatoryHtml(detail) {
    var r = detail && detail.regulatory;
    if (!r) return "";
    var debris = (r.debrisImpacts || []).length
      ? "<ul>" + r.debrisImpacts.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") + "</ul>"
      : "";
    return '<section class="block"><h4>Regulatory and environment</h4><dl class="facts">' +
      prop("FAA licence", r.licenceDate || "Not published") +
      prop("Licence note", r.licenceNote) +
      prop("Mishap opened", r.mishapOpened || "None / not published") +
      prop("Mishap closed", r.mishapClosed || (r.mishapOpened ? "Not published" : "—")) +
      prop("Mishap duration", r.mishapDurationDays != null ? r.mishapDurationDays + " days" : null) +
      prop("Return to flight", r.returnToFlight) +
      prop("Days since previous flight", r.daysSincePrevious != null ? String(r.daysSincePrevious) : "Not published") +
      "</dl>" + (debris ? '<div class="block"><h4>Debris / airspace</h4>' + debris + "</div>" : "") +
      "</section>";
  }

  function detailsPanel(flight) {
    var detail = detailOf(flight);
    if (!detail) return "";
    return galleryHtml(detail) +
      firstsHtml(detail, flight) +
      timelineHtml(detail) +
      telemetryHtml(detail) +
      vehicleChangesHtml(detail) +
      anomalyHtml(detail) +
      videoHtml(detail) +
      trajectoryHtml(detail) +
      regulatoryHtml(detail);
  }

  function flightCard(flight) {
    var open = isOpen(flight.n);
    var uncertain = flight.uncertain && flight.uncertain.length;
    var goalsTitle = flight.result === "Upcoming" ? "Planned goals" : "Mission goals";
    var lessonsTitle = flight.result === "Upcoming" ? "Preparation so far" : "Lessons and changes afterwards";
    var resultCls = flight.result === "Failure" ? " failure" : "";
    var range = formatRange(flight.costEstimate);
    var marks = '<span class="tag' + resultCls + '">' + esc(flight.result) + "</span>" +
      (uncertain ? '<span class="tag uncertain">Uncertain</span>' : "");
    var body =
      '<p class="summary">' + esc(flight.summary) + "</p>" +
      estimateBlock(flight.costEstimate, flight.cost) +
      '<dl class="facts">' +
      prop("Liftoff", (flight.dateLocal || "") + (flight.utc ? " (" + flight.utc + ")" : "")) +
      prop("Booster / ship", (flight.booster || "") + " / " + (flight.ship || "")) +
      prop("Version", flight.version) +
      prop("Launch pad", flight.pad) +
      prop("Booster outcome", flight.boosterOutcome) +
      prop("Ship outcome", flight.shipOutcome) +
      prop("FAA", flight.faa) +
      "</dl>" +
      bullets(goalsTitle, flight.goals) +
      splitBlock(flight.achieved, flight.failed) +
      bullets(lessonsTitle, flight.lessons) +
      (uncertain
        ? '<section class="uncertain"><h4>Uncertain or disputed</h4><ul>' +
          flight.uncertain.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") +
          "</ul></section>"
        : "") +
      detailsPanel(flight) +
      sourceList(flight.sources, "Sources");

    return '<article class="launch" id="flight-' + flight.n + '">' +
      '<h3><button type="button" class="launch-toggle" data-flight="' + flight.n + '" aria-expanded="' + open + '" aria-controls="flight-panel-' + flight.n + '">' +
      '<span class="launch-n">' + esc(flight.n) + "</span>" +
      '<span class="launch-main"><span class="launch-date">' + esc(flight.dateLocal) + "</span>" +
      (range ? '<span class="launch-cost">' + esc(range) + ' <span class="estimate-inline">Estimate</span></span>' : "") +
      '<span class="launch-sub">' + esc(flight.boosterShort) + " / " + esc(flight.shipShort) + " · " + esc(flight.era) + "</span></span>" +
      '<span class="launch-marks">' + marks + "</span>" +
      '<span class="chev" aria-hidden="true"></span>' +
      "</button></h3>" +
      '<div class="launch-body" id="flight-panel-' + flight.n + '"' + (open ? "" : " hidden") + ">" + body + "</div></article>";
  }

  function render(data) {
    mediaClaims = {};
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

    // Claim hero image once up front so photography section skips it.
    claimMedia(SITE_PHOTOS[0].src);

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
      '<p class="lede">Open a flight for gallery, timeline, telemetry, trajectory and sources. Times are CET/CEST as listed.</p>' +
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
      compareHtml(data) +
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
    var photo = SITE_PHOTOS[0];
    if (!upcoming) {
      return '<section class="hero" id="next"><img class="hero-img" src="' + esc(photo.src) + '" alt="' + esc(photo.alt) + '" loading="eager" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true">' +
        '<div class="hero-shade"></div><div class="hero-copy"><p class="eyebrow">Starship</p><h1 class="hero-flight"><span>Flight</span> tracker</h1></div>' +
        '<p class="hero-credit">' + shortCredit(photo) +
        (photo.href ? ' <a href="' + esc(photo.href) + '">Source</a>.' : "") +
        "</p></section>";
    }
    var brief = data.next && Number(data.next.aboutFlight) === upcoming.n ? data.next : null;
    var vehicles = (upcoming.boosterShort || upcoming.booster) + " / " + (upcoming.shipShort || upcoming.ship);
    var meta = [vehicles, upcoming.version, upcoming.pad].filter(Boolean).join("  ·  ");
    var range = formatRange(upcoming.costEstimate);
    return '<section class="hero" id="next">' +
      '<img class="hero-img" src="' + esc(photo.src) + '" alt="' + esc(photo.alt) + '" style="object-position:' + esc(photo.position) + '" loading="eager" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true">' +
      '<div class="hero-shade"></div>' +
      '<div class="hero-copy"><p class="eyebrow">Next launch</p>' +
      '<h1 class="hero-flight"><span>Flight</span> ' + esc(upcoming.n) + "</h1>" +
      '<p class="hero-date">' + esc(upcoming.dateLocal) + "</p>" +
      '<p class="hero-vehicles">' + esc(meta) + "</p>" +
      (range ? '<p class="hero-cost">' + esc(range) + ' <span class="estimate-inline">Estimate</span></p>' : "") +
      (brief && brief.status ? '<p class="status-line">' + esc(brief.status) + "</p>" : "") +
      '<div id="countdown" hidden></div>' +
      "</div>" +
      '<p class="hero-credit">' + shortCredit(photo) +
      (photo.href ? ' <a href="' + esc(photo.href) + '">Source</a>.' : "") +
      "</p></section>";
  }

  function nextDetail(data, upcoming) {
    if (!upcoming) {
      return '<section class="band"><div class="wrap"><h2>Next flight</h2><p class="empty">No upcoming flight is listed.</p></div></section>';
    }
    var brief = data.next && Number(data.next.aboutFlight) === upcoming.n ? data.next : null;
    var detail = detailOf(upcoming);
    var rows = [
      prop("Target", upcoming.dateLocal),
      prop("Vehicles", upcoming.booster + " / " + upcoming.ship + (upcoming.version ? ", " + upcoming.version : "")),
      prop("Pad", upcoming.pad),
    ];
    if (brief) {
      rows.splice(1, 0, prop("Time zone", brief.timezone));
      rows.push(prop("Plan", brief.plan), prop("Hardware", brief.hardware));
    }
    if (detail && detail.launchWindow) {
      rows.push(prop("Window", detail.launchWindow.windowMinutes + " minutes · opens " + detail.launchWindow.netLocal + " / " + detail.launchWindow.netCT));
    }
    return '<section class="band" id="next-detail"><div class="wrap"><p class="kicker">Up next</p><h2>Flight ' + esc(upcoming.n) + "</h2>" +
      (upcoming.summary ? '<p class="lede">' + esc(upcoming.summary) + "</p>" : "") +
      estimateBlock(upcoming.costEstimate, upcoming.cost) +
      '<dl class="facts">' + rows.join("") + "</dl>" +
      (brief && brief.callout ? '<p class="callout">' + esc(brief.callout) + "</p>" : "") +
      "</div></section>";
  }

  function compareHtml(data) {
    var options = data.flights.map(function (f) {
      return '<option value="' + f.n + '">Flight ' + f.n + " · " + esc(f.result) + "</option>";
    }).join("");
    return '<section class="band" id="compare"><div class="wide"><h2>Compare flights</h2>' +
      '<p class="lede">Text and stats only. No photos or webcasts here.</p>' +
      '<div class="compare-picks">' +
      '<label class="field"><span class="lbl">Flight A</span><select id="compare-a">' + options + "</select></label>" +
      '<label class="field"><span class="lbl">Flight B</span><select id="compare-b">' + options + "</select></label>" +
      '</div><div id="compare-out"></div></div></section>';
  }

  function compareTable(data) {
    var a = data.flights.find(function (f) { return f.n === Number(state.compareA); });
    var b = data.flights.find(function (f) { return f.n === Number(state.compareB); });
    if (!a || !b) return '<p class="empty">Pick two flights.</p>';
    var da = detailOf(a) || {};
    var db = detailOf(b) || {};
    var ta = da.telemetry || {};
    var tb = db.telemetry || {};
    function cellList(items) {
      if (!items || !items.length) return "—";
      return items.map(function (item) { return "• " + item; }).join("\n");
    }
    var rows = [
      ["Outcome", a.result, b.result],
      ["Date", a.dateLocal, b.dateLocal],
      ["Vehicles", a.boosterShort + " / " + a.shipShort, b.boosterShort + " / " + b.shipShort],
      ["Cost estimate", formatRange(a.costEstimate) || "—", formatRange(b.costEstimate) || "—"],
      ["Goals", cellList(a.goals), cellList(b.goals)],
      ["Booster outcome", a.boosterOutcome, b.boosterOutcome],
      ["Ship outcome", a.shipOutcome, b.shipOutcome],
      ["Max altitude", valOrMissing(ta.maxAltitudeKm, " km"), valOrMissing(tb.maxAltitudeKm, " km")],
      ["Max speed", valOrMissing(ta.maxSpeedKmh, " km/h"), valOrMissing(tb.maxSpeedKmh, " km/h")],
      ["Duration", valOrMissing(ta.flightDuration), valOrMissing(tb.flightDuration)],
      ["Booster engines", (ta.boosterEnginesLit != null ? ta.boosterEnginesLit : "—") + " / " + (ta.boosterEnginesPlanned != null ? ta.boosterEnginesPlanned : "—"),
        (tb.boosterEnginesLit != null ? tb.boosterEnginesLit : "—") + " / " + (tb.boosterEnginesPlanned != null ? tb.boosterEnginesPlanned : "—")],
      ["Ship engines", (ta.shipEnginesLit != null ? ta.shipEnginesLit : "—") + " / " + (ta.shipEnginesPlanned != null ? ta.shipEnginesPlanned : "—"),
        (tb.shipEnginesLit != null ? tb.shipEnginesLit : "—") + " / " + (tb.shipEnginesPlanned != null ? tb.shipEnginesPlanned : "—")],
      ["Downrange", valOrMissing(ta.downrangeKm, " km"), valOrMissing(tb.downrangeKm, " km")],
    ];
    return '<div class="compare-grid" role="table">' +
      '<div class="compare-head" role="row"><span></span><span>Flight ' + a.n + "</span><span>Flight " + b.n + "</span></div>" +
      rows.map(function (row) {
        return '<div class="compare-row" role="row"><span class="compare-label">' + esc(row[0]) +
          "</span><span>" + esc(row[1]).replace(/\n/g, "<br>") +
          "</span><span>" + esc(row[2]).replace(/\n/g, "<br>") + "</span></div>";
      }).join("") + "</div>";
  }

  function laterHtml(data) {
    var cards = (data.later || []).map(function (item) {
      var range = formatRange(item.costEstimate);
      return '<li><p class="when">' + esc(item.when) + "</p><h3>" + esc(item.mission) + "</h3>" +
        (range ? '<p class="manifest-cost">' + esc(range) + ' <span class="estimate-inline">Estimate</span></p>' : "") +
        '<p class="meta">' + esc(item.vehicles) + " · " + esc(item.site) + "</p>" +
        "<p>" + esc(item.note) + "</p>" +
        (item.costEstimate && item.costEstimate.basis ? '<p class="cost-basis">' + esc(item.costEstimate.basis) + "</p>" : "") +
        '<p class="meta">Basis: ' + esc(item.confidence) +
        (item.costEstimate && item.costEstimate.confidence ? " · Cost confidence: " + esc(item.costEstimate.confidence) : "") +
        "</p>" +
        sourceList(item.costEstimate && item.costEstimate.sources, "Estimate sources") +
        "</li>";
    }).join("");
    return '<section class="band" id="later"><div class="wrap"><h2>Later on the manifest</h2>' +
      (data.laterCaption ? '<p class="lede">' + esc(data.laterCaption) + "</p>" : "") +
      '<ol class="manifest">' + cards + "</ol>" +
      (data.laterNote ? '<p class="note">' + esc(data.laterNote) + "</p>" : "") +
      "</div></section>";
  }

  function costsHtml(data) {
    var flights = data.flights || [];
    var maxHigh = flights.reduce(function (max, flight) {
      return Math.max(max, flight.costEstimate ? flight.costEstimate.high : 0);
    }, 0) || 1;
    var flownMids = flights.filter(function (flight) {
      return flight.result !== "Upcoming" && flight.costEstimate;
    }).reduce(function (sum, flight) { return sum + flight.costEstimate.mid; }, 0);
    var chart = flights.slice().sort(function (a, b) { return a.n - b.n; }).map(function (flight) {
      var estimate = flight.costEstimate;
      if (!estimate) return "";
      var projected = flight.result === "Upcoming";
      var left = (estimate.low / maxHigh) * 100;
      var width = ((estimate.high - estimate.low) / maxHigh) * 100;
      var mid = (estimate.mid / maxHigh) * 100;
      return '<div class="cost-row' + (projected ? " is-projected" : " is-flown") + '">' +
        '<span class="cost-n">F' + esc(flight.n) + "</span>" +
        '<div class="cost-track" role="img" aria-label="' + esc("Flight " + flight.n + " " + formatRange(estimate) + (projected ? ", projected" : ", flown")) + '">' +
        '<span class="cost-band" style="left:' + left + "%;width:" + width + '%"></span>' +
        '<span class="cost-fill" style="width:' + mid + '%"></span>' +
        "</div>" +
        '<span class="cost-val">' + esc(formatRange(estimate)) + "</span></div>";
    }).join("");
    var method = data.costMethod || {};
    var inputs = (method.inputs || []).map(function (input) {
      var href = typeof input.href === "string" && /^https:\/\//.test(input.href) ? input.href : "";
      var title = esc(input.source_title || input.claim || "Source");
      return '<li><p class="input-claim">' + esc(input.claim || "") + "</p>" +
        '<p class="input-value">' + esc(input.value || "") + "</p>" +
        (href
          ? '<p class="meta"><a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + title + "</a></p>"
          : '<p class="meta">' + title + "</p>") +
        "</li>";
    }).join("");
    var programme = (data.costs || []).map(function (cost) {
      return '<li><p class="cost-figure">' + esc(cost.figure) + ' <span class="estimate">Estimate</span></p>' +
        "<p>" + esc(cost.covers) + '</p><p class="meta">Source: ' + esc(cost.source) + "</p></li>";
    }).join("");
    return '<section class="band" id="costs"><div class="wide"><h2>What it costs</h2>' +
      '<p class="lede">Rough per-flight direct-launch estimates. Not SpaceX prices, invoices or audited accounts. <span class="estimate-inline">Estimate</span></p>' +
      '<div class="cost-summary"><p class="cost-range">Flown flights ≈ ' + esc(formatUsd(flownMids)) +
      ' cumulative midpoint</p><p class="fine">Sum of midpoints for Flights 1–14. Low–high bars show the planning range for each flight.</p></div>' +
      '<div class="cost-legend"><span class="legend-flown">Flown</span><span class="legend-projected">Projected</span></div>' +
      '<div class="cost-chart">' + chart + "</div>" +
      (method.text ? '<section class="method"><h3>Method</h3><p class="note">' + esc(method.text) + "</p></section>" : "") +
      (inputs ? '<section class="method-inputs"><h3>Model inputs</h3><ol class="manifest">' + inputs + "</ol></section>" : "") +
      '<section class="programme"><h3>Programme totals</h3>' +
      (data.costNote ? '<p class="fine">' + esc(data.costNote) + "</p>" : "") +
      '<ol class="manifest">' + programme + "</ol></section>" +
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
    var items = SITE_PHOTOS.map(function (photo) {
      if (photo.role === "hero") {
        return "<li><p>" + shortCredit(photo) +
          (photo.href ? ' <a href="' + esc(photo.href) + '">Source</a>.' : "") +
          " Used once as the page hero (hotlinked).</p></li>";
      }
      var fig = attributedFigure(photo);
      if (!fig) {
        return "<li><p>" + shortCredit(photo) + " Already shown once elsewhere.</p></li>";
      }
      return "<li class=\"credit-card\">" + fig + "</li>";
    }).join("");
    return '<section class="band" id="credits"><div class="wrap"><h2>Photography</h2>' +
      '<p class="lede">Site and flight photographs are hotlinked from Wikimedia Commons or Flickr with attribution. Each media URL appears once.</p>' +
      '<ul class="credits site-credits">' + items + "</ul></div></section>";
  }

  function renderList(data) {
    var list = shownFlights(data);
    var order = state.newestFirst ? "newest first" : "oldest first";
    document.getElementById("showing").textContent = "Showing " + list.length + " of " + data.flights.length + ", " + order + ".";
    // Re-render open flights with a fresh media claim pass limited to currently open cards + always-on sections already claimed.
    // Simpler approach: full render already claimed media for open=expandAll; for incremental list re-render we rebuild bodies using a temporary claim map that includes already claimed.
    document.getElementById("list").innerHTML = list.length
      ? list.map(flightCard).join("")
      : '<p class="empty">No flights match these filters.</p>';
    renderCompare(data);
  }

  function renderCompare(data) {
    var a = document.getElementById("compare-a");
    var b = document.getElementById("compare-b");
    if (!a || !b) return;
    a.value = String(state.compareA);
    b.value = String(state.compareB);
    document.getElementById("compare-out").innerHTML = compareTable(data);
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
      // Full re-render to re-claim media correctly when expanding all
      render(data);
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
      render(data);
      var again = app.querySelector('.launch-toggle[data-flight="' + n + '"]');
      if (again) again.focus();
    });
    document.getElementById("compare-a").addEventListener("change", function (event) {
      state.compareA = Number(event.target.value);
      renderCompare(data);
    });
    document.getElementById("compare-b").addEventListener("change", function (event) {
      state.compareB = Number(event.target.value);
      renderCompare(data);
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
        el.innerHTML = '<p class="status-line">Window open / liftoff time passed</p>';
        return;
      }
      var seconds = Math.floor(diff / 1000);
      var days = Math.floor(seconds / 86400);
      var hours = Math.floor((seconds % 86400) / 3600);
      var mins = Math.floor((seconds % 3600) / 60);
      var secs = seconds % 60;
      el.innerHTML = '<ol class="countdown" aria-label="Time until window opens">' +
        "<li><strong>" + days + "</strong><span>Days</span></li>" +
        "<li><strong>" + pad(hours) + "</strong><span>Hours</span></li>" +
        "<li><strong>" + pad(mins) + "</strong><span>Minutes</span></li>" +
        "<li><strong>" + pad(secs) + "</strong><span>Seconds</span></li></ol>";
    }
    tick();
    setInterval(tick, 1000);
  }
})();
