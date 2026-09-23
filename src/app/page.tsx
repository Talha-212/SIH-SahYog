'use client';
import { useEffect, useState } from 'react';
import { SahYogProvider, useSahYog } from '@/store/useSahYog';
import Nav from '@/components/Nav';
import HomeView from '@/components/views/HomeView';
import ExploreView from '@/components/views/ExploreView';
import ReportView from '@/components/views/ReportView';
import TrackView from '@/components/views/TrackView';
import DetailView from '@/components/views/DetailView';
import DashboardView from '@/components/views/DashboardView';
import LoginModal from '@/components/modals/LoginModal';
import SolutionModal from '@/components/modals/SolutionModal';
import OrgProfileModal from '@/components/modals/OrgProfileModal';
import ReportWorkflowModal from '@/components/modals/ReportWorkflowModal';
import Lightbox from '@/components/Lightbox';
import ToastStack from '@/components/ToastStack';

function AppShell() {
  const { state, dispatch, showView } = useSahYog();
  const { currentView } = state;

  function resetDemo() {
    if (confirm('Reset SahYog demo data and remove submitted reports from this browser?')) {
      localStorage.removeItem('sahyog_demo_v2');
      dispatch({ type: 'RESET' });
    }
  }

  return (
    <>
      <Nav />

      <main>
        <div style={{ display: currentView === 'home' ? 'block' : 'none' }}>
          <HomeView />
        </div>
        <div style={{ display: currentView === 'explore' ? 'block' : 'none' }}>
          <ExploreView />
        </div>
        <div style={{ display: currentView === 'report' ? 'block' : 'none' }}>
          <ReportView />
        </div>
        <div style={{ display: currentView === 'track' ? 'block' : 'none' }}>
          <TrackView />
        </div>
        <div style={{ display: currentView === 'detail' ? 'block' : 'none' }}>
          <DetailView />
        </div>
        <div style={{ display: currentView === 'dashboard' ? 'block' : 'none' }}>
          <DashboardView />
        </div>
      </main>

      {/* Footer */}
      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <img
                  src="/logo.png"
                  alt="SahYog Logo"
                  style={{
                    height: 52,
                    width: 'auto',
                    objectFit: 'contain',
                    background: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: 8
                  }}
                />
              </div>
              <p style={{ fontSize: 13, color: '#c3d3e6', maxWidth: '38ch' }}>&ldquo;Connecting Real Problems with the Right Problem Solvers&rdquo;</p>
              <div className="disclaimer-box">
                SahYog is an independent hackathon/innovation platform prototype for collaborative societal problem solving. It is not an official Survey of India application or government service, and is not affiliated with or endorsed by any government body.
              </div>
            </div>
            <div>
              <h4>Platform</h4>
              <div className="flinks">
                <button onClick={() => showView('home')}>About</button>
                <button onClick={() => { showView('home'); setTimeout(() => document.getElementById('how-it-works')?.scrollIntoView(), 50); }}>How It Works</button>
                <button onClick={() => dispatch({ type: 'OPEN_WORKFLOW' })}>Report Problem</button>
                <button onClick={() => showView('explore')}>Explore Challenges</button>
                <button onClick={() => showView('dashboard')}>Dashboard</button>
              </div>
            </div>
            <div>
              <h4>Contact</h4>
              <div className="flinks">
                <span style={{ color: '#c3d3e6' }}>Team Hackaholics · SIH26043</span>
                <span style={{ color: '#c3d3e6' }}>hackathon-demo@example.org</span>
              </div>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 SahYog Prototype</span>
            <span>Prototype • Demo Data</span>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={resetDemo}>Reset Demo Data</button>
        </div>
      </footer>

      {/* Fixed elements */}
      <div className="demo-mode-badge"><span className="p" /> DEMO MODE</div>

      {/* Modals */}
      <LoginModal />
      <SolutionModal />
      <OrgProfileModal />
      <ReportWorkflowModal />

      {/* Lightbox */}
      {state.lightboxPhotos.length > 0 && <Lightbox />}

      {/* Toasts */}
      <ToastStack />
    </>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SahYogProvider>
      <AppShell />
    </SahYogProvider>
  );
}
