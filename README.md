# SafeWorld — Crime Data Visualization

**[→ Live site](https://safeworld-javeriah.netlify.app/)**

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

## Data sources

- **[data.police.uk](https://data.police.uk)** — Official UK Police open data API. Street-level crime records published monthly.
- **[postcodes.io](https://postcodes.io)** — Open-source postcode lookup. Resolves postcodes to London boroughs.
- **[London Borough GeoJSON](https://github.com/radoi90/housequest-data)** — Open polygon boundaries for all 33 boroughs.

