# Starship Flight Tracker

Static multi-page site for GitHub Pages. No build step.

## Pages

| File | Role |
|------|------|
| `index.html` | Home — next flight only (countdown, FAA, goals, livestream) + last-flight card |
| `flights.html` | Compact list of every flight |
| `flight.html?n=N` | One flight’s full detail |
| `compare.html` | Side-by-side text compare |
| `costs.html` | Per-flight estimates + programme totals |
| `about.html` | Notes, later roadmap, photography credits |

Top nav: Home · Flights · Compare · Costs · About.

Legacy single-page hashes on `index.html` (`#flights`, `#compare`, `#costs`, `#later`, `#notes`, …) redirect to the new pages.

## Data (edit these for daily updates)

- `flights.json` — flight facts, next brief, costs, notes, later manifest, `lastUpdated` / `lastUpdatedLabel`
- `flight-details.json` — per-flight images, timeline, telemetry, video, trajectory, …

HTML/JS do not need changes for normal data updates. After editing JSON, bump nothing unless you also change CSS/JS (then bump `?v=` in every HTML file).

## Scripts

- `shared.js` — load JSON, formatting, media claim map, shared section HTML
- `site.js` — chrome/nav + per-page renderers (`body[data-page]`)
- `styles.css` — dark SpaceX-style layout
- `fonts/` — Barlow / Barlow Condensed

Cache-bust query on CSS/JS links (currently `20261108e`).

## Media uniqueness

Runtime `claimMedia` is first-claim-wins **per page load**. The home hero (`SITE_PHOTOS[0]`) is reserved on flights list and flight detail so that photo is not reused in galleries. Prefer keeping distinct images per flight in `flight-details.json`.

## Local preview

```bash
cd starship-tracker
python3 -m http.server 8765
# open http://127.0.0.1:8765/
```
