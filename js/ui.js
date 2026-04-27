// js/ui.js
import { scoreToColour } from './scoring.js';

const CATEGORIES = [
  { value: 'all-crime',             label: 'All Crime' },
  { value: 'anti-social-behaviour', label: 'Anti-social Behaviour' },
  { value: 'burglary',              label: 'Burglary' },
  { value: 'drugs',                 label: 'Drugs' },
  { value: 'robbery',               label: 'Robbery' },
  { value: 'theft-from-the-person', label: 'Theft from Person' },
  { value: 'vehicle-crime',         label: 'Vehicle Crime' },
  { value: 'violent-crime',         label: 'Violence & Sexual Offences' },
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

// Syncs dropdown values to match restored URL hash state.
export function setFilterValues(category, month) {
  document.getElementById('category-filter').value = category;
  document.getElementById('month-filter').value = month;
}

// Wires up the search input. Returns helpers for showing/clearing the error message.
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

  const top5    = valid.slice(0, 5);
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
  const panel   = document.getElementById('detail-panel');
  const content = document.getElementById('detail-content');

  let trendHtml = '';
  if (detail.previousCount !== null && detail.previousCount > 0) {
    const diff  = detail.crimeCount - detail.previousCount;
    const pct   = Math.abs((diff / detail.previousCount) * 100).toFixed(1);
    const cls   = diff > 0 ? 'trend-up' : 'trend-down';
    const arrow = diff > 0 ? '▲' : '▼';
    trendHtml   = `<p class="trend ${cls}">${arrow} ${pct}% vs last month</p>`;
  }

  const maxCount    = Math.max(...Object.values(detail.breakdown), 1);
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

  const csv  = 'Borough,Crime Count,Rank,Score\n' + rows;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `safeworld-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatCategory(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
