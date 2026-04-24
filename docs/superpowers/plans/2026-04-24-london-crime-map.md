# SafeWorld: London Borough Crime Map — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public-facing vanilla JS web app that colour-grades all 33 London boroughs 1–10 for crime severity on a live Google Maps heat overlay, using the data.police.uk API.

**Architecture:** ES Module architecture — each JS file has one responsibility (state, api, scoring, map, ui). Modules communicate through a central state store rather than calling each other directly, keeping each unit independently testable and replaceable. No build step; the whole project is static files deployable to GitHub Pages or Netlify.

**Tech Stack:** Vanilla HTML/CSS/JS (ES Modules), Google Maps JS API (dynamic load), data.police.uk REST API, postcodes.io REST API, sessionStorage for caching.

---

## File Map

| File | Responsibility |
|------|---------------|
| `index.html` | Shell HTML — no logic, just structure and module entry point |
| `config.js` | Gitignored — holds Google Maps API key |
| `config.example.js` | Committed template showing key shape |
| `data/london-boroughs.geojson` | Static polygon boundaries for 33 boroughs |
| `js/main.js` | Bootstrap — loads data, wires all modules together, owns URL hash |
| `js/state.js` | Reactive store — single source of truth for category, month, boroughData, selectedBorough |
| `js/api.js` | All network calls — crime data, postcode lookup, sessionStorage caching |
| `js/scoring.js` | Pure functions — relative ranking, score→colour mapping |
| `js/map.js` | Google Maps init, GeoJSON layer, polygon colouring, pan-to-borough |
| `js/ui.js` | All DOM rendering — sidebar, filters, legend, rankings, detail panel, CSV export |
| `styles/main.css` | Layout — flexbox shell, map container, responsive breakpoints |
| `styles/components.css` | Component styles — sidebar, detail panel, bars, badges, legend |
| `test.html` | In-browser unit tests for scoring.js (no test framework) |

---

## Task 1: Project Scaffolding

**Why we do this first:** Setting up `.gitignore` before any other file is the most important step in the whole project. If you accidentally commit `config.js` with your real API key, it is publicly visible in git history forever — even if you delete it in a later commit. By gitignoring it from the start, that risk is eliminated. In interviews this shows you understand secrets management from day one, not as an afterthought.

**Files:**
- Create: `.gitignore`
- Create: `config.example.js`
- Create: `index.html`
- Create: `styles/main.css` (empty)
- Create: `styles/components.css` (empty)
- Create: `js/main.js` (empty)
- Create: `js/state.js` (empty)
- Create: `js/api.js` (empty)
- Create: `js/scoring.js` (empty)
- Create: `js/map.js` (empty)
- Create: `js/ui.js` (empty)
- Create: `test.html` (empty)
- Create: `data/` (directory)

- [ ] **Step 1: Create .gitignore**

```
config.js
node_modules/
.DS_Store
Thumbs.db
```

- [ ] **Step 2: Create config.example.js**

```js
export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
```

- [ ] **Step 3: Create config.js locally (never commit this file)**

```js
export const GOOGLE_MAPS_API_KEY = 'paste-your-actual-key-here';
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SafeWorld — London Crime Map</title>
  <link rel="stylesheet" href="styles/main.css" />
  <link rel="stylesheet" href="styles/components.css" />
</head>
<body>
  <div id="app">
    <aside id="sidebar">
      <div id="sidebar-header">
        <h1>SafeWorld</h1>
        <p id="tagline">London Borough Crime Map</p>
      </div>

      <div id="search-section">
        <label for="location-search">Search borough or postcode</label>
        <input
          id="location-search"
          type="text"
          placeholder="e.g. Hackney or E8 1DY"
          autocomplete="off"
          aria-label="Search by borough name or postcode"
        />
        <p id="search-error" class="error-msg hidden" role="alert"></p>
      </div>

      <div id="filter-section">
        <label for="category-filter">Crime Category</label>
        <select id="category-filter" aria-label="Filter by crime category"></select>
        <label for="month-filter">Month</label>
        <select id="month-filter" aria-label="Select month"></select>
      </div>

      <div id="legend" aria-label="Crime score colour legend"></div>

      <div id="rankings" aria-label="Borough rankings"></div>

      <button id="export-btn" type="button">Export CSV</button>
    </aside>

    <main id="map-container">
      <div id="map" aria-label="London borough crime map"></div>
      <div id="loading-overlay" class="hidden" aria-live="polite">
        <div class="spinner"></div>
        <p>Loading crime data…</p>
      </div>
      <div id="error-banner" class="hidden" role="alert"></div>
    </main>

    <div id="detail-panel" aria-label="Borough crime detail">
      <button id="close-detail" type="button" aria-label="Close detail panel">×</button>
      <div id="detail-content"></div>
    </div>
  </div>

  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create all empty JS and CSS files**

Create these as empty files so imports don't throw 404 errors:
- `styles/main.css`
- `styles/components.css`
- `js/main.js`
- `js/state.js`
- `js/api.js`
- `js/scoring.js`
- `js/map.js`
- `js/ui.js`
- `test.html`

Also create the `data/` directory (can be empty for now).

- [ ] **Step 6: Verify .gitignore is protecting config.js**

```bash
git status
```

Expected output: `config.js` does NOT appear anywhere in the output. `config.example.js`, `index.html`, etc. appear as untracked files.

- [ ] **Step 7: Commit scaffold**

```bash
git add .gitignore config.example.js index.html styles/ js/ test.html
git commit -m "feat: project scaffold — HTML shell, file structure, secrets protection"
git push origin master
```

---

## Task 2: London Borough GeoJSON

**Why we bundle this as a static file:** The GeoJSON defines polygon shapes for all 33 boroughs and never changes (London's boundaries are fixed). Bundling it removes a network dependency on load and makes the polygon coordinates instantly available for both map rendering and police API queries. This is a classic "static data goes static" decision you can articulate in any interview.

**Files:**
- Create: `data/london-boroughs.geojson`

- [ ] **Step 1: Download the pre-filtered London borough GeoJSON**

In your terminal, run:

```bash
curl -L "https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson" -o data/london-boroughs.geojson
```

If curl is not available, open the URL in a browser and save the file as `data/london-boroughs.geojson`.

- [ ] **Step 2: Verify the file structure**

Open `data/london-boroughs.geojson` in any text editor or JSON viewer and confirm:

1. It is a valid `FeatureCollection`
2. It has exactly 33 features
3. Each feature has a `properties.name` field (e.g. `"Hackney"`, `"Westminster"`)
4. Each feature's geometry coordinates are arrays of `[longitude, latitude]` pairs

Expected sample feature:
```json
{
  "type": "Feature",
  "properties": { "name": "Hackney", "id": "E09000012" },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[-0.025, 51.555], [-0.030, 51.558], ...]]
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add data/london-boroughs.geojson
git commit -m "feat: add London borough GeoJSON polygon boundaries (33 boroughs)"
git push origin master
```

---

## Task 3: scoring.js — Pure Functions with TDD

**Why we write this module first (and test-first):** `scoring.js` contains pure functions — they take inputs and return outputs with zero side effects. No DOM, no network, no global state. That makes them the easiest thing in the codebase to test rigorously, and the safest place to practise TDD. Writing the tests first locks in the correct behaviour before any code exists, so when other modules depend on `scoreToColour()` or `rankBoroughs()`, there's no ambiguity about what they return. Pure functions are a strong interview talking point — they demonstrate separation of concerns and functional thinking.

**Files:**
- Create: `js/scoring.js`
- Modify: `test.html`

- [ ] **Step 1: Write the failing tests in test.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>SafeWorld — Tests</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #111; color: #eee; }
    .pass { color: #2ecc71; }
    .fail { color: #e74c3c; }
    .summary { margin-top: 16px; font-size: 1.2em; }
  </style>
</head>
<body>
<h2>SafeWorld Test Suite</h2>
<pre id="output"></pre>
<script type="module">
  import { rankBoroughs, scoreToColour } from './js/scoring.js';

  const out = document.getElementById('output');
  let passed = 0, failed = 0;

  function assert(label, condition) {
    const el = document.createElement('span');
    el.className = condition ? 'pass' : 'fail';
    el.textContent = `${condition ? '✓' : '✗'} ${label}\n`;
    out.appendChild(el);
    condition ? passed++ : failed++;
  }

  // --- rankBoroughs ---

  const threeBorough = [
    { name: 'Hackney', crimeCount: 300 },
    { name: 'Richmond', crimeCount: 100 },
    { name: 'Westminster', crimeCount: 500 },
  ];
  const r3 = rankBoroughs(threeBorough);

  assert('rankBoroughs: returns same length array', r3.length === 3);
  assert('rankBoroughs: Richmond (fewest crimes) gets rank 1', r3.find(b => b.name === 'Richmond').rank === 1);
  assert('rankBoroughs: Westminster (most crimes) gets rank 3', r3.find(b => b.name === 'Westminster').rank === 3);
  assert('rankBoroughs: Westminster gets score 10', r3.find(b => b.name === 'Westminster').score === 10);
  assert('rankBoroughs: each result has rank, score, name, crimeCount', r3.every(b => 'rank' in b && 'score' in b && 'name' in b && 'crimeCount' in b));
  assert('rankBoroughs: does not mutate input array', threeBorough[0].rank === undefined);

  // With 33 boroughs the scale should produce min=1 and max=10
  const thirtyThree = Array.from({ length: 33 }, (_, i) => ({ name: `B${i}`, crimeCount: i * 10 }));
  const r33 = rankBoroughs(thirtyThree);
  assert('rankBoroughs: 33 boroughs — min score is 1', Math.min(...r33.map(b => b.score)) === 1);
  assert('rankBoroughs: 33 boroughs — max score is 10', Math.max(...r33.map(b => b.score)) === 10);

  // Equal crime counts: should all get same rank (or sequential) — scores should not crash
  const equal = [
    { name: 'A', crimeCount: 100 },
    { name: 'B', crimeCount: 100 },
    { name: 'C', crimeCount: 100 },
  ];
  const rEqual = rankBoroughs(equal);
  assert('rankBoroughs: equal crime counts — no NaN scores', rEqual.every(b => !isNaN(b.score)));
  assert('rankBoroughs: equal crime counts — scores in range 1-10', rEqual.every(b => b.score >= 1 && b.score <= 10));

  // --- scoreToColour ---

  assert('scoreToColour: score 1 returns green #2ecc71', scoreToColour(1) === '#2ecc71');
  assert('scoreToColour: score 5 returns amber #f1c40f', scoreToColour(5) === '#f1c40f');
  assert('scoreToColour: score 10 returns dark red #c0392b', scoreToColour(10) === '#c0392b');
  assert('scoreToColour: unknown score returns grey #cccccc', scoreToColour(0) === '#cccccc');
  assert('scoreToColour: undefined returns grey #cccccc', scoreToColour(undefined) === '#cccccc');

  // Summary
  const summary = document.createElement('p');
  summary.className = 'summary';
  summary.textContent = `${passed} passed, ${failed} failed`;
  summary.style.color = failed === 0 ? '#2ecc71' : '#e74c3c';
  document.body.appendChild(summary);
</script>
</body>
</html>
```

- [ ] **Step 2: Run tests — confirm they FAIL**

Start a local server (required for ES module imports):
```bash
python -m http.server 8000
```

Open `http://localhost:8000/test.html`

Expected: Red failures — "rankBoroughs is not a function" or similar, because `js/scoring.js` is empty.

- [ ] **Step 3: Implement js/scoring.js**

```js
// js/scoring.js

export function rankBoroughs(boroughs) {
  const sorted = [...boroughs].sort((a, b) => a.crimeCount - b.crimeCount);
  return sorted.map((borough, index) => {
    const rank = index + 1;
    const score = Math.ceil((rank / sorted.length) * 10);
    return { ...borough, rank, score };
  });
}

export function scoreToColour(score) {
  const palette = {
    1: '#2ecc71',
    2: '#5dbd5d',
    3: '#a8d44a',
    4: '#c8d44a',
    5: '#f1c40f',
    6: '#f39c12',
    7: '#e67e22',
    8: '#d35400',
    9: '#e74c3c',
    10: '#c0392b',
  };
  return palette[score] ?? '#cccccc';
}
```

- [ ] **Step 4: Run tests — confirm they PASS**

Refresh `http://localhost:8000/test.html`

Expected:
```
✓ rankBoroughs: returns same length array
✓ rankBoroughs: Richmond (fewest crimes) gets rank 1
✓ rankBoroughs: Westminster (most crimes) gets rank 3
✓ rankBoroughs: Westminster gets score 10
✓ rankBoroughs: each result has rank, score, name, crimeCount
✓ rankBoroughs: does not mutate input array
✓ rankBoroughs: 33 boroughs — min score is 1
✓ rankBoroughs: 33 boroughs — max score is 10
✓ rankBoroughs: equal crime counts — no NaN scores
✓ rankBoroughs: equal crime counts — scores in range 1-10
✓ scoreToColour: score 1 returns green #2ecc71
✓ scoreToColour: score 5 returns amber #f1c40f
✓ scoreToColour: score 10 returns dark red #c0392b
✓ scoreToColour: unknown score returns grey #cccccc
✓ scoreToColour: undefined returns grey #cccccc

15 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add js/scoring.js test.html
git commit -m "feat: scoring module — relative borough ranking and colour mapping (TDD)"
git push origin master
```

---

## Task 4: state.js — Reactive State Store

**Why a central state store:** Without a shared store, modules pass data to each other via function arguments and event callbacks, which quickly becomes tangled — especially when multiple modules need to react to the same change (e.g. both the map and the rankings panel need to update when the category filter changes). A central store gives every module a single source of truth to read from and a single place to write to. This is the same architectural pattern behind Redux, Zustand, and Pinia — so you can explain it in interviews as "a lightweight implementation of the observer pattern / pub-sub."

**Files:**
- Modify: `js/state.js`

- [ ] **Step 1: Implement js/state.js**

```js
// js/state.js

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const _state = {
  category: 'all-crime',
  month: currentMonth(),
  selectedBorough: null,
  boroughData: [],
  loading: false,
  partialError: false,
};

const _listeners = {};

export function getState() {
  return { ..._state };
}

export function setState(updates) {
  Object.assign(_state, updates);
  Object.keys(updates).forEach(key => {
    (_listeners[key] ?? []).forEach(fn => fn(_state[key], _state));
  });
}

export function subscribe(key, fn) {
  if (!_listeners[key]) _listeners[key] = [];
  _listeners[key].push(fn);
}
```

- [ ] **Step 2: Add state tests to test.html**

Add the following test block inside the `<script type="module">` in `test.html`, after the existing scoring tests and before the summary:

```js
  // --- state ---
  // Import inline to avoid circular deps in test context
  const stateModule = await import('./js/state.js');
  const { getState, setState, subscribe } = stateModule;

  const initial = getState();
  assert('state: initial category is all-crime', initial.category === 'all-crime');
  assert('state: initial boroughData is empty array', Array.isArray(initial.boroughData) && initial.boroughData.length === 0);

  let fired = false;
  subscribe('category', val => { fired = val; });
  setState({ category: 'drugs' });
  assert('state: setState triggers subscriber', fired === 'drugs');
  assert('state: getState reflects update', getState().category === 'drugs');

  // Reset for other tests
  setState({ category: 'all-crime' });
```

- [ ] **Step 3: Run tests — all must pass**

Refresh `http://localhost:8000/test.html`

Expected: all previous tests still pass + 3 new state tests pass.

- [ ] **Step 4: Commit**

```bash
git add js/state.js test.html
git commit -m "feat: reactive state store — pub/sub pattern for shared app state"
git push origin master
```

---

## Task 5: api.js — Crime Data Fetching

**Why we use Promise.allSettled instead of Promise.all:** `Promise.all` fails fast — if any single borough's API call fails, the entire batch is rejected and no boroughs render. `Promise.allSettled` waits for every call to finish regardless of outcome. Failed boroughs are marked with `failed: true` and rendered grey; successful boroughs still display normally. This makes the app resilient to partial API outages, which is important for a public-facing tool and shows defensive programming in interviews.

**Why sessionStorage caching:** The police API data for a given month is fixed — it won't change while the user is browsing. Caching the response in sessionStorage means repeat filter changes that revisit the same month/category are instant. The cache is automatically cleared when the browser tab closes, so stale data never persists across sessions.

**Files:**
- Modify: `js/api.js`

- [ ] **Step 1: Implement js/api.js**

```js
// js/api.js

const POLICE_API = 'https://data.police.uk/api';
const POSTCODES_API = 'https://api.postcodes.io';

// Reduce polygon vertex count so the URL stays under browser limits (~2000 chars).
// Every Nth point is kept, targeting ~25 points for the API query parameter.
function simplifyPolygon(coords, targetPoints = 25) {
  if (coords.length <= targetPoints) return coords;
  const step = Math.floor(coords.length / targetPoints);
  return coords.filter((_, i) => i % step === 0).slice(0, targetPoints);
}

// GeoJSON stores coordinates as [longitude, latitude].
// The police API wants "lat,lng:lat,lng:..." — so we swap the order.
// Handles both Polygon and MultiPolygon geometry types.
function polygonToApiParam(geometry) {
  const ring = geometry.type === 'MultiPolygon'
    ? geometry.coordinates[0][0]
    : geometry.coordinates[0];
  const simplified = simplifyPolygon(ring);
  return simplified.map(([lng, lat]) => `${lat},${lng}`).join(':');
}

function cacheKey(boroughName, category, month) {
  return `sw:${boroughName}:${category}:${month}`;
}

async function fetchBoroughCrimes(feature, category, month) {
  const name = feature.properties.name;
  const key = cacheKey(name, category, month);

  const cached = sessionStorage.getItem(key);
  if (cached) return { name, crimes: JSON.parse(cached) };

  // Pass geometry object (not just coordinates) so polygonToApiParam can check the type.
  // We do NOT encodeURIComponent(poly) — the string only contains digits, commas, minus
  // signs, and colons, none of which need encoding, and encoding colons breaks some API parsers.
  const poly = polygonToApiParam(feature.geometry);
  const url = `${POLICE_API}/crimes-street/${category}?poly=${poly}&date=${month}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${name}`);

  const crimes = await res.json();

  try {
    sessionStorage.setItem(key, JSON.stringify(crimes));
  } catch (_) {
    // sessionStorage quota exceeded — continue without caching
  }

  return { name, crimes };
}

// Fetches crime totals for all boroughs in parallel.
// Returns { boroughData: [...], hasErrors: boolean }
export async function fetchAllBoroughs(geojson, category, month) {
  const results = await Promise.allSettled(
    geojson.features.map(f => fetchBoroughCrimes(f, category, month))
  );

  let hasErrors = false;
  const boroughData = results.map((result, i) => {
    if (result.status === 'fulfilled') {
      const { name, crimes } = result.value;
      return { name, crimeCount: crimes.length, crimes };
    }
    hasErrors = true;
    return { name: geojson.features[i].properties.name, crimeCount: 0, crimes: [], failed: true };
  });

  return { boroughData, hasErrors };
}

// Fetches the detailed breakdown for a single borough:
// crime category counts + trend vs previous month.
export async function fetchBoroughDetail(feature, category, month) {
  const current = await fetchBoroughCrimes(feature, category, month);

  // Calculate previous month string (e.g. "2025-03" → "2025-02")
  const [year, mon] = month.split('-').map(Number);
  const prevDate = new Date(year, mon - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const previous = await fetchBoroughCrimes(feature, category, prevMonth).catch(() => null);

  // Count crimes per category for the breakdown bar chart
  const breakdown = {};
  current.crimes.forEach(crime => {
    breakdown[crime.category] = (breakdown[crime.category] || 0) + 1;
  });

  return {
    name: current.name,
    crimeCount: current.crimes.length,
    breakdown,
    previousCount: previous ? previous.crimes.length : null,
  };
}

// Resolves a user-typed postcode or borough name to a borough name string.
// Returns the borough name string, or null if not found / not in London.
export async function lookupLocation(query) {
  const trimmed = query.trim();
  const noSpaces = trimmed.toUpperCase().replace(/\s+/g, '');

  // Postcode pattern: 1-2 letters + digit(s) + space? + digit + 2 letters
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(noSpaces)) {
    try {
      const res = await fetch(`${POSTCODES_API}/postcodes/${encodeURIComponent(noSpaces)}`);
      if (!res.ok) return null;
      const data = await res.json();
      const borough = data.result?.admin_district ?? null;
      // postcodes.io returns the London borough name for London postcodes
      return borough;
    } catch (_) {
      return null;
    }
  }

  // Not a postcode — treat as a borough name and return as-is.
  // map.js will attempt to find a matching feature by name.
  return trimmed;
}
```

- [ ] **Step 2: Verify the API works manually**

Open the browser console at `http://localhost:8000` and run:

```js
import('./js/api.js').then(async api => {
  const geo = await fetch('./data/london-boroughs.geojson').then(r => r.json());
  const hackney = geo.features.find(f => f.properties.name === 'Hackney');
  const result = await api.fetchBoroughDetail(hackney, 'all-crime', '2024-01');
  console.log(result);
});
```

Expected: An object like `{ name: 'Hackney', crimeCount: 412, breakdown: { 'violent-crime': 95, ... }, previousCount: 398 }`.

- [ ] **Step 3: Commit**

```bash
git add js/api.js
git commit -m "feat: api module — police data fetching, sessionStorage cache, postcode lookup"
git push origin master
```

---

## Task 6: map.js — Google Maps Init + Borough Polygon Layer

**Why we load Google Maps dynamically in JS instead of a `<script>` tag in HTML:** A `<script src="...?key=YOUR_KEY">` in `index.html` would expose the API key in a committed file. By creating the script tag at runtime in `map.js` after importing the key from the gitignored `config.js`, the key never touches any file that git tracks. This is the standard technique for protecting browser-side API keys in static apps — worth explaining clearly in any interview.

**Why we use Google Maps Data Layer instead of custom overlays:** The Data Layer accepts GeoJSON directly via `map.data.addGeoJson()`. It handles all the polygon rendering, hit-testing (hover/click events on polygons), and style management for us. We don't need to write any polygon math. It also supports per-feature style overrides (`map.data.overrideStyle(feature, {...})`) which is how we apply colour-coding per borough.

**Files:**
- Modify: `js/map.js`

- [ ] **Step 1: Implement js/map.js**

```js
// js/map.js
import { GOOGLE_MAPS_API_KEY } from '../config.js';
import { scoreToColour } from './scoring.js';

let _map = null;
let _infoWindow = null;
let _boroughData = [];

// Dynamically appends the Google Maps script tag using the key from config.js.
// Returns a Promise that resolves once the Maps API is ready.
function loadMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Maps SDK'));
    document.head.appendChild(script);
  });
}

export async function initMap(containerId) {
  await loadMapsScript();
  _map = new google.maps.Map(document.getElementById(containerId), {
    center: { lat: 51.5074, lng: -0.1278 },
    zoom: 10,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    ],
  });
  _infoWindow = new google.maps.InfoWindow();
}

// Loads GeoJSON borough polygons onto the map.
// onBoroughClick(boroughName) is called when a polygon is clicked.
export function loadBoroughLayer(geojson, onBoroughClick) {
  _map.data.addGeoJson(geojson);
  _map.data.setStyle({
    fillColor: '#cccccc',
    fillOpacity: 0.65,
    strokeColor: '#ffffff',
    strokeWeight: 1,
    cursor: 'pointer',
  });

  _map.data.addListener('mouseover', e => {
    const name = e.feature.getProperty('name');
    const borough = _boroughData.find(b => b.name === name);
    const score = borough?.score ?? '?';
    _infoWindow.setContent(
      `<div style="font-family:sans-serif;padding:4px 8px">
        <strong>${name}</strong><br>Score: ${score}/10
      </div>`
    );
    _infoWindow.setPosition(e.latLng);
    _infoWindow.open(_map);
    _map.data.overrideStyle(e.feature, { fillOpacity: 0.85, strokeWeight: 2 });
  });

  _map.data.addListener('mouseout', () => {
    _infoWindow.close();
    _map.data.revertStyle();
  });

  _map.data.addListener('click', e => {
    onBoroughClick(e.feature.getProperty('name'));
  });
}

// Colours all borough polygons based on their score.
// Also stores boroughData so the hover tooltip can show the score.
export function colourBoroughs(boroughData) {
  _boroughData = boroughData;
  _map.data.forEach(feature => {
    const name = feature.getProperty('name');
    const borough = boroughData.find(b => b.name === name);
    const colour = borough?.failed ? '#cccccc' : scoreToColour(borough?.score ?? 5);
    _map.data.overrideStyle(feature, { fillColor: colour, fillOpacity: 0.65 });
  });
}

// Pans and zooms the map to fit the named borough.
// Returns true if the borough was found, false otherwise.
export function panToBorough(boroughName) {
  let found = false;
  _map.data.forEach(feature => {
    if (feature.getProperty('name') !== boroughName) return;
    const bounds = new google.maps.LatLngBounds();
    feature.getGeometry().forEachLatLng(latlng => bounds.extend(latlng));
    _map.fitBounds(bounds);
    found = true;
  });
  return found;
}
```

- [ ] **Step 2: Verify map initialises**

Open `http://localhost:8000` in browser. The Google Maps tile should load centred on London with a grey polygon overlay for each borough.

Expected: Map renders, 33 grey polygons visible, hovering shows InfoWindow with borough name and "Score: ?/10".

- [ ] **Step 3: Commit**

```bash
git add js/map.js
git commit -m "feat: map module — Google Maps init, GeoJSON data layer, polygon hover/click"
git push origin master
```

---

## Task 7: ui.js — Sidebar, Filters, Legend, Rankings, Detail Panel

**Why all DOM manipulation lives in ui.js:** Keeping rendering logic in one file means that if we ever swap the rendering approach (e.g. to a framework), only `ui.js` changes — not `api.js` or `scoring.js`. It also means the business logic modules (`scoring.js`, `api.js`) are never tangled with DOM concerns, which makes them reusable and testable in isolation. This is the single responsibility principle in practice.

**Why CSS bar charts instead of a chart library:** A chart library (Chart.js, D3) adds tens of kilobytes of dependency to a portfolio project. CSS bars are a handful of lines and demonstrate that you don't reach for a library when the DOM can do the job.

**Files:**
- Modify: `js/ui.js`

- [ ] **Step 1: Implement js/ui.js**

```js
// js/ui.js
import { scoreToColour } from './scoring.js';

const CATEGORIES = [
  { value: 'all-crime',               label: 'All Crime' },
  { value: 'anti-social-behaviour',   label: 'Anti-social Behaviour' },
  { value: 'burglary',                label: 'Burglary' },
  { value: 'drugs',                   label: 'Drugs' },
  { value: 'robbery',                 label: 'Robbery' },
  { value: 'theft-from-the-person',   label: 'Theft from Person' },
  { value: 'vehicle-crime',           label: 'Vehicle Crime' },
  { value: 'violent-crime',           label: 'Violence & Sexual Offences' },
];

export function initFilters(onCategoryChange, onMonthChange) {
  const catSelect = document.getElementById('category-filter');
  CATEGORIES.forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    catSelect.appendChild(opt);
  });
  catSelect.addEventListener('change', () => onCategoryChange(catSelect.value));

  const monthSelect = document.getElementById('month-filter');
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    monthSelect.appendChild(opt);
  }
  monthSelect.addEventListener('change', () => onMonthChange(monthSelect.value));
}

export function setFilterValues(category, month) {
  const catSelect = document.getElementById('category-filter');
  const monthSelect = document.getElementById('month-filter');
  if (category) catSelect.value = category;
  if (month) monthSelect.value = month;
}

// Returns search control helpers after wiring up the input.
export function initSearch(onSearch) {
  const input = document.getElementById('location-search');
  const error = document.getElementById('search-error');

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !input.value.trim()) return;
    error.classList.add('hidden');
    onSearch(input.value);
  });

  return {
    showError: msg => {
      error.textContent = msg;
      error.classList.remove('hidden');
    },
    clearError: () => error.classList.add('hidden'),
  };
}

export function renderLegend() {
  const el = document.getElementById('legend');
  const items = Array.from({ length: 10 }, (_, i) => {
    const s = i + 1;
    return `<div class="legend-item">
      <span class="legend-swatch" style="background:${scoreToColour(s)}"></span>
      <span class="legend-score">${s}</span>
    </div>`;
  }).join('');

  el.innerHTML = `
    <h3>Crime Score</h3>
    <div class="legend-scale">${items}</div>
    <div class="legend-labels">
      <span>Safest</span><span>Most Dangerous</span>
    </div>
  `;
}

export function renderRankings(boroughData) {
  const el = document.getElementById('rankings');
  const valid = boroughData.filter(b => !b.failed).sort((a, b) => b.score - a.score);
  if (!valid.length) { el.innerHTML = ''; return; }

  const top5 = valid.slice(0, 5);
  const bottom5 = [...valid].reverse().slice(0, 5);

  const rowHtml = b => `
    <div class="rank-item">
      <span class="rank-swatch" style="background:${scoreToColour(b.score)}"></span>
      <span class="rank-name">${b.name}</span>
      <span class="rank-score">${b.score}/10</span>
    </div>`;

  el.innerHTML = `
    <div class="rankings-group">
      <h3>Most Dangerous</h3>
      ${top5.map(rowHtml).join('')}
    </div>
    <div class="rankings-group">
      <h3>Safest</h3>
      ${bottom5.map(rowHtml).join('')}
    </div>
  `;
}

export function renderDetailPanel(detail, score) {
  const panel = document.getElementById('detail-panel');
  const content = document.getElementById('detail-content');

  let trendHtml = '';
  if (detail.previousCount !== null && detail.previousCount > 0) {
    const diff = detail.crimeCount - detail.previousCount;
    const pct = Math.abs((diff / detail.previousCount) * 100).toFixed(1);
    const cls = diff > 0 ? 'trend-up' : 'trend-down';
    const arrow = diff > 0 ? '▲' : '▼';
    trendHtml = `<p class="trend ${cls}">${arrow} ${pct}% vs last month</p>`;
  }

  const maxCount = Math.max(...Object.values(detail.breakdown), 1);
  const breakdownHtml = Object.entries(detail.breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => `
      <div class="breakdown-row">
        <span class="breakdown-label">${formatCategory(cat)}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(count / maxCount) * 100}%;background:${scoreToColour(score)}"></div>
        </div>
        <span class="breakdown-count">${count}</span>
      </div>`)
    .join('');

  content.innerHTML = `
    <div class="detail-header">
      <h2>${detail.name}</h2>
      <span class="score-badge" style="background:${scoreToColour(score)}">${score}<small>/10</small></span>
    </div>
    <p class="total-crimes">${detail.crimeCount.toLocaleString()} crimes recorded</p>
    ${trendHtml}
    <div class="breakdown">${breakdownHtml}</div>
  `;

  panel.classList.add('open');
}

export function hideDetailPanel() {
  document.getElementById('detail-panel').classList.remove('open');
}

export function setLoading(isLoading) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !isLoading);
}

export function showErrorBanner(msg) {
  const banner = document.getElementById('error-banner');
  banner.textContent = msg;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 6000);
}

export function exportCSV(boroughData, month) {
  const rows = boroughData
    .filter(b => !b.failed)
    .sort((a, b) => a.rank - b.rank)
    .map(b => `${b.name},${b.crimeCount},${b.rank},${b.score}`)
    .join('\n');

  const csv = 'Borough,Crime Count,Rank,Score\n' + rows;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `safeworld-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatCategory(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
```

- [ ] **Step 2: Commit**

```bash
git add js/ui.js
git commit -m "feat: ui module — sidebar, filters, legend, rankings, detail panel, CSV export"
git push origin master
```

---

## Task 8: CSS — Layout + Component Styles

**Why dark theme:** Dark themes make colour-coded data (heat maps especially) stand out much more than light themes. Green and red score indicators are easier to read against dark backgrounds. This is also a deliberate visual design decision worth mentioning in interviews — the theme serves the data.

**Files:**
- Modify: `styles/main.css`
- Modify: `styles/components.css`

- [ ] **Step 1: Write styles/main.css**

```css
/* styles/main.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-dark: #1a1a2e;
  --bg-panel: #16213e;
  --bg-input: #0f3460;
  --text-primary: #e0e0e0;
  --text-muted: #8892a4;
  --accent: #e94560;
  --border: #2a3a5c;
  --radius: 8px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-dark);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
}

#app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

#sidebar {
  width: 300px;
  flex-shrink: 0;
  background: var(--bg-panel);
  padding: 20px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-right: 1px solid var(--border);
  z-index: 10;
}

#map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

#map {
  width: 100%;
  height: 100%;
}

#detail-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 340px;
  height: 100%;
  background: var(--bg-panel);
  border-left: 1px solid var(--border);
  overflow-y: auto;
  padding: 20px;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 20;
}

#detail-panel.open {
  transform: translateX(0);
}

/* Loading overlay sits on top of the map */
#loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(26, 26, 46, 0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 15;
  color: var(--text-primary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

#error-banner {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: #c0392b;
  color: #fff;
  padding: 10px 20px;
  border-radius: var(--radius);
  z-index: 30;
  max-width: 400px;
  text-align: center;
}

.hidden { display: none !important; }

/* Responsive — sidebar becomes bottom drawer on small screens */
@media (max-width: 640px) {
  #app { flex-direction: column; }

  #sidebar {
    width: 100%;
    height: 240px;
    flex-shrink: 0;
    overflow-y: auto;
    border-right: none;
    border-top: 1px solid var(--border);
    order: 2;
    padding: 12px;
    gap: 12px;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  #map-container { order: 1; flex: 1; }

  #detail-panel {
    width: 100%;
    height: 60%;
    top: auto;
    bottom: 240px;
    right: 0;
    transform: translateY(100%);
  }

  #detail-panel.open { transform: translateY(0); }
}
```

- [ ] **Step 2: Write styles/components.css**

```css
/* styles/components.css */

/* Sidebar header */
#sidebar-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

#tagline {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Search */
#search-section label,
#filter-section label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

#location-search,
#category-filter,
#month-filter {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  padding: 8px 10px;
  font-size: 0.875rem;
  outline: none;
  margin-bottom: 2px;
}

#location-search:focus,
#category-filter:focus,
#month-filter:focus {
  border-color: var(--accent);
}

#filter-section { display: flex; flex-direction: column; gap: 8px; }

.error-msg {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
}

/* Legend */
#legend h3 { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }

.legend-scale {
  display: flex;
  gap: 3px;
  margin-bottom: 4px;
}

.legend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.legend-swatch {
  width: 100%;
  height: 14px;
  border-radius: 2px;
  display: block;
}

.legend-score { font-size: 0.65rem; color: var(--text-muted); }

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Rankings */
.rankings-group { margin-bottom: 12px; }
.rankings-group h3 { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; }

.rank-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
}

.rank-swatch { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
.rank-name { flex: 1; font-size: 0.825rem; }
.rank-score { font-size: 0.8rem; color: var(--text-muted); }

/* Export button */
#export-btn {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  padding: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: border-color 0.15s;
  margin-top: auto;
}
#export-btn:hover { border-color: var(--accent); }

/* Detail panel */
#close-detail {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}
#close-detail:hover { color: var(--text-primary); }

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  padding-right: 24px;
}

.detail-header h2 { font-size: 1.25rem; font-weight: 700; }

.score-badge {
  flex-shrink: 0;
  border-radius: var(--radius);
  padding: 4px 10px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.score-badge small { font-size: 0.7rem; font-weight: 400; }

.total-crimes { color: var(--text-muted); font-size: 0.875rem; margin-bottom: 8px; }

.trend { font-size: 0.875rem; font-weight: 600; margin-bottom: 12px; }
.trend-up { color: #e74c3c; }
.trend-down { color: #2ecc71; }

/* Breakdown bar chart */
.breakdown { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }

.breakdown-row {
  display: grid;
  grid-template-columns: 140px 1fr 36px;
  align-items: center;
  gap: 8px;
}

.breakdown-label { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.bar-track {
  background: var(--bg-input);
  border-radius: 3px;
  height: 8px;
  overflow: hidden;
}

.bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }

.breakdown-count { font-size: 0.75rem; color: var(--text-muted); text-align: right; }
```

- [ ] **Step 3: Verify styles look correct**

Open `http://localhost:8000` and check:
- Dark background, sidebar on left, map takes remaining space
- No visual errors or overlapping elements

- [ ] **Step 4: Commit**

```bash
git add styles/main.css styles/components.css
git commit -m "feat: CSS layout and component styles — dark theme, responsive sidebar"
git push origin master
```

---

## Task 9: main.js — Application Bootstrap + URL Hash State

**Why main.js owns the URL hash:** The hash encodes the current filter state (`category`, `month`, `selectedBorough`) so links are shareable and the browser back button works. This is called "URL as application state" — the URL becomes the source of truth for shareable app state, a pattern used by many SPAs. `main.js` owns this because it's the only module that knows about all the other modules, so it's the right place to coordinate reading/writing state to the hash.

**Why main.js is the only file that imports from multiple modules:** Every other module has a single responsibility. Only `main.js` is allowed to be the "orchestrator" that wires them together. This keeps the dependency graph clean — if you draw arrows between modules, they all point to `main.js`, not to each other.

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Implement js/main.js**

```js
// js/main.js
import { getState, setState } from './state.js';
import { fetchAllBoroughs, fetchBoroughDetail, lookupLocation } from './api.js';
import { rankBoroughs } from './scoring.js';
import { initMap, loadBoroughLayer, colourBoroughs, panToBorough } from './map.js';
import {
  initFilters, setFilterValues, initSearch,
  renderLegend, renderRankings,
  renderDetailPanel, hideDetailPanel,
  setLoading, showErrorBanner, exportCSV,
} from './ui.js';

let geojson = null;
let searchControls = null;

// ─── Data Loading ────────────────────────────────────────────────────────────

async function loadData() {
  const { category, month } = getState();
  setState({ loading: true });
  setLoading(true);

  const { boroughData, hasErrors } = await fetchAllBoroughs(geojson, category, month);

  // Rank only the boroughs that returned data; failed ones stay as-is
  const valid = boroughData.filter(b => !b.failed);
  const ranked = rankBoroughs(valid);

  const fullData = boroughData.map(b =>
    b.failed ? b : ranked.find(r => r.name === b.name)
  );

  setState({ boroughData: fullData, loading: false });
  setLoading(false);
  colourBoroughs(fullData);
  renderRankings(fullData);

  if (hasErrors) {
    showErrorBanner('Some borough data could not be loaded — showing partial results.');
  }
}

// ─── Borough Detail ───────────────────────────────────────────────────────────

async function openBorough(boroughName) {
  const { boroughData, category, month } = getState();
  const scored = boroughData.find(b => b.name === boroughName);
  if (!scored || scored.failed) return;

  const feature = geojson.features.find(f => f.properties.name === boroughName);
  if (!feature) return;

  const detail = await fetchBoroughDetail(feature, category, month);
  setState({ selectedBorough: boroughName });
  renderDetailPanel(detail, scored.score);
  updateHash();
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function handleSearch(query) {
  const resolved = await lookupLocation(query);
  if (!resolved) {
    searchControls.showError('Postcode not found in a London borough.');
    return;
  }

  const found = panToBorough(resolved);
  if (!found) {
    searchControls.showError(`"${resolved}" is not a recognised London borough.`);
    return;
  }

  searchControls.clearError();
  openBorough(resolved);
}

// ─── URL Hash State ───────────────────────────────────────────────────────────

function updateHash() {
  const { category, month, selectedBorough } = getState();
  const params = new URLSearchParams({ category, month });
  if (selectedBorough) params.set('borough', selectedBorough);
  // Replace rather than push so the hash update itself isn't a history entry
  history.replaceState(null, '', `#${params.toString()}`);
}

function readHash() {
  if (!window.location.hash) return;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const updates = {};
  if (params.get('category')) updates.category = params.get('category');
  if (params.get('month')) updates.month = params.get('month');
  if (params.get('borough')) updates.selectedBorough = params.get('borough');
  if (Object.keys(updates).length) setState(updates);
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  // 1. Load static borough boundary data
  const res = await fetch('./data/london-boroughs.geojson');
  geojson = await res.json();

  // 2. Read URL hash so filters match any shared link
  readHash();

  // 3. Initialise Google Maps and add borough polygons
  await initMap('map');
  loadBoroughLayer(geojson, openBorough);

  // 4. Build sidebar UI
  renderLegend();
  initFilters(
    category => { setState({ category }); updateHash(); loadData(); },
    month    => { setState({ month });    updateHash(); loadData(); }
  );
  searchControls = initSearch(handleSearch);

  // Sync dropdowns to any state restored from URL hash
  const { category, month } = getState();
  setFilterValues(category, month);

  // 5. Wire up close button and CSV export
  document.getElementById('close-detail').addEventListener('click', () => {
    hideDetailPanel();
    setState({ selectedBorough: null });
    updateHash();
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    const { boroughData, month: m } = getState();
    exportCSV(boroughData, m);
  });

  // 6. If a borough was in the hash, open its detail panel after data loads
  const { selectedBorough } = getState();

  // 7. Fetch and display crime data
  await loadData();

  if (selectedBorough) {
    panToBorough(selectedBorough);
    await openBorough(selectedBorough);
  }
}

bootstrap().catch(err => {
  console.error('SafeWorld bootstrap error:', err);
  const banner = document.getElementById('error-banner');
  banner.textContent = 'Failed to load application. Please refresh.';
  banner.classList.remove('hidden');
});
```

- [ ] **Step 2: Commit**

```bash
git add js/main.js
git commit -m "feat: main bootstrap — wires all modules, URL hash state, full data flow"
git push origin master
```

---

## Task 10: Full Integration Test

**Why manual testing before claiming done:** Automated tests cover individual units. Integration testing verifies the full data flow from API through scoring to rendered pixels. A feature can pass unit tests and still be broken in the integration — for example, a property name mismatch between what `api.js` returns and what `scoring.js` expects.

- [ ] **Step 1: Start local server and open the app**

```bash
python -m http.server 8000
```

Open `http://localhost:8000`

- [ ] **Step 2: Run through the full manual checklist**

Work through each item. Note any failures to fix:

- [ ] Map renders on load with 33 coloured borough polygons (green to red)
- [ ] Hover over a borough shows InfoWindow with borough name and score
- [ ] Click a borough opens the detail panel (slides in from right)
- [ ] Detail panel shows: borough name, score badge, trend indicator, crime breakdown bars
- [ ] Close button dismisses detail panel
- [ ] Changing the category filter re-colours the map and updates rankings
- [ ] Changing the month selector re-fetches data and re-colours
- [ ] Loading overlay appears during data fetch
- [ ] Searching "Hackney" pans to Hackney and opens detail panel
- [ ] Searching "E8 1DY" (Hackney postcode) pans to Hackney and opens detail panel
- [ ] Searching "ZZ9 9ZZ" shows inline error "Postcode not found in a London borough"
- [ ] URL hash updates on every filter change (check browser address bar)
- [ ] Copy the URL hash, open a new tab, paste it — same filters and borough restore
- [ ] Browser back button navigates filter history
- [ ] Export CSV button downloads a .csv file with correct data
- [ ] Rankings panel shows Top 5 most dangerous and Top 5 safest boroughs
- [ ] On mobile viewport (< 640px): sidebar moves to bottom, layout stacks correctly

- [ ] **Step 3: Fix any failures found in the checklist**

For each failed item, identify the root cause in the relevant module and fix it. Commit fixes individually with descriptive messages.

- [ ] **Step 4: Run Lighthouse audit**

In Chrome DevTools → Lighthouse tab → run audit on `http://localhost:8000`

Targets:
- Performance: 90+
- Accessibility: 100
- Best Practices: 90+
- SEO: 80+

Fix any Accessibility failures (missing aria labels, colour contrast issues).

- [ ] **Step 5: Final commit and push**

```bash
git add -A
git commit -m "fix: integration test fixes and Lighthouse accessibility improvements"
git push origin master
```

---

## Spec Coverage Check

| Spec Requirement | Covered In |
|------------------|-----------|
| 33 London boroughs, GeoJSON polygon overlay | Task 2, Task 6 |
| Live data.police.uk API | Task 5 |
| sessionStorage caching | Task 5 |
| Relative 1–10 ranking algorithm | Task 3 |
| Green→red colour scale | Task 3, Task 6 |
| Category filter dropdown | Task 7 |
| Month selector (12 months back) | Task 7 |
| Unified postcode + borough search | Task 5, Task 7 |
| Detail panel: score badge | Task 7 |
| Detail panel: trend indicator | Task 5, Task 7 |
| Detail panel: CSS bar chart breakdown | Task 7 |
| Top 5 / Bottom 5 rankings | Task 7 |
| Export CSV | Task 7 |
| URL hash state (shareable links) | Task 9 |
| Browser back/forward navigation | Task 9 |
| API keys in gitignored config.js | Task 1 |
| config.example.js template | Task 1 |
| Mobile responsive layout | Task 8 |
| Loading overlay / spinner | Task 7, Task 8 |
| Per-borough error isolation (grey polygon) | Task 5, Task 6 |
| Error banner for partial failures | Task 7 |
| Postcode error message | Task 7 |
| ARIA labels for accessibility | Task 1 (HTML), Task 10 |
| Lighthouse audit | Task 10 |
| Unit tests for scoring.js | Task 3 |
