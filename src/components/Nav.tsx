'use client';
import { useState } from 'react';
import { useSahYog } from '@/store/useSahYog';
import type { View } from '@/lib/types';

export default function Nav() {
  const { state, dispatch, showView, signOutSupabase } = useSahYog();
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
          <div className="brand-logo-wrap" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/logo-mark.png"
              alt="SahYog Emblem"
              style={{
                width: 40,
                height: 40,
                objectFit: 'contain',
                flexShrink: 0,
                borderRadius: 8
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="brand-name">SahYog</span>
              <span className="proto-tag" style={{ margin: 0, fontSize: 10, padding: '2px 6px', background: '#e0f2fe', color: '#0369a1' }}>Govt. of Jharkhand</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>Societal Innovation Portal · SIH 2026</span>
          </div>
        </div>

        <div className="nav-links">
          <button data-view="home" className={currentView === 'home' ? 'active' : ''} onClick={() => nav('home')}>Home</button>
          <button data-view="explore" className={currentView === 'explore' ? 'active' : ''} onClick={() => nav('explore')}>Societal Challenges</button>
          <button data-view="report" className="" onClick={() => dispatch({ type: 'OPEN_WORKFLOW' })}>Submit Challenge</button>
          <button data-view="track" className={currentView === 'track' ? 'active' : ''} onClick={() => nav('track')}>Track Project</button>
          <button onClick={scrollHowItWorks}>Innovation Model</button>
          <button data-view="dashboard" className={currentView === 'dashboard' ? 'active' : ''} onClick={() => nav('dashboard')}>Jharkhand Dashboard</button>
        </div>

        <div className="nav-right">
          <button className="icon-btn" onClick={toggleNotif} aria-label="Notifications">
            🔔
            {unread > 0 && <span className="dot-badge" id="notifCount">{unread}</span>}
          </button>
          {currentRole === 'admin' && (
            <button className="btn btn-secondary" onClick={() => { window.location.href = '/admin'; }}>
              Government Control Center
            </button>
          )}
          {currentRole ? (
            <button className="btn btn-secondary" id="loginBtn" onClick={() => { signOutSupabase(); }}>
              Logout <span className="role-badge-nav" style={{ marginLeft: 6 }}>
                {currentRole === 'admin' ? 'Administrator' : currentRole === 'government' ? 'Govt. of Jharkhand' : currentRole === 'university' ? 'HEI Partner' : currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
              </span>
            </button>
          ) : (
            <button className="btn btn-secondary" id="loginBtn" onClick={() => dispatch({ type: 'TOGGLE_LOGIN' })}>Role Persona</button>
          )}
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_WORKFLOW' })}>+ Submit Challenge</button>
          <button className="hamb" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">☰</button>
        </div>
      </div>

      <div className={`wrap mobile-menu ${mobileOpen ? 'open' : ''}`} id="mobileMenu">
        <button onClick={() => nav('home')}>Home</button>
        <button onClick={() => nav('explore')}>Societal Challenges</button>
        <button onClick={() => { setMobileOpen(false); dispatch({ type: 'OPEN_WORKFLOW' }); }}>Submit Challenge</button>
        <button onClick={() => nav('track')}>Track Project</button>
        <button onClick={scrollHowItWorks}>Innovation Model</button>
        <button onClick={() => nav('dashboard')}>Jharkhand Dashboard</button>
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
