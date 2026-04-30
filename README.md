# SafeWorld — London Crime Intelligence

**[→ Live site](https://69f309fca17b6c6743f23412--beamish-madeleine-e7a6e5.netlify.app/)**

A real-time crime visualisation tool covering all 33 London boroughs. Boroughs are scored 1–10 relative to each other and colour-graded green → red on a Google Maps choropleth overlay, using live data from the official UK Police API.

---

## What it does

- Fetches live street-level crime records from **data.police.uk** on every filter change — no static snapshots
- Ranks all 33 boroughs against each other and assigns a relative safety score (1 = safest, 10 = most dangerous)
- Lets you filter by **8 crime categories** (Burglary, Drugs, Robbery, Violence, etc.) and any of the last 12 months
- Shows **month-on-month trend** (% change vs previous month) when you click a borough
- **Postcode and borough search** — enter a postcode like `E8 1DY` and the map pans to the right borough
- Every filter state is encoded in the **URL hash** — shareable links work out of the box
- **Export to CSV** for the current view

---

## Engineering decisions worth knowing

**Centroid queries instead of polygon queries**  
The police API has an undocumented area limit that causes large outer boroughs (Richmond, Bromley, etc.) to silently drop the TCP connection. Switching from polygon-based queries to centroid-based queries (`?lat=&lng=`) fixed this entirely. Relative ranking still holds because every borough uses the same method.

**Batched fetching with back-off**  
33 simultaneous API requests hit rate limits. Requests are now batched in groups of 5 with a 300ms delay between batches using `Promise.allSettled`, so partial failures don't block the rest.

**Style function, not style object**  
Google Maps Data Layer resets feature colours on every `revertStyle()` call if you pass an object. Switching to a style *function* (`map.data.setStyle(fn)`) means hover and click events don't wipe the choropleth — the colour is re-derived from state on every render.

**Two-month date offset**  
The police API publishes data with roughly a two-month lag. `currentMonth()` defaults to `now - 2 months` so the app never opens on an empty dataset.

---

## Tech stack

| Layer | Choice |
|---|---|
| Map | Google Maps JS API + Data Layer (GeoJSON choropleth) |
| Crime data | data.police.uk REST API |
| Geocoding | postcodes.io |
| Borough boundaries | London GeoJSON (radoi90/housequest-data) |
| Frontend architecture | Vanilla ES Modules — no bundler, no framework |
| Landing page | React 18 + Vite |
| Deployment | Netlify (CI/CD from GitHub) |

---

## Run locally

```bash
# Clone
git clone https://github.com/Javeriah2/SafeWorld-Crime-Data-Visualization.git
cd SafeWorld-Crime-Data-Visualization

# Add your Google Maps API key
cp config.example.js config.js
# Edit config.js and paste your key

# Install landing page dependencies
npm install

# Start dev server (serves both landing page and map)
npm run dev
```

- Landing page → `http://localhost:5173/`
- Map → `http://localhost:5173/map.html`

---

## Data sources

- **[data.police.uk](https://data.police.uk)** — Official UK Police open data API. Street-level crime records published monthly.
- **[postcodes.io](https://postcodes.io)** — Open-source postcode lookup. Resolves postcodes to London boroughs.
- **[London Borough GeoJSON](https://github.com/radoi90/housequest-data)** — Open polygon boundaries for all 33 boroughs.

---

Built by [Javeriah Husaini](https://github.com/Javeriah2)
