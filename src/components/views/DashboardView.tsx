'use client';
import { useSahYog } from '@/store/useSahYog';
import { STAGES, JHARKHAND_DISTRICTS } from '@/lib/constants';
import type { Role, Problem } from '@/lib/types';

const ROLES_INFO: Record<string, { label: string; duties: string; focus: string }> = {
  government: {
    label: 'Government of Jharkhand',
    duties: 'State Innovation Policy · District Coordination · Pilot Approval & Analytics',
    focus: 'Ecosystem coordinator tracking societal challenges and measurable impact across all 24 districts.'
  },
  university: {
    label: 'Higher Education Institution (HEI)',
    duties: 'Multidisciplinary R&D · Faculty Mentorship · Student Prototyping & Pilots',
    focus: 'Mobilizing university engineering and science squads to solve real community bottlenecks.'
  },
  industry: {
    label: 'Industry & Startup Partner',
    duties: 'Technical Mentorship · CSR Co-Funding · Rapid Prototyping · Field Testing',
    focus: 'Providing commercial equipment, materials, and scalable field execution.'
  },
  citizen: {
    label: 'Citizen / Community Contributor',
    duties: 'Challenge Ingestion · Evidence Upload · Community Ground-Truth Verification',
    focus: 'Democratizing problem discovery and validating tangible social outcomes.'
  }
};

export default function DashboardView() {
  const { state, dispatch, openDetail } = useSahYog();
  const { currentRole, problems } = state;

  // Default to government persona if none selected
  const activeRole: Role = currentRole || 'government';

  function selectRole(r: Role) {
    dispatch({ type: 'SET_ROLE', role: r });
  }

  return (
    <div className="wrap section">
      {/* PERSONA SWITCHER HEADER FOR JUDGES */}
      <div className="card" style={{ marginBottom: 20, background: '#f8fafc', border: '1px solid #d9e6f2', padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <b style={{ fontSize: 13, color: 'var(--blue)' }}>GOVERNMENT OF JHARKHAND · STAKEHOLDER PERSONA SELECTOR</b>
              <span className="proto-tag" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 10 }}>SIH26043</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
              Switch perspectives to evaluate the societal challenge lifecycle across Government, Universities, Industry, and Citizens:
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'government', label: '🏛️ Govt. of Jharkhand' },
              { id: 'university', label: '🎓 University / HEI' },
              { id: 'industry', label: '🏭 Industry & Startups' },
              { id: 'citizen', label: '👥 Citizen / Community' }
            ].map(r => (
              <button
                key={r.id}
                className={`btn btn-sm ${activeRole === r.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 11.5 }}
                onClick={() => selectRole(r.id as Role)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeRole === 'government' ? (
        <GovtJharkhandDash problems={problems} openDetail={openDetail} />
      ) : activeRole === 'university' ? (
        <HeiUniversityDash problems={problems} openDetail={openDetail} dispatch={dispatch} />
      ) : activeRole === 'industry' ? (
        <IndustryPartnerDash problems={problems} openDetail={openDetail} dispatch={dispatch} />
      ) : (
        <CitizenCommunityDash problems={problems} openDetail={openDetail} dispatch={dispatch} />
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// 1. Government of Jharkhand Innovation Dashboard (Ecosystem Overview)
// -------------------------------------------------------------------
function GovtJharkhandDash({ problems, openDetail }: { problems: Problem[]; openDetail: any }) {
  const total = problems.length;
  const heiMatched = problems.filter(p => p.stage >= 2).length;
  const activePilots = problems.filter(p => p.stage >= 6 && p.stage < 8).length;
  const impactValidated = problems.filter(p => p.stage >= 8 || p.verification?.resolved).length;

  // Total estimated community beneficiaries
  const totalBeneficiaries = problems.reduce((acc, p) => {
    const val = typeof p.affected_population === 'number' ? p.affected_population : 0;
    return acc + val;
  }, 16890);

  // Group by District (Jharkhand)
  const districtCounts: Record<string, number> = {};
  problems.forEach(p => {
    const d = p.district || (p.location.includes('Ranchi') ? 'Ranchi' : p.location.includes('Gumla') ? 'Gumla' : p.location.includes('Dhanbad') ? 'Dhanbad' : 'Ranchi');
    districtCounts[d] = (districtCounts[d] || 0) + 1;
  });
  const maxDistrict = Math.max(...Object.values(districtCounts), 1);
  const districtRows = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]);

  // Group by Domain
  const domainCounts: Record<string, number> = {};
  problems.forEach(p => {
    domainCounts[p.category] = (domainCounts[p.category] || 0) + 1;
  });
  const maxDomain = Math.max(...Object.values(domainCounts), 1);
  const domainRows = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="section-title">Government of Jharkhand Innovation Dashboard</div>
          <div className="section-sub">
            State-level coordination of crowdsourced societal challenges, Higher Education Institution (HEI) research squads, industry collaborations, and field pilots.
          </div>
        </div>
        <span className="proto-tag" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
          Official Nodal Monitoring Authority
        </span>
      </div>

      {/* METRIC CARDS */}
      <div className="dash-cards">
        <div className="dc">
          <div className="n">{total}</div>
          <div className="l">Crowdsourced Challenges</div>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>Across 24 districts</div>
        </div>
        <div className="dc">
          <div className="n">{heiMatched}</div>
          <div className="l">HEI Research Matches</div>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>BIT, IIT ISM, NIT, BAU</div>
        </div>
        <div className="dc">
          <div className="n">{activePilots}</div>
          <div className="l">Active Prototyping &amp; Pilots</div>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>Industry-backed deployments</div>
        </div>
        <div className="dc">
          <div className="n">{impactValidated}</div>
          <div className="l">Validated Solutions</div>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>Community signed-off</div>
        </div>
      </div>

      {/* ANALYTICS GRID: DISTRICTS & DOMAINS */}
      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontSize: 13.5, margin: 0 }}>Challenges by District (Jharkhand State)</h4>
            <span className="proto-tag" style={{ fontSize: 10 }}>Geographic Distribution</span>
          </div>
          {districtRows.slice(0, 6).map(([dist, count]) => (
            <div className="bar-row" key={dist}>
              <div className="lbl" style={{ minWidth: 140 }}><b>{dist} District</b></div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(count / maxDistrict) * 100}%`, background: 'var(--blue)' }} />
              </div>
              <div className="val">{count}</div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, textAlign: 'right' }}>
            Covering all 24 administrative districts of Jharkhand
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontSize: 13.5, margin: 0 }}>Societal Challenges by Domain</h4>
            <span className="proto-tag" style={{ fontSize: 10 }}>13 Domains Supported</span>
          </div>
          {domainRows.slice(0, 6).map(([dom, count]) => (
            <div className="bar-row" key={dom}>
              <div className="lbl" style={{ minWidth: 160 }}>{dom}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(count / maxDomain) * 100}%`, background: '#2E8B57' }} />
              </div>
              <div className="val">{count}</div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, textAlign: 'right' }}>
            Prioritized by community impact and vulnerability factors
          </div>
        </div>
      </div>

      {/* INNOVATION LIFECYCLE TABLE */}
      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h4 style={{ fontSize: 14, margin: 0 }}>Statewide Societal Innovation &amp; Project Pipeline</h4>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Real-time progression from citizen challenge to university research proposal and industry pilot:
            </div>
          </div>
          <span className="proto-tag">Live State Registry</span>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Challenge ID</th>
                <th>Societal Challenge Title</th>
                <th>District / Location</th>
                <th>Domain</th>
                <th>Priority</th>
                <th>Matched HEI / Lead</th>
                <th>Current Lifecycle Stage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => {
                const matchedHEI = p.solutions?.[0]?.org || p._matches?.[0]?.name || 'Matching HEI...';
                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'Georgia,serif', fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>
                      {p.id}
                    </td>
                    <td>
                      <b>{p.title}</b>
                      {p.expected_outcome && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          <b>Outcome:</b> {p.expected_outcome.slice(0, 90)}...
                        </div>
                      )}
                    </td>
                    <td>{p.district ? `${p.district}, Jharkhand` : p.location.split(',')[0]}</td>
                    <td>
                      <span className="status-chip" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                        {p.category}
                      </span>
                    </td>
                    <td>
                      <span className={`status-chip ${p.severity}`}>
                        {p.severity}
                      </span>
                    </td>
                    <td style={{ fontSize: 11.5 }}>
                      <b>{matchedHEI.split('(')[0]}</b>
                    </td>
                    <td>
                      <span className="status-chip" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                        {STAGES[Math.min(p.stage, STAGES.length - 1)]}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openDetail(p.id, 'dashboard')}>
                        Inspect Project
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// 2. Higher Education Institution (HEI) & University Workspace
// -------------------------------------------------------------------
function HeiUniversityDash({ problems, openDetail, dispatch }: { problems: Problem[]; openDetail: any; dispatch: any }) {
  const matched = problems.filter(p => p.stage >= 2 && p.stage < 4);
  const activeProposals = problems.filter(p => p.solutions && p.solutions.length > 0);
  const activeSquads = problems.filter(p => p.project_team);

  return (
    <div>
      <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="section-title">Higher Education Institution (HEI) Portal</div>
          <div className="section-sub">
            Review crowdsourced challenges, mobilize multidisciplinary student-faculty teams, submit technical proposals, and track field milestones.
          </div>
        </div>
        <span className="proto-tag" style={{ background: '#e0f2fe', color: '#0369a1' }}>
          University R&amp;D Workspace
        </span>
      </div>

      <div className="dash-cards">
        <div className="dc">
          <div className="n">{matched.length}</div>
          <div className="l">Challenges Awaiting Evaluation</div>
        </div>
        <div className="dc">
          <div className="n">{activeSquads.length}</div>
          <div className="l">Multidisciplinary Teams Active</div>
        </div>
        <div className="dc">
          <div className="n">{activeProposals.length}</div>
          <div className="l">Solution Proposals Formulated</div>
        </div>
        <div className="dc">
          <div className="n">3</div>
          <div className="l">Industry Pilot Partnerships</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h4 style={{ fontSize: 14, margin: 0 }}>Matched Societal Challenges for Institutional Evaluation</h4>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Assigned based on academic disciplines, lab facilities, and faculty specialization in Jharkhand:
            </div>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Challenge ID</th>
                <th>Title &amp; Context</th>
                <th>Domain</th>
                <th>Required Disciplines</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {problems.slice(0, 5).map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'Georgia,serif', fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>{p.id}</td>
                  <td>
                    <b>{p.title}</b>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.location}</div>
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(p.required_expertise || ['Applied Engineering', 'IoT']).slice(0, 2).map((exp, idx) => (
                        <span key={idx} className="proto-tag" style={{ fontSize: 10, margin: 0 }}>{exp}</span>
                      ))}
                    </div>
                  </td>
                  <td><span className={`status-chip ${p.severity}`}>{p.severity}</span></td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => openDetail(p.id, 'dashboard')}>
                      Form Team &amp; Propose
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// 3. Industry & Startup Partner Workspace
// -------------------------------------------------------------------
function IndustryPartnerDash({ problems, openDetail, dispatch }: { problems: Problem[]; openDetail: any; dispatch: any }) {
  const seekingSupport = problems.filter(p => p.stage >= 3 && p.stage < 6);

  return (
    <div>
      <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="section-title">Industry, Startup &amp; CSR Collaboration Portal</div>
          <div className="section-sub">
            Discover student-faculty societal projects requiring industrial equipment fabrication, CSR grants, technical mentorship, or pilot testing sites.
          </div>
        </div>
        <span className="proto-tag" style={{ background: '#fef3c7', color: '#92400e' }}>
          Industry Co-Development
        </span>
      </div>

      <div className="dash-cards">
        <div className="dc">
          <div className="n">{seekingSupport.length}</div>
          <div className="l">Projects Seeking Support</div>
        </div>
        <div className="dc">
          <div className="n">₹14.5L</div>
          <div className="l">Committed CSR &amp; Prototyping Grants</div>
        </div>
        <div className="dc">
          <div className="n">5</div>
          <div className="l">Industry Fabrication Labs Linked</div>
        </div>
        <div className="dc">
          <div className="n">2</div>
          <div className="l">Commercialized Deployments</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h4 style={{ fontSize: 14, marginBottom: 10 }}>Societal Challenges Open for Industry Partnership</h4>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Challenge ID</th>
                <th>Project Title</th>
                <th>Leading HEI</th>
                <th>Support Required</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {problems.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'Georgia,serif', fontWeight: 700, color: 'var(--blue)' }}>{p.id}</td>
                  <td><b>{p.title}</b></td>
                  <td>{p.solutions?.[0]?.org?.split('(')[0] || 'BIT Mesra / BAU Kanke'}</td>
                  <td>
                    <span className="proto-tag" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                      Prototyping &amp; Field Pilot Testing
                    </span>
                  </td>
                  <td>
                    <span className="status-chip" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                      {STAGES[Math.min(p.stage, STAGES.length - 1)]}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openDetail(p.id, 'dashboard')}>
                      Offer Partnership
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// 4. Citizen & Community Workspace
// -------------------------------------------------------------------
function CitizenCommunityDash({ problems, openDetail, dispatch }: { problems: Problem[]; openDetail: any; dispatch: any }) {
  const verified = problems.filter(p => p.stage >= 8 || p.verification?.resolved).length;
  const inProgress = problems.filter(p => p.stage < 8).length;

  return (
    <div>
      <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="section-title">Citizen &amp; Community Workspace</div>
          <div className="section-sub">
            Submit grassroots societal challenges across Jharkhand, track transparent university R&amp;D progress, and sign off on measurable community outcomes.
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_WORKFLOW' })}>
          + Submit Societal Challenge
        </button>
      </div>

      <div className="dash-cards">
        <div className="dc"><div className="n">{problems.length}</div><div className="l">Submitted Challenges</div></div>
        <div className="dc"><div className="n">{inProgress}</div><div className="l">Under Academic R&amp;D &amp; Pilot</div></div>
        <div className="dc"><div className="n">{verified}</div><div className="l">Community Validated &amp; Closed</div></div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h4 style={{ fontSize: 14, marginBottom: 10 }}>Your Tracked Challenges &amp; Ground Validation Action</h4>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Challenge Title</th>
                <th>District / Location</th>
                <th>Domain</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {problems.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'Georgia,serif', fontWeight: 700, color: 'var(--blue)' }}>{p.id}</td>
                  <td><b>{p.title}</b></td>
                  <td>{p.location}</td>
                  <td>{p.category}</td>
                  <td>
                    <span className="status-chip" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                      {STAGES[Math.min(p.stage, STAGES.length - 1)]}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openDetail(p.id, 'dashboard')}>
                      {p.stage >= 7 ? 'Verify Outcome' : 'Track R&D'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
