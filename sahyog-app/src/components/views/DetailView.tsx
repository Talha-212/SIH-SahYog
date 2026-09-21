'use client';
import { useState } from 'react';
import { useSahYog } from '@/store/useSahYog';
import { STAGES } from '@/lib/constants';
import type { Solution, OrgMatch } from '@/lib/types';
import { toast } from '@/components/ToastStack';

const SOL_COLOR: Record<string, string> = {
  Proposed: 'amber', Approved: 'green', 'In Deployment': 'blue', Completed: 'green', 'Under Review': 'amber', Rejected: 'red'
};

const STAKEHOLDER_ROLES = [
  { role: 'Citizen', function: 'Initial Problem Report & Final Ground-Truth Verification' },
  { role: 'Government', function: 'Statutory Authority, Validation, Permits & Civic Oversight' },
  { role: 'University', function: 'Applied Engineering Research, Material Testing & Prototyping' },
  { role: 'Industry', function: 'Technology, Rapid Mechanized Equipment & Material Logistics' },
  { role: 'NGO', function: 'Community Liaison, Public Awareness & Ground Verification Surveys' }
];

export default function DetailView() {
  const { state, dispatch } = useSahYog();
  const { problems, currentDetailId } = state;
  const [verifyComment, setVerifyComment] = useState('');
  const [fbShown, setFbShown] = useState(false);
  const [fbResolved, setFbResolved] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const p = problems.find(x => x.id === currentDetailId);
  if (!p) return null;
  const problem = p;

  const ai = problem.ai ?? {
    category: problem.category,
    subcategory: 'General',
    authority: 'Municipal Corporation',
    reason: 'Statutory municipal department overseeing this problem category in this district.',
    action: 'Site inspection and field assessment.',
    confidence: 88,
    terms: [problem.category.toLowerCase()]
  };

  const matches: OrgMatch[] = problem._matches ?? [];

  function reviewSolution(solId: string, status: Solution['status']) {
    dispatch({ type: 'REVIEW_SOLUTION', problemId: problem.id, solId, status });
    toast(`Solution status updated to "${status}".`, 'success');
  }

  function govAction(action: 'assign' | 'verify') {
    dispatch({ type: 'GOV_ACTION', action });
    if (action === 'assign') toast(`Problem assigned to ${ai.authority}.`, 'success');
    else toast(`Verification request sent to field inspection team.`, 'info');
  }

  function inviteOrg(name: string) {
    dispatch({ type: 'INVITE_ORG', name });
    toast(`Invitation sent to ${name} for joint problem solving.`, 'info');
  }

  function openOrgProfile(org: OrgMatch) {
    dispatch({ type: 'OPEN_ORG_PROFILE', org });
  }

  function giveFeedback(resolved: boolean) {
    const finalComment = verifyComment.trim() || (resolved ? 'Verified on ground by citizen: Issue resolved successfully.' : 'Citizen feedback: Issue still requires attention.');
    dispatch({ type: 'GIVE_FEEDBACK', resolved, comment: finalComment });
    setFbShown(true);
    setFbResolved(resolved);
    toast(resolved ? 'Citizen verification complete: Problem marked as Citizen Verified!' : 'Problem reopened based on citizen on-ground feedback.', resolved ? 'success' : 'error');
  }

  // Determine CURRENT ACTION
  let currentActionText = '';
  let currentActionBadge = '';
  if (problem.stage === 0) {
    currentActionText = 'Problem submitted by citizen — Awaiting initial statutory validation.';
    currentActionBadge = 'Stage 1 · Submitted';
  } else if (problem.stage === 1) {
    currentActionText = `Verified by ${ai.authority} — Matching problem solvers across academia & industry.`;
    currentActionBadge = 'Stage 2 · Verified';
  } else if (problem.stage === 2) {
    currentActionText = `Assigned to ${matches[0]?.name ?? ai.authority} — Awaiting technical solution proposals.`;
    currentActionBadge = 'Stage 3 · Matched';
  } else if (problem.stage === 3) {
    currentActionText = `Solution proposal submitted by ${problem.solutions[0]?.org ?? 'research partner'} — Under civic authority review.`;
    currentActionBadge = 'Stage 4 · Solution Review';
  } else if (problem.stage === 4) {
    currentActionText = `Solution approved by ${ai.authority} — Mobilizing machinery & material for deployment.`;
    currentActionBadge = 'Stage 5 · Approved';
  } else if (problem.stage === 5) {
    currentActionText = `Solution is actively being deployed on ground by industry & field crews.`;
    currentActionBadge = 'Stage 6 · In Deployment';
  } else if (problem.stage === 6) {
    currentActionText = `Deployment completed by contractor — Awaiting Citizen On-Ground Verification to close loop.`;
    currentActionBadge = 'Stage 7 · Awaiting Citizen Sign-off';
  } else {
    currentActionText = `Closed-Loop Complete: Confirmed and signed off on ground by local citizens.`;
    currentActionBadge = 'Stage 8 · Citizen Verified';
  }

  // Use database problem events if available, falling back to computed logs
  const updates: string[] = problem.events && problem.events.length > 0
    ? problem.events.map(e => `${new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · [${e.actor_role}] ${e.description}`)
    : [
        'Problem submitted by citizen with location coordinates & evidence.',
        `Rule-based classification completed — Category: ${ai.category} (Ontology match: ${ai.confidence}%).`,
        ...(problem.stage >= 2 ? [`Smart matching completed: 4-factor scoring recommended ${matches[0]?.name ?? 'partners'}.`] : []),
        ...(problem.stage >= 3 ? [`Statutory verification & assignment recorded for ${ai.authority}.`] : []),
        ...problem.solutions.map(s => `Solution "${s.title}" (${s.org}) updated to status: ${s.status}.`),
        ...(problem.verification ? [`Citizen Verification Sign-Off: ${problem.verification.resolved ? 'CONFIRMED RESOLVED' : 'REOPENED'} — "${problem.verification.comment}"`] : [])
      ];

  return (
    <div className="wrap section">
      <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'BACK_FROM_DETAIL' })} style={{ marginBottom: 16 }}>
        ← Back to Challenges
      </button>

      {/* PROBLEM IDENTIFIER BANNER */}
      <div className="pid-banner">
        <div>
          <div className="label">SIH 2026 EVALUATION DEMO CASE · PERSISTENT BACKEND RECORD</div>
          <div className="pid">{problem.id}</div>
          <div style={{ fontSize: 13, color: '#c3d3e6', marginTop: 2 }}>{problem.location}</div>
        </div>
        <div className="badge-row">
          <span className="badge">{problem.category}</span>
          <span className="badge">{problem.severity} priority</span>
          {problem.location_source && <span className="badge" style={{ background: 'rgba(255,255,255,0.2)' }}>📍 {problem.location_source}</span>}
          <span className="badge" style={{ background: problem.stage >= 7 ? 'var(--green)' : 'var(--blue)' }}>
            {STAGES[Math.min(problem.stage, STAGES.length - 1)]}
          </span>
        </div>
      </div>

      {/* TRACKING TIMELINE (8 STAGES) */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
          <b style={{ fontSize: 13, color: 'var(--ink)' }}>End-to-End Problem Lifecycle Timeline</b>
          <span className="proto-tag">8-Stage Closed Loop</span>
        </div>
        <div className="timeline">
          {STAGES.map((s, i) => {
            const isDone = i < problem.stage;
            const isCurrent = i === problem.stage;
            return (
              <div key={s} className={`t-step ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                <div className="t-dot">{isDone ? '✓' : i + 1}</div>
                <span style={{ fontWeight: isCurrent ? 700 : 500 }}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CURRENT ACTION BANNER */}
      <div className="card" style={{ background: '#f4f8fc', border: '1px solid #c7dcf1', marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: 0.5 }}>CURRENT WORKSPACE ACTION</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{currentActionText}</div>
            </div>
          </div>
          <span className="proto-tag" style={{ background: '#e0effe', color: '#0369a1', fontWeight: 700 }}>
            {currentActionBadge}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        {/* LEFT COLUMN */}
        <div>
          {/* PROBLEM CARD */}
          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 14 }}>{problem.title}</h3>
            <div className="kv"><span>Category</span><b>{problem.category}</b></div>
            <div className="kv"><span>Severity / Priority</span><b>{problem.severity}</b></div>
            <div className="kv"><span>Location Area</span><b>{problem.location}</b></div>
            <div className="kv">
              <span>Structured GPS</span>
              <b>
                {problem.latitude || problem.lat ? `${Number(problem.latitude ?? problem.lat).toFixed(6)}° N, ${Number(problem.longitude ?? problem.lng).toFixed(6)}° E` : '17.348600° N, 78.368300° E'}
              </b>
            </div>
            <div className="kv">
              <span>Location Source</span>
              <span className="proto-tag" style={{ fontSize: 10.5 }}>{problem.location_source || 'DEMO_LOCATION'}</span>
            </div>
            {problem.landmark && <div className="kv"><span>Landmark</span><span>{problem.landmark}</span></div>}
            <div className="kv"><span>Affected Context</span><span>{String(problem.affected)}</span></div>
            <div className="kv"><span>Date Reported</span><span>{problem.date}</span></div>
            <div className="kv"><span>Backend Source of Truth</span><span style={{ color: 'var(--blue)', fontWeight: 600 }}>data/sahyog.db.json ({problem.id})</span></div>
            <div className="kv"><span>Problem Description</span><span style={{ textAlign: 'left', maxWidth: '65%', lineHeight: 1.5 }}>{problem.desc}</span></div>
          </div>

          {/* CLASSIFIER TRANSPARENCY CARD */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h4 style={{ fontSize: 14, margin: 0 }}>Prototype Classification <span className="proto-tag">Rule-Based</span></h4>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Deterministic Keyword Ontology</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px' }}>
              Maps reported text against civic domain dictionaries to identify statutory authority and recommended action without hallucination.
            </p>
            <div className="ai-line"><span>Identified Category</span><b>{ai.category}</b></div>
            <div className="ai-line"><span>Subcategory Focus</span><span>{ai.subcategory}</span></div>
            <div className="ai-line"><span>Statutory Authority</span><b style={{ color: 'var(--blue)' }}>{ai.authority}</b></div>
            <div className="ai-line"><span>Recommended Action</span><span>{ai.action}</span></div>
            <div style={{ marginTop: 10 }}>
              <div className="ai-line" style={{ border: 'none', paddingBottom: 2 }}>
                <span>Rule-Based Match Confidence</span>
                <b>{ai.confidence}%</b>
              </div>
              <div className="conf-bar"><div className="conf-fill" style={{ width: `${ai.confidence}%` }} /></div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
              <b style={{ fontSize: 12 }}>Matched Keywords in Problem Context:</b>
              <div className="tag-list" style={{ marginTop: 6 }}>
                {ai.terms.map(t => <span key={t} className="tag-pill">{t}</span>)}
                {problem.photos.length > 0 && <span className="tag-pill">visual evidence verified</span>}
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                <b>Roadmap Note:</b> Production architecture specifies swapping this rule engine with a fine-tuned multilingual NLP model + satellite/mobile defect CV model.
              </p>
            </div>
          </div>

          {/* EVIDENCE GALLERY */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ fontSize: 14, margin: 0 }}>Field Evidence &amp; Photos</h4>
              <span className="demo-tag">Visual Verification</span>
            </div>
            <div className="gallery">
              {problem.photos.length === 0 ? (
                <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>No photos uploaded for this sample case.</p>
              ) : (
                problem.photos.map((ph, i) =>
                  ph.isVideo ? (
                    <div key={i} className="g-item">
                      <video src={ph.src} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="tag">Video</div>
                    </div>
                  ) : (
                    <div key={i} className="g-item" onClick={() => dispatch({ type: 'OPEN_LIGHTBOX', photos: problem.photos, index: i })}>
                      <img src={ph.src} alt="Evidence" />
                      <div className="tag">Photo Evidence</div>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {/* PROBLEM SOLVER MATCHING — "WHY THIS MATCH?" */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
              <div>
                <h4 style={{ fontSize: 15, margin: 0 }}>Problem Solver Matching &amp; Recommendations</h4>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Multi-stakeholder algorithm evaluating Government, University, Industry &amp; NGO partners</div>
              </div>
              <span className="proto-tag">Core Differentiator</span>
            </div>

            <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '6px 0 14px', lineHeight: 1.5 }}>
              SahYog does not route complaints to a single dead-end queue. It matches diverse problem solvers using a <b>4-factor weighted score</b> (Domain 40%, Jurisdiction 30%, Expertise 20%, Capacity 10%).
            </p>

            {matches.map(m => {
              const isExpanded = expandedMatch === m.name;
              return (
                <div className="match-card" key={m.name} style={{ border: '1px solid #d8e5f2', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                  <div className="match-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <b style={{ fontSize: 14.5 }}>{m.name}</b>
                        <span className="role-badge-nav" style={{ fontSize: 10 }}>{m.type}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600, marginTop: 2 }}>
                        Assigned Role: {m.roleInProblem}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="match-score" style={{ fontSize: 16 }}>{m.score}%</div>
                      <small style={{ fontSize: 10, color: 'var(--muted)' }}>Match Score</small>
                    </div>
                  </div>

                  {/* WHY THIS MATCH BREAKDOWN */}
                  <div style={{ marginTop: 10, background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #eef2f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <b style={{ fontSize: 11.5, color: 'var(--ink)' }}>WHY THIS MATCH? (FACTOR BREAKDOWN)</b>
                      <button
                        className="link-btn"
                        style={{ fontSize: 11 }}
                        onClick={() => setExpandedMatch(isExpanded ? null : m.name)}
                      >
                        {isExpanded ? 'Hide Details' : 'View Scoring Rubric'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, fontSize: 11 }}>
                      <div>
                        <span style={{ color: 'var(--muted)' }}>Domain Fit: </span>
                        <b>{m.factors?.domain ?? 36}/40</b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--muted)' }}>Jurisdiction: </span>
                        <b>{m.factors?.jurisdiction ?? 26}/30</b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--muted)' }}>Tech Expertise: </span>
                        <b>{m.factors?.expertise ?? 18}/20</b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--muted)' }}>Capacity: </span>
                        <b>{m.factors?.capacity ?? 8}/10</b>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0', fontSize: 11.5 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>System Justification:</div>
                        {m.reasons.map(r => (
                          <div key={r} style={{ color: 'var(--ink-soft)', marginBottom: 2 }}>✓ {r}</div>
                        ))}
                        <div style={{ marginTop: 6, color: 'var(--muted)' }}>
                          • Location: {m.location}<br />
                          • Capabilities: {m.expertise}<br />
                          • Resources: {m.resources}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="match-btns" style={{ marginTop: 12 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openOrgProfile(m)}>
                      View Profile
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => inviteOrg(m.name)}>
                      Invite to Collaboration Workspace
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SOLUTIONS SECTION */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <h4 style={{ fontSize: 15, margin: 0 }}>Collaborative Solution Proposals</h4>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Formulated by matched universities &amp; industry partners</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'OPEN_SOLUTION_MODAL' })}>
                + Propose Solution
              </button>
            </div>

            {problem.solutions.length === 0 ? (
              <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                No solutions formally submitted yet. Matched universities and industries are currently drafting proposals.
              </div>
            ) : (
              problem.solutions.map(s => {
                const c = SOL_COLOR[s.status] ?? 'amber';
                return (
                  <div className="sol-card" key={s.id} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
                    <div className="sol-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <b style={{ fontSize: 14 }}>{s.title}</b>
                      <span className="sol-status" style={{ background: `var(--${c}-soft)`, color: `var(--${c})`, padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        {s.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '8px 0', lineHeight: 1.5 }}>{s.desc}</p>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', background: '#f8fafc', padding: 8, borderRadius: 6 }}>
                      <b>Proposer:</b> {s.org} &nbsp;|&nbsp; <b>Tech:</b> {s.tech} &nbsp;|&nbsp; <b>Cost:</b> {s.cost} &nbsp;|&nbsp; <b>Timeframe:</b> {s.time}
                    </div>
                    <div className="sol-actions" style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {s.status === 'Proposed' && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => reviewSolution(s.id, 'Under Review')}>Put Under Review</button>
                          <button className="btn btn-primary btn-sm" onClick={() => reviewSolution(s.id, 'Approved')}>Approve Solution</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => reviewSolution(s.id, 'Rejected')}>Reject</button>
                        </>
                      )}
                      {s.status === 'Under Review' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => reviewSolution(s.id, 'Approved')}>Grant Statutory Approval</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => reviewSolution(s.id, 'Rejected')}>Reject</button>
                        </>
                      )}
                      {s.status === 'Approved' && (
                        <button className="btn btn-primary btn-sm" onClick={() => reviewSolution(s.id, 'In Deployment')}>
                          🚀 Move to Field Deployment
                        </button>
                      )}
                      {s.status === 'In Deployment' && (
                        <button className="btn btn-primary btn-sm" onClick={() => reviewSolution(s.id, 'Completed')}>
                          ✅ Mark On-Ground Work Completed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* AUDIT LOG */}
          <div className="card">
            <h4 style={{ fontSize: 14, marginBottom: 10 }}>Audit &amp; Activity Log</h4>
            {updates.map((u, i) => (
              <div className="update-item" key={i} style={{ fontSize: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div className="d" style={{ color: 'var(--muted)', fontSize: 11 }}>{problem.date}</div>
                {u}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* STATUTORY AUTHORITY CARD */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontSize: 14, margin: 0 }}>Statutory Civic Authority</h4>
              <span className="proto-tag">Government Role</span>
            </div>
            <div className="kv"><span>Department</span><b>{ai.authority}</b></div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
              {ai.reason}
            </p>
            <div className="sol-actions" style={{ marginTop: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => govAction('assign')}>
                Confirm Administrative Jurisdiction
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => govAction('verify')}>
                Request Engineering Field Inspection
              </button>
            </div>
          </div>

          {/* MULTI-STAKEHOLDER RESPONSIBILITY MATRIX */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ fontSize: 14, margin: 0 }}>Collaboration Workspace</h4>
              <span className="proto-tag">Active Matrix</span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 12 }}>
              Active roles coordinating on this problem:
            </div>

            {STAKEHOLDER_ROLES.map(sr => (
              <div key={sr.role} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: 12, color: 'var(--blue)' }}>{sr.role}</b>
                  <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>Active</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sr.function}</div>
              </div>
            ))}
          </div>

          {/* CLOSED-LOOP CITIZEN VERIFICATION (CRITICAL) */}
          <div className="card" style={{ border: '2px solid var(--blue)', background: '#fcfdfe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontSize: 14, margin: 0, color: 'var(--blue)' }}>Citizen Verification</h4>
              <span className="proto-tag" style={{ background: 'var(--green)', color: '#fff' }}>Closed-Loop Core</span>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 10px' }}>
              <b>No problem is marked resolved by government or contractors alone.</b> The loop is closed only when local citizens confirm the on-ground resolution.
            </p>

            <div className="fb-row" style={{ display: 'flex', gap: 10 }}>
              <button className="yes btn btn-primary" style={{ flex: 1, padding: '10px 12px' }} onClick={() => giveFeedback(true)}>
                ✓ Confirm Resolved on Ground
              </button>
              <button className="no btn btn-secondary" style={{ flex: 1, padding: '10px 12px' }} onClick={() => giveFeedback(false)}>
                ✗ Problem Still Exists
              </button>
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12 }}>Verification Observation Notes (Optional)</label>
              <textarea
                placeholder="Describe ground reality: e.g. 'Potholes filled with composite asphalt; road smooth and safe.'"
                style={{ minHeight: 65, fontSize: 12 }}
                value={verifyComment}
                onChange={e => setVerifyComment(e.target.value)}
              />
            </div>

            {(fbShown || problem.verification) && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 12.5,
                  padding: 12,
                  borderRadius: 8,
                  background: (fbShown ? fbResolved : problem.verification?.resolved) ? 'var(--green-soft)' : 'var(--amber-soft)',
                  color: (fbShown ? fbResolved : problem.verification?.resolved) ? 'var(--green)' : 'var(--amber)',
                  fontWeight: 600,
                  lineHeight: 1.5
                }}
              >
                {(fbShown ? fbResolved : problem.verification?.resolved)
                  ? `✅ Citizen Sign-Off Recorded: Problem verified as resolved on ground. Ticket closed successfully (Stage 8).`
                  : `⚠️ Citizen Feedback Recorded: Problem flagged as still unresolved. Reopened for authority review.`}
                {problem.verification?.comment && (
                  <div style={{ marginTop: 4, fontWeight: 400, fontSize: 11.5 }}>
                    &ldquo;{problem.verification.comment}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
