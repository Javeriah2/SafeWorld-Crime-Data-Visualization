import React from 'react';

const FEATURES = [
  {
    num: '01',
    label: 'Relative Crime Scoring',
    desc: 'Every borough is ranked 1–10 against the other 32. The scoring updates live as you change category or month — no static averages.',
  },
  {
    num: '02',
    label: 'Live Police API Data',
    desc: 'Sourced directly from data.police.uk — the official UK government crime dataset, published monthly and queried in real time.',
  },
  {
    num: '03',
    label: 'Eight Crime Categories',
    desc: 'Filter across All Crime, Burglary, Drugs, Robbery, Theft, Vehicle Crime, Violence, and Anti-social Behaviour.',
  },
  {
    num: '04',
    label: 'Month-on-Month Trends',
    desc: 'Click any borough to see whether crime is rising or falling compared to the previous month, with percentage change.',
  },
  {
    num: '05',
    label: 'Postcode & Borough Search',
    desc: 'Enter your postcode to locate your borough instantly. Or search by borough name — the map pans and opens the detail panel.',
  },
  {
    num: '06',
    label: 'Shareable URLs',
    desc: 'Every filter state — category, month, selected borough — is encoded in the URL. Share exactly what you\'re looking at.',
  },
];

const SOURCES = [
  {
    name: 'data.police.uk',
    desc: 'The official UK Police open data API. Provides street-level crime records for every police force in England and Wales, published monthly with a two-month lag.',
    href: 'https://data.police.uk',
    tag: 'Crime Records',
  },
  {
    name: 'postcodes.io',
    desc: 'A free, open-source postcode lookup API for the UK. Resolves user-entered postcodes to their London borough using Royal Mail PAF data.',
    href: 'https://postcodes.io',
    tag: 'Geocoding',
  },
  {
    name: 'London Borough GeoJSON',
    desc: 'Open polygon boundary data for all 33 London boroughs, used to render the choropleth overlay on Google Maps.',
    href: 'https://github.com/radoi90/housequest-data',
    tag: 'Boundaries',
  },
];

function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="16" cy="16" rx="6" ry="14.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="1.5" y1="16" x2="30.5" y2="16" stroke="currentColor" strokeWidth="1.5" />
      <line x1="1.5" y1="10" x2="30.5" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.45" />
      <line x1="1.5" y1="22" x2="30.5" y2="22" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.45" />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
    </svg>
  );
}

export default function App() {
  return (
    <div className="page">

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="nav">
        <div className="nav-brand">
          <Logo size={22} />
          <span className="nav-name">SafeWorld</span>
        </div>
        <a
          href="https://github.com/Javeriah2/SafeWorld-Crime-Data-Visualization"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-github"
        >
          <GithubIcon /> GitHub
        </a>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-tag">
            <span className="tag-dot" />
            London Crime Intelligence
          </div>
          <h1 className="hero-title">
            Mapping Crime<br />
            <em>Across London.</em>
          </h1>
          <p className="hero-sub">
            An open-source investigation into crime patterns across all&nbsp;
            <strong>33 London boroughs</strong> — scored, ranked, and colour-graded
            in real time using live government data.
          </p>
          <div className="hero-actions">
            <a href="map.html" className="cta-primary">
              Explore the Map <span className="cta-arrow">→</span>
            </a>
            <a
              href="https://github.com/Javeriah2/SafeWorld-Crime-Data-Visualization"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-secondary"
            >
              View Source
            </a>
          </div>
        </div>
        <div className="hero-aside">
          <div className="hero-stat-card">
            <div className="hero-globe"><Logo size={80} /></div>
            <div className="hero-stats">
              <div className="hero-stat"><span className="hs-n">33</span><span className="hs-l">Boroughs</span></div>
              <div className="hero-stat"><span className="hs-n">8+</span><span className="hs-l">Categories</span></div>
              <div className="hero-stat"><span className="hs-n">12</span><span className="hs-l">Months History</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="rule" />

      {/* ── Features ─────────────────────────────────────── */}
      <section className="section">
        <div className="section-intro">
          <span className="section-tag">What it does</span>
          <h2 className="section-title">Built for clarity,<br />not complexity.</h2>
        </div>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.num} className="feature-card">
              <span className="feature-num">{f.num}</span>
              <h3 className="feature-label">{f.label}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rule" />

      {/* ── Data sources ─────────────────────────────────── */}
      <section className="section">
        <div className="section-intro">
          <span className="section-tag">Data Sources</span>
          <h2 className="section-title">Built on open,<br />public data.</h2>
          <p className="section-sub">
            All data is freely available from official UK government and open-source APIs.
            No proprietary datasets. No paywalls.
          </p>
        </div>
        <div className="sources-grid">
          {SOURCES.map(s => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="source-card">
              <span className="source-tag">{s.tag}</span>
              <h3 className="source-name">{s.name}</h3>
              <p className="source-desc">{s.desc}</p>
              <span className="source-link">Visit ↗</span>
            </a>
          ))}
        </div>
      </section>

      <div className="rule" />

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-left">
          <div className="footer-brand">
            <Logo size={20} />
            <span>SafeWorld</span>
          </div>
          <p className="footer-copy">
            A portfolio project by <strong>Javeriah Husaini</strong> demonstrating
            data visualisation, live API integration, and ES module architecture.
          </p>
          <div className="footer-links">
            <a
              href="https://github.com/Javeriah2/SafeWorld-Crime-Data-Visualization"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon /> github.com/Javeriah2
            </a>
          </div>
        </div>
        <div className="footer-right">
          <a href="map.html" className="cta-primary small">
            Enter the Map →
          </a>
          <p className="footer-data-note">Data · data.police.uk · postcodes.io</p>
        </div>
      </footer>

    </div>
  );
}

function GithubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
