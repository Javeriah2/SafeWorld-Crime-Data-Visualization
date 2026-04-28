// js/api.js

const POLICE_API = 'https://data.police.uk/api';
const POSTCODES_API = 'https://api.postcodes.io';

// Computes the centroid of a borough polygon from its GeoJSON geometry.
// We query the police API by centroid lat/lng rather than the full polygon
// because the API has an undocumented area limit — large outer London boroughs
// (Richmond, Bromley, Havering etc.) silently drop the connection when queried
// by polygon. The centroid approach works for every borough regardless of size,
// and relative rankings remain valid since the same method is applied to all.
function getCentroid(geometry) {
  const ring = geometry.type === 'MultiPolygon'
    ? geometry.coordinates[0][0]
    : geometry.coordinates[0];
  let sumLat = 0, sumLng = 0;
  ring.forEach(([lng, lat]) => { sumLat += lat; sumLng += lng; });
  return { lat: sumLat / ring.length, lng: sumLng / ring.length };
}

function cacheKey(boroughName, category, month) {
  return `sw:${boroughName}:${category}:${month}`;
}

async function fetchBoroughCrimes(feature, category, month) {
  const name = feature.properties.name;
  const key = cacheKey(name, category, month);

  const cached = sessionStorage.getItem(key);
  if (cached) return { name, crimes: JSON.parse(cached) };

  const { lat, lng } = getCentroid(feature.geometry);
  const url = `${POLICE_API}/crimes-street/${category}?lat=${lat}&lng=${lng}&date=${month}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[SafeWorld] API ${res.status} for ${name} — ${url}`);
    throw new Error(`HTTP ${res.status} for ${name}`);
  }

  const crimes = await res.json();

  try {
    sessionStorage.setItem(key, JSON.stringify(crimes));
  } catch (_) {
    // sessionStorage quota exceeded — continue without caching
  }

  return { name, crimes };
}

// Runs an array of async tasks in sequential batches of `batchSize`.
// Batching prevents the police API from rate-limiting 33 simultaneous requests.
const wait = ms => new Promise(res => setTimeout(res, ms));

async function batchSettled(tasks, batchSize = 5) {
  const results = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = await Promise.allSettled(tasks.slice(i, i + batchSize).map(fn => fn()));
    results.push(...batch);
    if (i + batchSize < tasks.length) await wait(300);
  }
  return results;
}

// Fetches crime totals for all 33 boroughs in batches of 5.
// Uses Promise.allSettled so a single failure does not cancel the batch.
// Returns { boroughData: [...], hasErrors: boolean }
export async function fetchAllBoroughs(geojson, category, month) {
  const tasks = geojson.features.map(f => () => fetchBoroughCrimes(f, category, month));
  const results = await batchSettled(tasks, 5);

  let hasErrors = false;
  const boroughData = results.map((result, i) => {
    if (result.status === 'fulfilled') {
      const { name, crimes } = result.value;
      return { name, crimeCount: crimes.length, crimes };
    }
    hasErrors = true;
    return {
      name: geojson.features[i].properties.name,
      crimeCount: 0,
      crimes: [],
      failed: true,
    };
  });

  return { boroughData, hasErrors };
}

// Fetches the detailed breakdown for a single borough:
// per-category crime counts + trend vs the previous month.
export async function fetchBoroughDetail(feature, category, month) {
  const current = await fetchBoroughCrimes(feature, category, month);

  // Calculate previous month string (e.g. "2025-03" → "2025-02")
  const [year, mon] = month.split('-').map(Number);
  const prevDate = new Date(year, mon - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const previous = await fetchBoroughCrimes(feature, category, prevMonth).catch(() => null);

  // Group crimes by category for the breakdown bar chart
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

// Resolves a user query (postcode or borough name) to a borough name string.
// Returns the borough name, or null if not found / not in London.
export async function lookupLocation(query) {
  const trimmed = query.trim();
  const noSpaces = trimmed.toUpperCase().replace(/\s+/g, '');

  // Postcode pattern: 1-2 letters + digit(s) + optional letter + digit + 2 letters
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(noSpaces)) {
    try {
      const res = await fetch(`${POSTCODES_API}/postcodes/${encodeURIComponent(noSpaces)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.result?.admin_district ?? null;
    } catch (_) {
      return null;
    }
  }

  // Not a postcode — treat as a borough name for map.js to match against GeoJSON
  return trimmed;
}
