'use client';
import { useState, useMemo, useRef } from 'react';
import { useSahYog } from '@/store/useSahYog';
import { CATEGORY_COLOR, STAGES, CATEGORIES } from '@/lib/constants';
import type { Problem } from '@/lib/types';
import { toast } from '@/components/ToastStack';

function useFiltered(problems: Problem[], q: string, cat: string, sev: string, stat: string, loc: string) {
  return useMemo(() => problems.filter(p => {
    if (cat && p.category !== cat) return false;
    if (sev && p.severity !== sev) return false;
    if (stat && STAGES[p.stage] !== stat) return false;
    if (loc && p.location !== loc) return false;
    if (!q) return true;
    const hay = [p.id, p.title, p.desc, p.category, p.location, p.ai?.authority ?? '',
      ...(p.solutions ?? []).flatMap(s => [s.org, s.title])].join(' ').toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [problems, q, cat, sev, stat, loc]);
}

export default function ExploreView() {
  const { state, openDetail, dispatch } = useSahYog();
  const { problems, exploreTab } = state;

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sev, setSev] = useState('');
  const [stat, setStat] = useState('');
  const [loc, setLoc] = useState('');
  const [mapPopup, setMapPopup] = useState<Problem | null>(null);

  const filtered = useFiltered(problems, q, cat, sev, stat, loc);
  const allLocations = useMemo(() => [...new Set(problems.map(p => p.location))], [problems]);

  function helpSolve(id: string) {
    dispatch({ type: 'ADD_NOTIFICATION', text: `You expressed interest in helping solve ${id}.` });
    openDetail(id, 'explore');
    toast(`Opening problem workspace for ${id}. (Simulation Mode)`, 'info');
  }

  return (
    <div className="wrap section">
      <div className="section-head">
        <div className="section-title">Explore Societal Challenges &amp; Research Projects</div>
        <div className="section-sub">
          Crowdsourced challenges across 24 Jharkhand districts matched with Higher Education Institutions (HEIs) &amp; industry partners. <span className="demo-tag">SIH 2026 Prototype Data</span>
        </div>
      </div>

      <div className="tabs-row">
        <button className={exploreTab === 'cards' ? 'active' : ''} onClick={() => dispatch({ type: 'SET_EXPLORE_TAB', tab: 'cards' })}>Card View</button>
        <button className={exploreTab === 'map' ? 'active' : ''} onClick={() => dispatch({ type: 'SET_EXPLORE_TAB', tab: 'map' })}>Map View</button>
      </div>

      <div className="filter-bar">
        <input type="text" placeholder="Search challenges, districts, domains, expertise..." value={q} onChange={e => setQ(e.target.value)} />
        <select value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">All Societal Domains</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={sev} onChange={e => setSev(e.target.value)}>
          <option value="">All Priorities</option>
          <option>Critical</option><option>High</option><option>Moderate</option><option>Low</option>
        </select>
        <select value={stat} onChange={e => setStat(e.target.value)}>
          <option value="">All Project Stages</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={loc} onChange={e => setLoc(e.target.value)}>
          <option value="">All Districts / Locations</option>
          {allLocations.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      {/* CARDS VIEW */}
      <div className={exploreTab === 'cards' ? '' : 'hide'}>
        <div className="result-count">{filtered.length} societal challenge{filtered.length !== 1 ? 's' : ''} found in Jharkhand registry</div>
        <div className="challenge-grid">
          {filtered.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--muted)' }}>No challenges match these filters.</p>
            : filtered.map(p => (
              <div className="chal-card" key={p.id}>
                <div className="chal-thumb" style={{ background: CATEGORY_COLOR[p.category] ?? '#556070' }}>{p.category}</div>
                <div className="chal-body">
                  <h4>{p.title}</h4>
                  <div className="chal-meta">
                    <span>📍 {p.district ? `${p.district}, Jharkhand` : p.location.split(',')[0]}</span>
                    <span className={`status-chip ${p.severity}`}>{p.severity}</span>
                    <span style={{ fontWeight: 600, color: 'var(--blue)' }}>{STAGES[p.stage]}</span>
                    <span>{p.affected}</span>
                  </div>
                  <div className="chal-meta"><span className="demo-tag">SIH26043</span><span>{p.date}</span></div>
                  <div className="chal-foot">
                    <button className="btn btn-secondary btn-sm" onClick={() => openDetail(p.id, 'explore')}>View Case &amp; R&amp;D</button>
                    <button className="btn btn-primary btn-sm" onClick={() => helpSolve(p.id)}>Collaborate</button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* MAP VIEW */}
      <div className={exploreTab === 'map' ? '' : 'hide'}>
        <div className="map-card" id="mapCard" onClick={() => setMapPopup(null)}>
          <div className="map-grid-bg" />
          {filtered.map(p => (
            <div
              key={p.id}
              className="map-pin"
              style={{ left: `${p.mapX}%`, top: `${p.mapY}%`, background: CATEGORY_COLOR[p.category] ?? '#556070', border: `3px solid ${p.severity === 'Critical' ? '#8f241e' : p.severity === 'High' ? '#b5750b' : p.severity === 'Medium' ? '#14548f' : '#178a56'}` }}
              title={p.title}
              onClick={e => { e.stopPropagation(); setMapPopup(p); }}
            />
          ))}
          {mapPopup && (
            <div className="map-popup" style={{ left: `${mapPopup.mapX}%`, top: `${(mapPopup.mapY + 4)}%` }}>
              <h5>{mapPopup.title}</h5>
              <div style={{ color: 'var(--muted)', marginBottom: 6 }}>{mapPopup.category} · {mapPopup.severity} · {mapPopup.location}</div>
              <button className="btn btn-primary btn-sm btn-block" onClick={() => openDetail(mapPopup.id, 'explore')}>Open Full Details</button>
            </div>
          )}
          <div className="map-legend">
            {[...new Set(filtered.map(p => p.category))].map(c => (
              <span key={c}><span className="legend-dot" style={{ background: CATEGORY_COLOR[c] }} />{c}</span>
            ))}
            {filtered.length === 0 && <span>No results for current filters</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
