'use client';
import { useEffect, useState } from 'react';
import { useSahYog } from '@/store/useSahYog';
import { DEMO_METRICS } from '@/lib/constants';

const FV = [
  { t: '1. Societal Challenge Ingestion', d: 'Citizens & communities document real-world challenges with field evidence' },
  { t: '2. AI Evaluation & Expertise Extraction', d: 'Challenge mapped to domain, priority, and required multidisciplinary disciplines' },
  { t: '3. Higher Education Institution (HEI) Match', d: 'Connected with Jharkhand universities (BIT, IIT ISM, NIT, BAU) on research fit' },
  { t: '4. Multidisciplinary Student-Faculty Team', d: 'Faculty mentor & student innovators form project squad across engineering & science' },
  { t: '5. Solution Proposal & Industry Partnership', d: 'Industry partners (Tata Steel, BCCL, SAIL, Startups) join for mentorship & testing' },
  { t: '6. Field Pilot, Deployment & Validation', d: 'Pilots tested on ground; community signs off on measurable social impact' },
];

const STEPS = [
  {
    n: 1,
    title: '1. Crowdsource Real Societal Challenges',
    desc: 'Citizens, Gram Sabhas, and local bodies submit verified societal challenges across Jharkhand with geotagged field evidence and expected community outcomes.'
  },
  {
    n: 2,
    title: '2. Domain Classification & Expertise Extraction',
    desc: 'Automated evaluation categorizes challenges across 13 societal domains and extracts required disciplines (e.g. IoT, Agronomy, Water Engineering, Data Analytics).'
  },
  {
    n: 3,
    title: '3. Strategic HEI Matching',
    desc: 'Matches challenges to Higher Education Institutions in Jharkhand based on academic disciplines, lab facilities, incubation centres, and faculty specialization.'
  },
  {
    n: 4,
    title: '4. Multidisciplinary Student + Faculty Teams',
    desc: 'Faculty researchers and students across departments formulate research proposals, design low-cost hardware prototypes, and plan pilot deployments.'
  },
  {
    n: 5,
    title: '5. Industry, MSME & Startup Collaboration',
    desc: 'Corporate partners and local startups provide CSR funding, technical mentorship, equipment fabrication, and testing infrastructure to accelerate pilots.'
  },
  {
    n: 6,
    title: '6. Community Validation & Measurable Impact',
    desc: 'Pilots are deployed in field habitations and validated by community beneficiaries before reporting to the Government of Jharkhand analytics dashboard.'
  }
];

export default function HomeView() {
  const { dispatch, openDetail, showView } = useSahYog();
  const [fvIndex, setFvIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFvIndex(i => (i + 1) % FV.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* HERO */}
      <div className="wrap hero-sec">
        <div className="hero-grid">
          <div className="hero">
            <div className="eyebrow-row" style={{ flexWrap: 'wrap', gap: 6 }}>
              <span className="proto-tag" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
                Government of Jharkhand · SIH 2026 (PS: SIH26043)
              </span>
              <span className="demo-tag">Team Hackaholics · Lord&apos;s Inst. of Engg &amp; Tech</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '14px 0 10px', flexWrap: 'wrap' }}>
              <img
                src="/logo.png"
                alt="SahYog - Societal Innovation Portal"
                style={{
                  height: 84,
                  width: 'auto',
                  objectFit: 'contain',
                  borderRadius: 12,
                  boxShadow: '0 4px 16px rgba(20, 84, 143, 0.12)',
                  border: '1px solid rgba(20, 84, 143, 0.1)',
                  background: '#ffffff',
                  padding: 4,
                  flexShrink: 0
                }}
              />
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Connecting Real Problems with the Right Problem Solvers
                </div>
                <h1 style={{ margin: '2px 0 0', lineHeight: 1.15 }}>
                  From Societal Challenges<br />to Scalable Solutions.
                </h1>
              </div>
            </div>
            <p className="sub">
              SahYog connects citizens, communities, the <b>Government of Jharkhand</b>, <b>Higher Education Institutions (HEIs)</b> and <b>industry partners</b> to transform real-world societal challenges into research, innovation and deployable solutions.
            </p>
            <div className="cta-row" style={{ flexWrap: 'wrap', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_WORKFLOW' })}>
                + Submit a Societal Challenge
              </button>
              <button className="btn btn-secondary" onClick={() => openDetail('JH-2026-00101', 'home')}>
                🎯 View Flagship Project (Kanke Solar Irrigation)
              </button>
              <button className="btn btn-secondary" onClick={() => showView('dashboard')}>
                📊 Jharkhand Innovation Dashboard
              </button>
            </div>
          </div>
          <div className="flow-visual">
            <div className="fv-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>JHARKHAND INNOVATION LIFECYCLE</span>
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
            <h3 style={{ fontSize: 15 }}>Government of Jharkhand Innovation Ecosystem Metrics</h3>
            <span className="proto-tag">SIH 2026 Prototype Data · Transparent Evaluation</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Coordinating challenges across 24 Jharkhand districts with HEI research squads</span>
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
          <div className="section-title">The Jharkhand Societal Innovation Ecosystem</div>
          <div className="section-sub">
            Traditional grievance redressal treats societal challenges as mere complaints. SahYog activates universities, student innovators, and industrial partners to engineer sustainable, deployable solutions:
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
          <div className="section-title">Collaborative Innovation Ecosystem Matrix</div>
          <div className="section-sub">
            How each participating stakeholder contributes to taking a grassroots societal challenge to field deployment:
          </div>
        </div>
        <div className="ecosystem">
          <div className="eco-node">
            <b>1. Citizens &amp; Communities</b>
            <span>Challenge Discovery &amp; Ground Truth</span>
          </div>
          <span className="eco-arrow">→</span>
          <div className="eco-node">
            <b>2. Govt. of Jharkhand</b>
            <span>Ecosystem Policy, Permits &amp; Analytics</span>
          </div>
          <span className="eco-arrow">→</span>
          <div className="eco-node">
            <b>3. HEIs &amp; Universities</b>
            <span>Multidisciplinary R&amp;D &amp; Prototyping</span>
          </div>
          <span className="eco-arrow">→</span>
          <div className="eco-node">
            <b>4. Industry &amp; Startups</b>
            <span>Mentorship, Prototyping &amp; Pilot Scale</span>
          </div>
          <span className="eco-arrow">→</span>
          <div className="eco-node">
            <b>5. Community Impact</b>
            <span>Measurable Outcomes &amp; Verification</span>
          </div>
        </div>
      </div>

      {/* EVALUATION & DEFENSE NOTE */}
      <div className="wrap section" style={{ paddingTop: 0 }}>
        <div className="card" style={{ background: '#f8fbfe', border: '1px solid #d4e3f3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: 14, color: 'var(--blue)' }}>SIH 2026 Problem Statement Alignment &amp; Evaluation Integrity</h4>
            <span className="proto-tag">Architecture Integrity</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px' }}>
              • <b>Official Problem Statement:</b> Directly addresses the Government of Jharkhand challenge (PS: SIH26043): <i>&quot;A digital platform to crowdsource societal challenges and facilitate collaborative problem-solving through universities and industry partnerships.&quot;</i>
            </p>
            <p style={{ margin: '0 0 8px' }}>
              • <b>Multidisciplinary Student-Faculty Teams:</b> Facilitates university involvement where faculty mentors lead interdisciplinary squads (e.g. Agricultural Engineering + IoT + Computer Science) to formulate and test deployable prototypes.
            </p>
            <p style={{ margin: 0 }}>
              • <b>Industry &amp; CSR Collaboration:</b> Engages regional industrial leaders (Tata Steel, BCCL, SAIL, Startups) for CSR grants, hardware fabrication, and field test validation.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
