'use client';
import { useState } from 'react';
import { useSahYog } from '@/store/useSahYog';
import type { View } from '@/lib/types';

import { useAuth } from '@/lib/auth/AuthContext';

export default function Nav() {
  const { state, dispatch, showView, signOutSupabase } = useSahYog();
  const auth = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { currentView, notifications, currentRole } = state;
  const effectiveRole = auth.role || currentRole;

  function requireLoginForChallenge() {
    if (!auth.isAuthenticated) {
      window.location.href = '/login?redirect=/report';
      return;
    }
    dispatch({ type: 'OPEN_WORKFLOW' });
  }
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
          <button data-view="report" className="" onClick={requireLoginForChallenge}>Submit Challenge</button>
          <button data-view="track" className={currentView === 'track' ? 'active' : ''} onClick={() => nav('track')}>Track Project</button>
          <button onClick={scrollHowItWorks}>Innovation Model</button>
          <button data-view="dashboard" className={currentView === 'dashboard' ? 'active' : ''} onClick={() => nav('dashboard')}>Jharkhand Dashboard</button>
        </div>

        <div className="nav-right">
          <button className="icon-btn" onClick={toggleNotif} aria-label="Notifications">
            🔔
            {unread > 0 && <span className="dot-badge" id="notifCount">{unread}</span>}
          </button>
          {effectiveRole === 'admin' && (
            <button className="btn btn-secondary" onClick={() => { window.location.href = '/admin'; }}>
              Government Control Center
            </button>
          )}
          {auth.isAuthenticated ? (
            <button className="btn btn-secondary" id="loginBtn" onClick={() => { signOutSupabase(); }}>
              Logout <span className="role-badge-nav" style={{ marginLeft: 6 }}>
                {effectiveRole === 'admin' ? 'Administrator' : effectiveRole === 'government' ? 'Govt. of Jharkhand' : effectiveRole === 'university' ? 'HEI Partner' : (effectiveRole ? effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1) : 'Citizen')}
              </span>
            </button>
          ) : (
            <button className="btn btn-secondary" id="loginBtn" onClick={() => { window.location.href = '/login'; }}>Sign In</button>
          )}
          <button className="btn btn-primary" onClick={requireLoginForChallenge}>+ Submit Challenge</button>
          <button className="hamb" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">☰</button>
        </div>
      </div>

      <div className={`wrap mobile-menu ${mobileOpen ? 'open' : ''}`} id="mobileMenu">
        <button onClick={() => nav('home')}>Home</button>
        <button onClick={() => nav('explore')}>Societal Challenges</button>
        <button onClick={() => { setMobileOpen(false); requireLoginForChallenge(); }}>Submit Challenge</button>
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
