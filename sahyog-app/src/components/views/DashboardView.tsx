'use client';
import { useSahYog } from '@/store/useSahYog';
import { STAGES } from '@/lib/constants';
import { buildMatches } from '@/lib/classifier';
import type { Role } from '@/lib/types';

const ROLES_INFO: Record<string, { label: string; duties: string; focus: string }> = {
  citizen: {
    label: 'Citizen',
    duties: 'Report Societal Problems · Track Real-Time Progress · On-Ground Verification',
    focus: 'Democratizing problem discovery & ensuring solutions work in practice.'
  },
  government: {
    label: 'Government Authority',
    duties: 'Statutory Validation · Departmental Jurisdiction · Permit & Budget Approval',
    focus: 'Enabling civic statutory backing, inspections, and formal approvals.'
  },
  university: {
    label: 'University & Research Lab',
    duties: 'Applied Engineering Research · Low-Cost Prototyping · Material Formulations',
    focus: 'Bringing academic research out of labs to solve real community pain points.'
  },
  industry: {
    label: 'Industry Partner',
    duties: 'Industrial Technology · Material Supply Logistics · Rapid Field Execution',
    focus: 'Providing commercial equipment, materials, and scalable field contracting.'
  },
  ngo: {
    label: 'NGO / Community Liaison',
    duties: 'Grassroots Awareness · Citizen Feedback Surveys · Community Field Mobilization',
    focus: 'Protecting public interest and assisting in neutral citizen verification.'
  }
};

export default function DashboardView() {
  const { state, dispatch, openDetail } = useSahYog();
  const { currentRole, problems } = state;

  function selectRole(r: Role) {
    dispatch({ type: 'SET_ROLE', role: r });
  }

  return (
    <div className="wrap section">
      {/* ROLE SWITCHER HEADER FOR JUDGES */}
      <div className="card" style={{ marginBottom: 20, background: '#f8fafc', border: '1px solid #d9e6f2', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <b style={{ fontSize: 13, color: 'var(--blue)' }}>SIH 2026 EVALUATION: SELECT STAKEHOLDER PERSONA</b>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Switch roles instantly to inspect each perspective in the collaboration loop:</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['citizen', 'government', 'university', 'industry', 'ngo'] as Role[]).map(r => (
              <button
                key={r!}
                className={`btn btn-sm ${currentRole === r ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 11.5, textTransform: 'capitalize' }}
                onClick={() => selectRole(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!currentRole ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>Select a Stakeholder Role to Begin</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: '55ch', margin: '0 auto 20px' }}>
            SahYog features dedicated views tailored to each role in the problem-solving loop. Choose a role above or click one of the cards below:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, textAlign: 'left' }}>
            {Object.entries(ROLES_INFO).map(([k, v]) => (
              <div
                key={k}
                className="card"
                style={{ cursor: 'pointer', border: '1px solid var(--line)', padding: 14 }}
                onClick={() => selectRole(k as Role)}
              >
                <b style={{ fontSize: 14, color: 'var(--blue)' }}>{v.label}</b>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}><b>Duties:</b> {v.duties}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{v.focus}</div>
              </div>
            ))}
          </div>
        </div>
      ) : currentRole === 'citizen' ? (
        <CitizenDash problems={problems} openDetail={openDetail} dispatch={dispatch} />
      ) : currentRole === 'government' ? (
        <GovDash problems={problems} openDetail={openDetail} />
      ) : (
        <OrgDash role={currentRole} problems={problems} openDetail={openDetail} dispatch={dispatch} />
      )}
    </div>
  );
}

function CitizenDash({ problems, openDetail, dispatch }: any) {
  const mine = problems.filter((p: any) => p.date === 'Today');
  const active = problems.filter((p: any) => p.stage < 6).length;
  const inDeployment = problems.filter((p: any) => p.stage === 5 || p.stage === 6).length;
  const verified = problems.filter((p: any) => p.stage >= 7 || p.verification?.resolved).length;
  const rows = mine.length ? mine : problems.slice(0, 4);

  return (
    <div>
      <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="section-title">Citizen Workspace</div>
          <div className="section-sub">Report societal problems, track transparent milestones, and close the loop with on-ground verification.</div>
        </div>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_WORKFLOW' })}>
          + Report New Problem
        </button>
      </div>

      <div className="dash-cards">
        <div className="dc"><div className="n">{problems.length}</div><div className="l">Total Tracked Problems</div></div>
        <div className="dc"><div className="n">{active}</div><div className="l">In Collaboration / Solution</div></div>
        <div className="dc"><div className="n">{inDeployment}</div><div className="l">Awaiting Citizen Verification</div></div>
        <div className="dc"><div className="n">{verified}</div><div className="l">Citizen-Verified Closed</div></div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ fontSize: 14, margin: 0 }}>Community Reports &amp; Verification Action</h4>
          <span className="proto-tag">Citizen Action Queue</span>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Problem ID</th><th>Title</th><th>Location</th><th>Category</th><th>Current Stage</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'Georgia,serif', fontWeight: 700, color: 'var(--blue)' }}>{p.id}</td>
                  <td><b>{p.title}</b></td>
                  <td>{p.location}</td>
                  <td>{p.category}</td>
                  <td>
                    <span className={`status-chip ${p.stage >= 7 ? 'Low' : p.severity}`}>
                      {STAGES[Math.min(p.stage, STAGES.length - 1)]}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openDetail(p.id, 'dashboard')}>
                      {p.stage === 6 ? 'Verify on Ground' : 'Track Status'}
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

function GovDash({ problems, openDetail }: any) {
  const total = problems.length;
  const assigned = problems.filter((p: any) => p.stage >= 2).length;
  const inReview = problems.filter((p: any) => p.stage === 3).length;
  const resolved = problems.filter((p: any) => p.stage >= 6).length;

  const catCounts: Record<string, number> = {};
  problems.forEach((p: any) => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
  const maxCat = Math.max(...Object.values(catCounts), 1);
  const catRows = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="section-title">Government &amp; Civic Authority Portal</div>
          <div className="section-sub">Statutory validation, departmental jurisdiction, and collaborative solution approvals.</div>
        </div>
        <span className="proto-tag">Government Dashboard</span>
      </div>

      <div className="dash-cards">
        <div className="dc"><div className="n">{total}</div><div className="l">Reported in Jurisdiction</div></div>
        <div className="dc"><div className="n">{assigned}</div><div className="l">Departmentally Assigned</div></div>
        <div className="dc"><div className="n">{inReview}</div><div className="l">Proposals Awaiting Approval</div></div>
        <div className="dc"><div className="n">{resolved}</div><div className="l">Field Work Completed</div></div>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h4 style={{ fontSize: 14, marginBottom: 14 }}>Problems by Category (Municipal Zone)</h4>
          {catRows.map(([c, n]) => (
            <div className="bar-row" key={c}>
              <div className="lbl" style={{ minWidth: 150 }}>{c}</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(n / maxCat) * 100}%` }} /></div>
              <div className="val">{n}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h4 style={{ fontSize: 14, marginBottom: 10 }}>Statutory Authority Responsibilities</h4>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px' }}>
              ✓ <b>Statutory Oversight:</b> Validates that citizen complaints fall within municipal charter and assigns the appropriate engineering division.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              ✓ <b>Permit &amp; Solution Approval:</b> Reviews low-cost engineering proposals formulated by universities and contractors to approve right-of-way permits.
            </p>
            <p style={{ margin: 0 }}>
              ✓ <b>Decentralized Execution:</b> Eliminates backlogs by mobilizing academic innovators and private contractors under civic authorization.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h4 style={{ fontSize: 14, marginBottom: 10 }}>Zonal Challenges Requiring Civic Authority Review</h4>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>ID</th><th>Problem Title</th><th>Location</th><th>Category</th><th>Priority</th><th>Stage</th><th>Action</th></tr></thead>
            <tbody>
              {problems.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'Georgia,serif', fontWeight: 700, color: 'var(--blue)' }}>{p.id}</td>
                  <td><b>{p.title}</b></td>
                  <td>{p.location}</td>
                  <td>{p.category}</td>
                  <td><span className={`status-chip ${p.severity}`}>{p.severity}</span></td>
                  <td>{STAGES[Math.min(p.stage, STAGES.length - 1)]}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openDetail(p.id, 'dashboard')}>
                      Manage &amp; Approve
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

function OrgDash({ role, problems, openDetail, dispatch }: any) {
  const info = ROLES_INFO[role] ?? { label: 'Organization', duties: 'Problem Solving', focus: 'Collaboration' };
  const recommended = problems.filter((p: any) => p.stage < 4).slice(0, 4);
  const active = problems.filter((p: any) => p.solutions?.some((s: any) => ['Proposed', 'Under Review', 'Approved', 'In Deployment'].includes(s.status)));
  const completed = problems.filter((p: any) => p.stage >= 6);

  return (
    <div>
      <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="section-title">{info.label} Portal</div>
          <div className="section-sub">{info.duties}</div>
        </div>
        <span className="proto-tag">{info.label} View</span>
      </div>

      <div className="dash-cards">
        <div className="dc"><div className="n">{recommended.length}</div><div className="l">Matched Challenges</div></div>
        <div className="dc"><div className="n">{active.length}</div><div className="l">Active Solution Projects</div></div>
        <div className="dc"><div className="n">{completed.length}</div><div className="l">Deployed Projects</div></div>
        <div className="dc"><div className="n">100%</div><div className="l">Collaborative Model</div></div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <h4 style={{ fontSize: 14, margin: 0 }}>Recommended Challenges Matching {info.label} Expertise</h4>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Ranked by 4-factor compatibility score</div>
          </div>
          <span className="proto-tag">Auto-Matched</span>
        </div>

        {recommended.length === 0 ? (
          <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>No open recommended challenges in queue.</p>
        ) : (
          recommended.map((p: any) => {
            const matches = buildMatches(p.category);
            const topScore = matches.find(m => m.type.toLowerCase() === role)?.score ?? matches[0]?.score ?? 90;
            return (
              <div className="org-card" key={p.id} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <b>{p.title}</b>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                      {p.category} · {p.location} · <span className={`status-chip ${p.severity}`}>{p.severity}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="match-score">{topScore}%</div>
                    <small style={{ fontSize: 10, color: 'var(--muted)' }}>Match Score</small>
                  </div>
                </div>
                <div className="sol-actions" style={{ marginTop: 10 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openDetail(p.id, 'dashboard')}>
                    View Details &amp; Why This Match
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      openDetail(p.id, 'dashboard');
                      setTimeout(() => dispatch({ type: 'OPEN_SOLUTION_MODAL' }), 100);
                    }}
                  >
                    + Submit Solution Proposal
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h4 style={{ fontSize: 14, marginBottom: 10 }}>Active Cross-Sector Collaborations</h4>
        {active.length === 0 ? (
          <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>No active proposals currently under review or deployment.</p>
        ) : (
          active.map((p: any) => (
            <div className="org-card" key={p.id} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b>{p.title}</b>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                  ID: {p.id} &nbsp;|&nbsp; Status: <b>{p.solutions[0]?.status}</b> &nbsp;|&nbsp; Proposer: {p.solutions[0]?.org}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => openDetail(p.id, 'dashboard')}>
                Open Workspace
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
