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

// Wrap sidebar contents in proper section divs for styling
export function wrapSidebarSections() {
  const sections = [
    { id: 'search-section',  label: 'Location Search' },
    { id: 'filter-section',  label: 'Filters' },
    { id: 'legend',          label: 'Crime Score' },
    { id: 'rankings',        label: 'Rankings' },
  ];
  sections.forEach(({ id, label }) => {
    const el = document.getElementById(id);
    if (!el || el.closest('.sidebar-section')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'sidebar-section';
    if (id !== 'legend') {
      const lbl = document.createElement('p');
      lbl.className = 'section-label';
      lbl.textContent = label;
      wrapper.appendChild(lbl);
    }
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  });
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
  const ticks = [1, 3, 5, 7, 10].map(n =>
    `<span class="legend-tick">${n}</span>`
  ).join('');

  el.innerHTML = `
    <p class="section-label">Crime Score</p>
    <div class="legend-gradient"></div>
    <div class="legend-ticks">${ticks}</div>
    <div class="legend-labels">
      <span>Safest</span><span>Most dangerous</span>
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
      <span class="rank-dot" style="background:${scoreToColour(b.score)}"></span>
      <span class="rank-name">${b.name}</span>
      <span class="rank-score">${b.score}/10</span>
    </div>`;

  el.innerHTML = `
    <div class="rankings-group">
      <p class="rankings-group-label">Most Dangerous</p>
      ${top5.map(rowHtml).join('')}
    </div>
    <div class="rankings-group">
      <p class="rankings-group-label">Safest</p>
      ${bottom5.map(rowHtml).join('')}
    </div>
  `;
}

export function renderDetailPanel(detail, score) {
  const panel   = document.getElementById('detail-panel');
  const content = document.getElementById('detail-content');

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
    <div class="detail-meta">
      <p class="detail-eyebrow">London Borough</p>
      <div class="detail-header">
        <h2>${detail.name}</h2>
        <div class="score-badge" style="background:${scoreToColour(score)}">
          ${score}<small>/10</small>
        </div>
      </div>
      <hr class="detail-divider" />
      <div class="detail-stats">
        <div class="stat">
          <span class="stat-value">${detail.crimeCount.toLocaleString()}</span>
          <span class="stat-label">Crimes recorded</span>
        </div>
        ${detail.previousCount !== null ? `
        <div class="stat">
          <span class="stat-value ${detail.crimeCount > detail.previousCount ? 'trend-up' : 'trend-down'}">
            ${detail.crimeCount > detail.previousCount ? '▲' : '▼'}
            ${Math.abs(((detail.crimeCount - detail.previousCount) / detail.previousCount) * 100).toFixed(1)}%
          </span>
          <span class="stat-label">vs last month</span>
        </div>` : ''}
      </div>
    </div>
    <p class="breakdown-title">Crime Breakdown</p>
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
