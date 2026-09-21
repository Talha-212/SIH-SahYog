'use client';
import { useState } from 'react';
import { useSahYog } from '@/store/useSahYog';

export default function TrackView() {
  const { state, openDetail } = useSahYog();
  const { problems } = state;
  const [input, setInput] = useState('');
  const [notFound, setNotFound] = useState(false);

  function track() {
    const id = input.trim().toUpperCase();
    const p = problems.find(x => x.id === id);
    if (!p) { setNotFound(true); return; }
    setNotFound(false);
    openDetail(p.id, 'track');
  }

  const suggestions = problems.slice(0, 4);

  return (
    <div className="wrap section">
      <div className="section-title">Track a Problem</div>
      <div className="section-sub">Enter a Problem ID, or pick a recent one below.</div>
      <div className="filter-bar" style={{ marginTop: 14 }}>
        <input
          type="text"
          id="trackInput"
          placeholder="e.g. SY-2026-00119"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && track()}
        />
        <button className="btn btn-primary btn-sm" onClick={track}>Track</button>
      </div>
      <div className="result-count">
        Try: {suggestions.map((p, i) => (
          <span key={p.id}>
            {i > 0 && ' · '}
            <button className="link-btn" onClick={() => { setInput(p.id); setTimeout(track, 0); }}>{p.id}</button>
          </span>
        ))}
      </div>
      {notFound && (
        <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 14 }}>
          No problem found with ID &quot;{input}&quot;. Try one of the suggestions above.
        </p>
      )}
    </div>
  );
}
