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

// ── Data loading ──────────────────────────────────────────────────────────────

async function loadData() {
  const { category, month } = getState();
  setState({ loading: true });
  setLoading(true);

  const { boroughData, hasErrors } = await fetchAllBoroughs(geojson, category, month);

  // Rank only the boroughs that returned data; failed ones stay marked as-is
  const valid  = boroughData.filter(b => !b.failed);
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

// ── Borough detail ────────────────────────────────────────────────────────────

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

// ── Search ────────────────────────────────────────────────────────────────────

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

// ── URL hash state ────────────────────────────────────────────────────────────

// Encodes current filter state into the URL hash so links are shareable.
// Uses replaceState so filter changes don't create history entries.
function updateHash() {
  const { category, month, selectedBorough } = getState();
  const params = new URLSearchParams({ category, month });
  if (selectedBorough) params.set('borough', selectedBorough);
  history.replaceState(null, '', `#${params.toString()}`);
}

// Reads the URL hash on load and restores filters from it.
function readHash() {
  if (!window.location.hash) return;
  const params  = new URLSearchParams(window.location.hash.slice(1));
  const updates = {};
  if (params.get('category')) updates.category        = params.get('category');
  if (params.get('month'))    updates.month           = params.get('month');
  if (params.get('borough'))  updates.selectedBorough = params.get('borough');
  if (Object.keys(updates).length) setState(updates);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  console.log('[SafeWorld] Step 1: loading GeoJSON');
  const res = await fetch('./data/london-boroughs.geojson');
  geojson   = await res.json();
  console.log(`[SafeWorld] GeoJSON loaded — ${geojson.features.length} boroughs`);

  console.log('[SafeWorld] Step 2: reading URL hash');
  readHash();

  console.log('[SafeWorld] Step 3: initialising Google Maps');
  await initMap('map');
  loadBoroughLayer(geojson, openBorough);
  console.log('[SafeWorld] Map ready');

  console.log('[SafeWorld] Step 4: building sidebar UI');
  renderLegend();
  initFilters(
    category => { setState({ category }); updateHash(); loadData(); },
    month    => { setState({ month });    updateHash(); loadData(); }
  );
  searchControls = initSearch(handleSearch);

  const { category, month } = getState();
  setFilterValues(category, month);

  document.getElementById('close-detail').addEventListener('click', () => {
    hideDetailPanel();
    setState({ selectedBorough: null });
    updateHash();
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    const { boroughData, month: m } = getState();
    exportCSV(boroughData, m);
  });

  console.log('[SafeWorld] Step 5: fetching crime data');
  await loadData();
  console.log('[SafeWorld] Done');

  const { selectedBorough } = getState();
  if (selectedBorough) {
    panToBorough(selectedBorough);
    await openBorough(selectedBorough);
  }
}

bootstrap().catch(err => {
  console.error('SafeWorld bootstrap error:', err);
  const banner = document.getElementById('error-banner');
  banner.textContent = 'Failed to load application. Please refresh the page.';
  banner.classList.remove('hidden');
});
