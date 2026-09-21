'use client';
import { useState } from 'react';
import { useSahYog } from '@/store/useSahYog';
import type { View } from '@/lib/types';

export default function Nav() {
  const { state, dispatch, showView } = useSahYog();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { currentView, notifications, currentRole, loginOpen } = state;
  const unread = notifications.filter(n => n.unread).length;

  function toggleNotif() {
    setNotifOpen(v => !v);
    if (!notifOpen) dispatch({ type: 'MARK_NOTIFICATIONS_READ' });
  }

  function nav(view: View) {
    showView(view);
    setMobileOpen(false);
  }

  function scrollHowItWorks() {
    showView('home');
    setMobileOpen(false);
    setTimeout(() => {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  return (
    <div className="topbar">
      <div className="wrap nav-inner">
        <div className="brand" onClick={() => nav('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-logo-wrap">
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, borderRadius: 8 }}>
              <rect width="36" height="36" rx="8" fill="#14548F" />
              <circle cx="18" cy="11" r="3.5" fill="#FFFFFF" />
              <circle cx="11" cy="24" r="3.5" fill="#4ade80" />
              <circle cx="25" cy="24" r="3.5" fill="#38bdf8" />
              <path d="M18 11 L11 24 M18 11 L25 24 M11 24 L25 24" stroke="#FFFFFF" strokeWidth="1.75" strokeOpacity="0.85" strokeLinecap="round" />
              <circle cx="18" cy="18" r="2.2" fill="#FFFFFF" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="brand-name">SahYog</span>
              <span className="proto-tag" style={{ margin: 0, fontSize: 10, padding: '2px 6px' }}>SIH26043</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>Lord&apos;s Inst. of Engg &amp; Tech</span>
          </div>
        </div>

        <div className="nav-links">
          <button data-view="home" className={currentView === 'home' ? 'active' : ''} onClick={() => nav('home')}>Home</button>
          <button data-view="explore" className={currentView === 'explore' ? 'active' : ''} onClick={() => nav('explore')}>Explore Challenges</button>
          <button data-view="report" className="" onClick={() => dispatch({ type: 'OPEN_WORKFLOW' })}>Report Problem</button>
          <button data-view="track" className={currentView === 'track' ? 'active' : ''} onClick={() => nav('track')}>Track Problem</button>
          <button onClick={scrollHowItWorks}>How It Works</button>
          <button data-view="dashboard" className={currentView === 'dashboard' ? 'active' : ''} onClick={() => nav('dashboard')}>Role Dashboards</button>
        </div>

        <div className="nav-right">
          <button className="icon-btn" onClick={toggleNotif} aria-label="Notifications">
            🔔
            {unread > 0 && <span className="dot-badge" id="notifCount">{unread}</span>}
          </button>
          {currentRole ? (
            <button className="btn btn-secondary" id="loginBtn" onClick={() => dispatch({ type: 'LOGOUT' })}>
              Logout <span className="role-badge-nav" style={{ marginLeft: 6 }}>
                {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
              </span>
            </button>
          ) : (
            <button className="btn btn-secondary" id="loginBtn" onClick={() => dispatch({ type: 'TOGGLE_LOGIN' })}>Role Login</button>
          )}
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_WORKFLOW' })}>+ Report a Problem</button>
          <button className="hamb" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">☰</button>
        </div>
      </div>

      <div className={`wrap mobile-menu ${mobileOpen ? 'open' : ''}`} id="mobileMenu">
        <button onClick={() => nav('home')}>Home</button>
        <button onClick={() => nav('explore')}>Explore Challenges</button>
        <button onClick={() => { setMobileOpen(false); dispatch({ type: 'OPEN_WORKFLOW' }); }}>Report Problem</button>
        <button onClick={() => nav('track')}>Track Problem</button>
        <button onClick={scrollHowItWorks}>How It Works</button>
        <button onClick={() => nav('dashboard')}>Role Dashboards</button>
      </div>

      {/* Notification panel */}
      <div className={`notif-panel ${notifOpen ? 'show' : ''}`} id="notifPanel">
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontWeight: 700, fontSize: 13 }}>Notifications</div>
        <div id="notifList">
          {notifications.length === 0
            ? <div className="notif-item">No notifications yet.</div>
            : notifications.map((n, i) => (
              <div key={i} className={`notif-item ${n.unread ? 'unread' : ''}`}>
                {n.text}
                <div className="t">{n.time ?? 'Prototype notification'}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
