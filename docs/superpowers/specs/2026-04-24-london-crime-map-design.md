# SafeWorld — London Borough Crime Map: Design Spec

**Date:** 2026-04-24  
**Stack:** Vanilla HTML/CSS/JS (ES Modules), no build step  
**Deployment target:** GitHub Pages or Netlify

---

## 1. Overview

SafeWorld is a public-facing, portfolio-quality web app that visualises crime levels across all 33 London boroughs using live data from the `data.police.uk` API. Each borough is scored 1–10 relative to the others and colour-graded on a green-to-red heat scale. Users can filter by crime category, select a historical month, look up their postcode or borough, and drill into per-borough detail including a category breakdown and month-over-month trend.

---

## 2. Architecture & File Structure

```
SafeWorld/
├── index.html
├── config.example.js          # committed template — no real keys
├── config.js                  # gitignored — real API keys live here
├── .gitignore                 # excludes config.js
├── styles/
│   ├── main.css               # layout, typography, responsive breakpoints
│   └── components.css         # sidebar, panels, legend, filter controls
├── js/
│   ├── main.js                # entry point — initialises app, wires modules
│   ├── state.js               # shared reactive app state
│   ├── api.js                 # data.police.uk + postcodes.io fetching, sessionStorage cache
│   ├── scoring.js             # relative ranking algorithm → 1–10 score
│   ├── map.js                 # Google Maps init, GeoJSON polygon rendering, colouring
│   └── ui.js                  # sidebar, filter panel, detail panel, CSS bar chart
├── data/
│   └── london-boroughs.geojson   # static polygon boundaries for all 33 boroughs
└── docs/
    └── superpowers/specs/
```

### Data Flow

1. App loads → `map.js` initialises Google Maps dynamically (key read from `config.js`), loads GeoJSON borough polygons as an overlay layer
2. `api.js` fetches crime totals for all 33 boroughs in parallel (`Promise.all`) for the current month and selected category — results cached in `sessionStorage` keyed by `{category}-{month}`
3. `scoring.js` ranks boroughs 1–10 by total crime count relative to each other
4. `map.js` colours each borough polygon on the green→yellow→red scale by score
5. User clicks a borough → `api.js` fetches category breakdown + previous month data for trend; `ui.js` renders the detail panel
6. User changes category filter or month → `scoring.js` re-scores on cached data (or fetches if not cached), `map.js` re-colours polygons
7. User submits postcode/borough lookup → `api.js` resolves via `postcodes.io`, map pans to matching borough and opens detail panel

---

## 3. API Keys & Secrets

Two API keys are required:

| Key | Used for |
|-----|----------|
| `GOOGLE_MAPS_API_KEY` | Google Maps JS SDK |

`data.police.uk` and `postcodes.io` require no API key. `config.js` structure can accommodate additional keys if a paid data source is added later.

**`config.example.js`** (committed):
```js
export const GOOGLE_MAPS_API_KEY = 'YOUR_KEY_HERE';
```

**`config.js`** (gitignored — developer creates locally):
```js
export const GOOGLE_MAPS_API_KEY = 'real-key-here';
```

Google Maps is loaded dynamically in `map.js` by creating a `<script>` tag at runtime using the imported key. The key never appears in `index.html` or any committed file.

---

## 4. External APIs

### `data.police.uk` (no key required)
- **Crime data:** `GET /api/crimes-street/{category}?poly={borough-polygon}&date={YYYY-MM}`
- `category` is either `all-crime` or a specific category slug (e.g. `theft-from-the-person`)
- Borough polygon coordinates are derived from the bundled GeoJSON at query time
- Supports up to 12 months of historical data
- Rate limit: no hard published limit but requests are throttled — parallel fetches across 33 boroughs are acceptable

### `postcodes.io` (no key required)
- **Postcode lookup:** `GET /postcodes/{postcode}` — returns `admin_district` (London borough name)
- Used only when user submits a postcode in the search input
- Falls back to direct borough name matching if the input doesn't look like a postcode

---

## 5. Scoring Algorithm (`scoring.js`)

All functions are pure (no DOM or API dependencies).

1. Accept an array of `{ borough, crimeCount }` objects
2. Sort ascending by `crimeCount`
3. Assign rank 1 (fewest crimes) to 33 (most crimes)
4. Map rank to score: `score = Math.ceil((rank / 33) * 10)` → produces integer 1–10
5. Return enriched array: `{ borough, crimeCount, rank, score }`

When a category filter changes, re-run on filtered totals already in state — no additional API calls if data is cached.

---

## 6. Colour Scale

| Score | Colour | Hex |
|-------|--------|-----|
| 1–2 | Green | `#2ecc71` |
| 3–4 | Yellow-green | `#a8d44a` |
| 5–6 | Amber | `#f1c40f` |
| 7–8 | Orange | `#e67e22` |
| 9–10 | Red | `#e74c3c` |

- Polygon fill opacity: `0.65` (map detail visible beneath)
- Hover: opacity increases to `0.85`, cursor changes to pointer
- Click: border stroke weight increases to indicate selection

---

## 7. UI Components

### Sidebar (always visible, collapses to bottom drawer on mobile)
- **App title + tagline**
- **Unified search input** — accepts postcode (e.g. `E8 1DY`) or borough name (e.g. `Hackney`); resolves postcode via `postcodes.io`, matches borough name locally against GeoJSON; on match zooms map + opens detail panel; on fail shows inline error
- **Crime category filter** — dropdown: All Crime, Anti-social Behaviour, Burglary, Drugs, Theft, Vehicle Crime, Violence & Sexual Offences
- **Month selector** — defaults to current month, allows selection up to 12 months back
- **Colour legend** — 1–10 scale with Safest / Most Dangerous labels
- **Top 5 / Bottom 5 panel** — ranked list of most and least dangerous boroughs for current filter, updates when filter changes
- **Export CSV button** — downloads current borough scores, crime counts, and ranks as a `.csv` file

### Detail Panel (slides in on borough click, dismissible)
- Borough name + score badge (colour-matched)
- Trend indicator vs previous month: `▲ +12%` (red) or `▼ -7%` (green)
- Total crime count for selected period and category
- Crime category breakdown — horizontal CSS bar chart (no external chart library), bars sized proportionally to each category's share
- Close button

### Map
- Centred on London (`51.5074, -0.1278`), initial zoom 10
- Borough polygons rendered from bundled GeoJSON via Google Maps Data Layer
- Hover tooltip: borough name + current score
- Click: selects borough, opens detail panel
- Loading state: semi-transparent grey overlay on polygons while data fetches, spinner in sidebar

---

## 8. URL Hash State

State is encoded in the URL hash for shareability and browser history support:

```
#borough=Hackney&category=theft-from-the-person&month=2025-02
```

- On load, `state.js` reads hash and initialises filters accordingly
- On any state change, hash is updated without triggering a page reload
- Browser back/forward navigates filter history correctly

---

## 9. Error Handling

- Per-borough fetch failures are isolated — failed boroughs render as grey with "Data unavailable" tooltip; other boroughs still display normally
- API rate limit (429) or network failure shows a non-blocking banner: "Some data could not be loaded — showing partial results"
- `postcodes.io` failure or non-London postcode shows inline error in the search input: "Postcode not found in a London borough"
- All async errors are caught; no unhandled promise rejections
- `sessionStorage` quota exceeded is caught silently — fetch proceeds without caching

---

## 10. Testing Strategy

- **Unit tests (`scoring.js`):** Pure functions tested via `/test.html` using `console.assert` — no test framework, no dependencies. Covers: correct rank assignment, score mapping, edge cases (all boroughs equal crime count, single borough)
- **API integration tests (`api.js`):** Pointed at a fixed historical month where data is stable — verifies response shape, borough count (33), and that `sessionStorage` cache is populated on second call
- **Manual checklist:**
  - [ ] Polygon colours render correctly on load
  - [ ] Hover tooltip shows borough name + score
  - [ ] Click opens detail panel with correct data
  - [ ] Category filter re-colours map
  - [ ] Month selector fetches new data
  - [ ] Postcode lookup zooms to correct borough
  - [ ] Borough name lookup zooms to correct borough
  - [ ] Invalid postcode shows error message
  - [ ] URL hash round-trips correctly (share link → reload → same state)
  - [ ] CSV export downloads and contains correct data
  - [ ] Mobile layout: sidebar collapses to bottom drawer
  - [ ] Partial API failure shows grey polygon + banner
- **Lighthouse audit:** Run before final submission, targeting 90+ Performance, 100 Accessibility

---

## 11. Out of Scope

- User accounts or saved preferences
- Real-time (sub-minute) data updates
- Crime data outside Greater London
- Service Worker / offline support (can be added later without restructuring)
- Any backend — this is a fully static client-side app
