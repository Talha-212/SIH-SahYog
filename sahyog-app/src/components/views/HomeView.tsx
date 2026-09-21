'use client';
import { useEffect, useState } from 'react';
import { useSahYog } from '@/store/useSahYog';
import { DEMO_METRICS } from '@/lib/constants';

const FV = [
  { t: 'Citizen Report', d: 'Structured problem reported with evidence & geolocation' },
  { t: 'Rule-Based Classification', d: 'Category, severity & statutory authority mapped' },
  { t: 'Solver Matching', d: 'Govt, University, Industry & NGO matched with transparent scores' },
  { t: 'Collaboration Workspace', d: 'Joint solution proposed, evaluated & authorized' },
  { t: 'Deployment', d: 'Field execution with material & technical backing' },
  { t: 'Citizen Verification', d: 'Ground-truth sign-off closes the problem loop' },
];

const STEPS = [
  { n: 1, title: '1. Structured Report', desc: 'Citizen submits a real societal challenge with exact geo-coordinates, photos, and context.' },
  { n: 2, title: '2. Deterministic Classification', desc: 'Rule-based prototype engine identifies category, priority, and the mandated statutory civic department.' },
  { n: 3, title: '3. Multi-Stakeholder Matching', desc: 'Recommends capable problem solvers across Government, Academia, Industry, and NGOs with "Why This Match?" factor scores.' },
  { n: 4, title: '4. Collaborative Solution', desc: 'University and industry partners engineer solution proposals with transparent cost, time, and tech specs for civic review.' },
  { n: 5, title: '5. Ground Deployment', desc: 'Approved solutions move to field execution backed by municipal permits and contractor equipment.' },
  { n: 6, title: '6. Citizen Verification', desc: 'The loop is never closed until local citizens inspect the ground reality and confirm the resolution.' },
];

export default function HomeView() {
  const { dispatch, openDetail } = useSahYog();
  const [fvIndex, setFvIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFvIndex(i => (i + 1) % FV.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* HERO */}
      <div className="wrap hero-sec">
        <div className="hero-grid">
          <div className="hero">
            <div className="eyebrow-row" style={{ flexWrap: 'wrap', gap: 6 }}>
              <span className="proto-tag">SIH 2026 Prototype · PS ID: SIH26043</span>
              <span className="demo-tag">Team Hackaholics · Lord&apos;s Inst. of Engg &amp; Tech</span>
            </div>
            <h1>From Citizen Problem<br />to Real-World Solution.</h1>
            <p className="sub">
              SahYog is <b>not</b> a traditional grievance portal. It is a collaborative digital bridge connecting citizen-reported societal problems with <b>Government authorities, University research labs, Industry executors, and NGOs</b> to co-create, deploy, and citizen-verify tangible solutions.
            </p>
            <div className="cta-row" style={{ flexWrap: 'wrap', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_WORKFLOW' })}>
                + Report a Problem
              </button>
              <button className="btn btn-secondary" onClick={() => openDetail('SY-2026-00101', 'home')}>
                🎯 View Flagship Demo Case
              </button>
              <button className="btn btn-secondary" onClick={() => dispatch({ type: 'SET_VIEW', view: 'explore' })}>
                Explore Challenges
              </button>
            </div>
          </div>
          <div className="flow-visual">
            <div className="fv-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>CORE PRODUCT JOURNEY</span>
              <span className="proto-tag" style={{ fontSize: 9 }}>Interactive</span>
            </div>
            {FV.map((s, i) => (
              <div key={i} className={`fv-step ${i === fvIndex ? 'active' : ''}`}>
                <div className="fv-num">{i + 1}</div>
                <div><b>{s.t}</b><small>{s.d}</small></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS - HONEST PROTOTYPE METRICS */}
      <div className="wrap stats-sec">
        <div className="stats-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 15 }}>SIH 2026 Evaluation Prototype Metrics</h3>
            <span className="proto-tag">Prototype Data · No Fake Claims</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Pre-seeded with realistic scenarios for live hackathon evaluation</span>
        </div>
        <div className="stat-grid">
          {DEMO_METRICS.map(m => (
            <div className="stat-card" key={m.label}>
              <div className="stat-num">{m.value}</div>
              <div className="stat-label">{m.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="wrap section" id="how-it-works">
        <div className="section-head">
          <div className="section-title">The SahYog Collaborative Model</div>
          <div className="section-sub">
            Grievance redressal fails when citizen reports sit in administrative queues. SahYog activates an agile multi-stakeholder ecosystem:
          </div>
        </div>
        <div className="steps-grid">
          {STEPS.map(s => (
            <div className="step-card" key={s.n}>
              <div className="sn">{s.n}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MULTI-STAKEHOLDER MATRIX */}
      <div className="wrap section" id="about">
        <div className="section-head">
          <div className="section-title">Multi-Stakeholder Collaboration Matrix</div>
          <div className="section-sub">
            How each participating organization plays an essential role in taking a societal problem to completion:
          </div>
        </div>
        <div className="ecosystem">
          <div className="eco-node">
            <b>1. Citizens</b>
            <span>Report &amp; Ground Verification</span>
          </div>
          <span className="eco-arrow">→</span>
          <div className="eco-node">
            <b>2. Government</b>
            <span>Authority, Validation &amp; Permits</span>
          </div>
          <span className="eco-arrow">→</span>
          <div className="eco-node">
            <b>3. Universities</b>
            <span>Research &amp; Engineering Solution</span>
          </div>
          <span className="eco-arrow">→</span>
          <div className="eco-node">
            <b>4. Industry</b>
            <span>Materials, Equipment &amp; Deployment</span>
          </div>
          <span className="eco-arrow">→</span>
          <div className="eco-node">
            <b>5. NGOs</b>
            <span>Community Liaison &amp; Assistance</span>
          </div>
        </div>
      </div>

      {/* ARCHITECTURE & DEFENSE NOTE */}
      <div className="wrap section" style={{ paddingTop: 0 }}>
        <div className="card" style={{ background: '#f8fbfe', border: '1px solid #d4e3f3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: 14, color: 'var(--blue)' }}>SIH 2026 Evaluator Note: Technical Defensibility &amp; Honesty</h4>
            <span className="proto-tag">Architecture Defense</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px' }}>
              • <b>Classification:</b> Powered by a deterministic rule and keyword ontology mapped directly to Indian municipal bodies (GHMC, PWD, HMWSSB). An NLP fine-tuning pipeline is planned in the production roadmap.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              • <b>Problem Solver Matching:</b> Driven by a weighted 4-factor scoring rubric: <i>Problem Domain (40%)</i>, <i>Jurisdiction / Proximity (30%)</i>, <i>Technical Expertise (20%)</i>, and <i>Capacity (10%)</i>.
            </p>
            <p style={{ margin: 0 }}>
              • <b>Closed-Loop Integrity:</b> Problems cannot reach status <i>Citizen Verified</i> without explicit citizen confirmation, preventing false closure of community grievances.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
