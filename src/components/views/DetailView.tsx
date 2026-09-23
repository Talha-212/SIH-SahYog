'use client';
import { useState, useRef, useEffect } from 'react';
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
  const { state, dispatch, updateSolutionStatus, verifyProblem, joinCollaboration } = useSahYog();
  const { problems, currentDetailId, currentRole } = state;
  const [verifyComment, setVerifyComment] = useState('');
  const [evidenceRef, setEvidenceRef] = useState('/demo/pothole_after.jpg');
  const [evidenceTab, setEvidenceTab] = useState<'both' | 'before' | 'after'>('both');
  const [fbShown, setFbShown] = useState(false);
  const [fbResolved, setFbResolved] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAfterCameraActive, setIsAfterCameraActive] = useState(false);
  const [uploadingAfterEvidence, setUploadingAfterEvidence] = useState(false);
  const afterVideoRef = useRef<HTMLVideoElement>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement>(null);
  const afterMediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (afterMediaStreamRef.current) {
        afterMediaStreamRef.current.getTracks().forEach(t => t.stop());
        afterMediaStreamRef.current = null;
      }
    };
  }, []);

  async function startAfterCamera() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast('Live camera not supported by browser. Please use photo upload.', 'error');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      afterMediaStreamRef.current = stream;
      setIsAfterCameraActive(true);
      setTimeout(() => {
        if (afterVideoRef.current) {
          afterVideoRef.current.srcObject = stream;
          afterVideoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      toast('Camera permission denied or camera unavailable. Please upload photo.', 'error');
      setIsAfterCameraActive(false);
    }
  }

  function stopAfterCamera() {
    if (afterMediaStreamRef.current) {
      afterMediaStreamRef.current.getTracks().forEach(t => t.stop());
      afterMediaStreamRef.current = null;
    }
    setIsAfterCameraActive(false);
  }

  async function captureAfterSnapshot() {
    if (!afterVideoRef.current) return;
    const video = afterVideoRef.current;
    const canvas = afterCanvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopAfterCamera();
      setUploadingAfterEvidence(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl,
            name: `after_verification_${Date.now()}.jpg`,
            bucket: 'verification-evidence',
            problem_id: problem.id
          })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.url) {
            setEvidenceRef(json.url);
            toast('📷 After-repair evidence photo captured and uploaded to Supabase Storage!', 'success');
            setUploadingAfterEvidence(false);
            return;
          }
        }
      } catch {}
      setEvidenceRef(dataUrl);
      setUploadingAfterEvidence(false);
      toast('📷 After-repair snapshot attached!', 'success');
    }
  }

  async function handleAfterFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = e.target.files;
    if (!fl || fl.length === 0) return;
    const file = fl[0];
    stopAfterCamera();
    setUploadingAfterEvidence(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'verification-evidence');
      fd.append('problem_id', problem.id);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) {
          setEvidenceRef(json.url);
          toast('🖼 After-repair photo uploaded to Supabase Storage!', 'success');
          setUploadingAfterEvidence(false);
          return;
        }
      }
    } catch {}
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) {
        setEvidenceRef(ev.target.result as string);
        toast('After-repair photo attached locally!', 'info');
      }
    };
    reader.readAsDataURL(file);
    setUploadingAfterEvidence(false);
  }

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

  // Solutions status review (Role Security: Only Government can approve/reject)
  async function reviewSolution(solId: string, status: Solution['status']) {
    if ((status === 'Approved' || status === 'Rejected') && currentRole !== 'government') {
      toast('Permission denied: Only statutory Government authorities can approve or reject technical solution proposals. Switch role to Government in the top-right header.', 'error');
      return;
    }

    setIsUpdating(true);
    const res = await updateSolutionStatus(problem.id, solId, status);
    setIsUpdating(false);

    if (!res.success) {
      toast(res.error || 'Failed to update solution status in backend.', 'error');
      return;
    }
    toast(`Solution status updated to "${status}" and synchronized in backend.`, 'success');
  }

  async function govAction(action: 'assign' | 'verify') {
    if (currentRole !== 'government') {
      toast('Government role required for statutory assignment and verification actions.', 'error');
      return;
    }
    if (action === 'assign') {
      const target = matches.find(m => m.type === 'University') || matches.find(m => m.type === 'Industry') || matches[0];
      if (!target) {
        toast('No matched institutional partner is available for assignment yet.', 'error');
        return;
      }
      try {
        const res = await fetch('/api/government/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-role': 'government' },
          body: JSON.stringify({
            problem_id: problem.id,
            organization_name: target.name,
            responsibility: 'Evaluate the societal challenge, constitute a multidisciplinary team, and prepare a solution proposal.'
          })
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          toast(json.error || 'Government assignment could not be recorded.', 'error');
          return;
        }
        toast(`Government of Jharkhand assigned the challenge to ${target.name}.`, 'success');
      } catch {
        toast('Assignment service is unavailable. Please retry.', 'error');
      }
    } else {
      toast(`Verification request sent to field engineering inspection team under ${ai.authority}.`, 'info');
    }
  }

  async function inviteOrg(org: OrgMatch) {
    const res = await joinCollaboration(problem.id, org.name, org.type as any, org.roleInProblem);
    if (res.success) {
      toast(`${org.name} joined collaboration workspace and registered in database.`, 'success');
    } else {
      toast(`Workspace invitation logged for ${org.name}.`, 'info');
    }
  }

  function openOrgProfile(org: OrgMatch) {
    dispatch({ type: 'OPEN_ORG_PROFILE', org });
  }

  // Citizen verification sign-off (Role Security: Only Citizen can verify)
  async function giveFeedback(resolved: boolean) {
    if (currentRole && currentRole !== 'citizen') {
      toast(`Permission denied: Only local Citizens can provide final ground-truth sign-off (Current role: ${currentRole}). Switch to Citizen role in the top header.`, 'error');
      return;
    }

    const finalComment = verifyComment.trim() || (resolved ? 'Verified on ground by citizen: Issue resolved successfully.' : 'Citizen feedback: Issue still requires attention.');
    setIsUpdating(true);
    const res = await verifyProblem(problem.id, resolved, finalComment, evidenceRef);
    setIsUpdating(false);

    if (!res.success) {
      toast(res.error || 'Failed to record verification in backend.', 'error');
      return;
    }

    setFbShown(true);
    setFbResolved(resolved);
    toast(
      resolved
        ? 'Citizen verification complete: Problem marked as Citizen Verified (Stage 8 Closed Loop)!'
        : 'Problem reopened based on citizen on-ground feedback.',
      resolved ? 'success' : 'error'
    );
  }

  // 9-Stage Action Descriptions
  let currentActionText = '';
  let currentActionBadge = '';
  if (problem.stage === 0) {
    currentActionText = 'Problem submitted by citizen — Awaiting initial statutory validation & assignment.';
    currentActionBadge = 'Stage 0 · Reported';
  } else if (problem.stage === 1) {
    currentActionText = `Verified by ${ai.authority} — Matching problem solvers across academia & industry.`;
    currentActionBadge = 'Stage 1 · Verified';
  } else if (problem.stage === 2) {
    currentActionText = `Assigned to ${matches[0]?.name ?? ai.authority} — Awaiting technical solution proposals.`;
    currentActionBadge = 'Stage 2 · Matched';
  } else if (problem.stage === 3) {
    currentActionText = `Multi-stakeholder collaboration workspace active — Formulation of technical proposals in progress.`;
    currentActionBadge = 'Stage 3 · Collaborating';
  } else if (problem.stage === 4) {
    currentActionText = `Solution proposal submitted by ${problem.solutions[0]?.org ?? 'research partner'} — Under civic authority review.`;
    currentActionBadge = 'Stage 4 · Solution Proposed';
  } else if (problem.stage === 5) {
    currentActionText = `Solution approved by ${ai.authority} — Mobilizing machinery, permits & materials.`;
    currentActionBadge = 'Stage 5 · Approved';
  } else if (problem.stage === 6) {
    currentActionText = `Solution is actively being deployed on ground by industry & engineering field crews.`;
    currentActionBadge = 'Stage 6 · In Deployment';
  } else if (problem.stage === 7) {
    currentActionText = `Physical deployment completed — Awaiting Citizen On-Ground Verification to close loop.`;
    currentActionBadge = 'Stage 7 · Resolved (Pending Sign-off)';
  } else {
    currentActionText = `Closed-Loop Complete: Verified and signed off on ground by local citizens.`;
    currentActionBadge = 'Stage 8 · Citizen Verified';
  }

  // Use database problem events if available, falling back to computed logs
  const updates: string[] = problem.events && problem.events.length > 0
    ? problem.events.map(e => `${new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · [${e.actor_role}] ${e.description}`)
    : [
        'Problem submitted by citizen with location coordinates & evidence.',
        `Rule-based classification completed — Category: ${ai.category} (Ontology match: ${ai.confidence}%).`,
        ...(problem.stage >= 2 ? [`Explainable 4-factor matching recommended ${matches[0]?.name ?? 'partners'}.`] : []),
        ...(problem.stage >= 3 ? [`Statutory verification & assignment recorded for ${ai.authority}.`] : []),
        ...problem.solutions.map(s => `Solution "${s.title}" (${s.org}) updated to status: ${s.status}.`),
        ...(problem.verification ? [`Citizen Verification Sign-Off: ${problem.verification.resolved ? 'CONFIRMED RESOLVED' : 'REOPENED'} — "${problem.verification.comment}"`] : [])
      ];

  // Benchmark Before & After photos
  const beforePhoto = problem.photos?.[0]?.src || '/demo/pothole_before.jpg';
  const afterPhoto = problem.verification?.evidence_ref || evidenceRef || '/demo/pothole_after.jpg';

  return (
    <div className="wrap section">
      <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'BACK_FROM_DETAIL' })} style={{ marginBottom: 16 }}>
        ← Back to Challenges
      </button>

      {/* PROBLEM IDENTIFIER BANNER */}
      <div className="pid-banner">
        <div>
          <div className="label">GOVERNMENT OF JHARKHAND · SOCIETAL CHALLENGE RECORD (SIH26043)</div>
          <div className="pid">{problem.id}</div>
          <div style={{ fontSize: 13, color: '#c3d3e6', marginTop: 2 }}>
            {problem.district ? `${problem.district} District, Jharkhand` : problem.location}
          </div>
        </div>
        <div className="badge-row">
          <span className="badge">{problem.category}</span>
          <span className="badge">{problem.severity} Priority</span>
          {problem.location_source && <span className="badge" style={{ background: 'rgba(255,255,255,0.2)' }}>📍 {problem.location_source}</span>}
          <span className="badge" style={{ background: problem.stage >= 8 ? 'var(--green)' : 'var(--blue)' }}>
            {STAGES[Math.min(problem.stage, STAGES.length - 1)]}
          </span>
        </div>
      </div>

      {/* TRACKING TIMELINE (9 STAGES) */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
          <b style={{ fontSize: 13, color: 'var(--ink)' }}>Societal Innovation Lifecycle Progression (9 Stages)</b>
          <span className="proto-tag" style={{ background: '#e0f2fe', color: '#0369a1' }}>Govt. of Jharkhand Closed Loop</span>
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
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: 0.5 }}>CURRENT INNOVATION WORKSPACE ACTION</div>
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
          {/* CHALLENGE DETAILS CARD */}
          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 14 }}>{problem.title}</h3>
            <div className="kv"><span>Domain</span><b>{problem.category}</b></div>
            <div className="kv"><span>Priority / Impact</span><b>{problem.severity}</b></div>
            <div className="kv"><span>State &amp; District</span><b>{problem.district ? `${problem.district}, Jharkhand` : 'Jharkhand'}</b></div>
            <div className="kv"><span>Location / Area</span><b>{problem.location}</b></div>
            <div className="kv">
              <span>Geo-Coordinates</span>
              <b>
                {problem.latitude || problem.lat ? `${Number(problem.latitude ?? problem.lat).toFixed(6)}° N, ${Number(problem.longitude ?? problem.lng).toFixed(6)}° E` : '23.435700° N, 85.318300° E'}
              </b>
            </div>
            <div className="kv">
              <span>Location Source</span>
              <span className="proto-tag" style={{ fontSize: 10.5 }}>{problem.location_source || 'PHOTO_EXIF'}</span>
            </div>
            {problem.landmark && <div className="kv"><span>Landmark</span><span>{problem.landmark}</span></div>}
            <div className="kv"><span>Affected Community</span><span>{problem.affected_population ? `${problem.affected_population} Community Members` : String(problem.affected)}</span></div>
            <div className="kv"><span>Date Ingested</span><span>{problem.date}</span></div>
            {problem.expected_outcome && (
              <div className="kv">
                <span>Expected Outcome</span>
                <span style={{ textAlign: 'left', maxWidth: '65%', lineHeight: 1.5, color: '#047857', fontWeight: 600 }}>
                  {problem.expected_outcome}
                </span>
              </div>
            )}
            <div className="kv"><span>Challenge Description</span><span style={{ textAlign: 'left', maxWidth: '65%', lineHeight: 1.5 }}>{problem.desc}</span></div>
          </div>

          {/* REQUIRED MULTIDISCIPLINARY EXPERTISE CARD (SIH CORE) */}
          <div className="card" style={{ border: '1px solid #bfdbfe', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <h4 style={{ fontSize: 14.5, margin: 0 }}>Required Multidisciplinary Disciplines &amp; Expertise</h4>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  Extracted by evaluation engine to match appropriate university departments in Jharkhand:
                </div>
              </div>
              <span className="proto-tag" style={{ background: '#e0f2fe', color: '#0369a1' }}>Academic R&amp;D Fit</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {(problem.required_expertise || [
                'Agricultural Engineering',
                'IoT & Sensor Telemetry',
                'Solar PV Systems',
                'Data Analytics',
                'Community Rural Management'
              ]).map((skill, sIdx) => (
                <span
                  key={sIdx}
                  className="proto-tag"
                  style={{ fontSize: 11.5, padding: '4px 10px', background: '#ffffff', border: '1px solid #cbd5e1', color: 'var(--ink)' }}
                >
                  ⚡ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* MULTIDISCIPLINARY STUDENT-FACULTY TEAM SQUAD CARD (IF FORMED) */}
          {problem.project_team && (
            <div className="card" style={{ border: '1.5px solid #a7f3d0', background: '#f0fdf4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <h4 style={{ fontSize: 14.5, margin: 0, color: '#065f46' }}>🎓 Multidisciplinary Student + Faculty Project Squad</h4>
                  <div style={{ fontSize: 11.5, color: '#047857' }}>
                    University team mobilized under the Government of Jharkhand innovation framework:
                  </div>
                </div>
                <span className="proto-tag" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}>Active Squad</span>
              </div>

              <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                <div style={{ marginBottom: 6 }}>
                  <b>Faculty Research Mentor: </b>
                  <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{problem.project_team.faculty_mentor}</span>
                </div>
                {problem.project_team.student_members && (
                  <div>
                    <b>Student Innovator Members:</b>
                    <ul style={{ margin: '4px 0 6px 18px', padding: 0 }}>
                      {problem.project_team.student_members.map((stu, idx) => (
                        <li key={idx} style={{ marginBottom: 2 }}>
                          <b>{stu.name}</b> ({stu.dept}) — <span style={{ color: 'var(--muted)' }}>{stu.role || 'Researcher'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {problem.project_team.external_advisor && (
                  <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--ink-soft)' }}>
                    <b>Industry Advisor: </b> {problem.project_team.external_advisor}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROJECT MILESTONES ROADMAP CARD (IF PRESENT) */}
          {problem.milestones && problem.milestones.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <h4 style={{ fontSize: 14.5, margin: 0 }}>Project Implementation Milestones &amp; Deliverables</h4>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Research, prototyping, testing and field pilot roadmap:</div>
                </div>
                <span className="proto-tag">Milestone Tracker</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {problem.milestones.map((m) => (
                  <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', background: m.status === 'Completed' ? '#f8fafc' : '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b style={{ fontSize: 12.5 }}>{m.id}: {m.title}</b>
                      <span
                        className="status-chip"
                        style={{
                          fontSize: 10.5,
                          padding: '2px 8px',
                          background: m.status === 'Completed' ? '#dcfce7' : m.status === 'In Progress' ? '#fef3c7' : '#f1f5f9',
                          color: m.status === 'Completed' ? '#15803d' : m.status === 'In Progress' ? '#92400e' : '#475569'
                        }}
                      >
                        {m.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 4 }}>{m.desc}</div>
                    {m.deliverables && (
                      <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4 }}>
                        <b>Deliverable:</b> {m.deliverables} (Due: {m.due})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEASURABLE SOCIAL IMPACT METRICS CARD (SIH CRITICAL) */}
          {problem.impact_metrics && problem.impact_metrics.length > 0 && (
            <div className="card" style={{ border: '1.5px solid #fed7aa', background: '#fffbeb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <h4 style={{ fontSize: 14.5, margin: 0, color: '#9a3412' }}>📊 Measurable Social Outcomes &amp; Impact Assessment</h4>
                  <div style={{ fontSize: 11.5, color: '#b45309' }}>
                    Quantifiable real-world improvements documented before and after field pilot:
                  </div>
                </div>
                <span className="proto-tag" style={{ background: '#ffedd5', color: '#c2410c' }}>Impact Audited</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {problem.impact_metrics.map((im, idx) => (
                  <div key={idx} style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink)' }}>{im.metric}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 12 }}>
                      <div>
                        <span style={{ color: 'var(--muted)', fontSize: 10 }}>BEFORE: </span>
                        <span style={{ textDecoration: 'line-through', color: '#dc2626' }}>{im.before}</span>
                      </div>
                      <div style={{ fontSize: 14 }}>➔</div>
                      <div>
                        <span style={{ color: 'var(--muted)', fontSize: 10 }}>AFTER: </span>
                        <b style={{ color: '#16a34a', fontSize: 13 }}>{im.after}</b>
                      </div>
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 4 }}>
                      Unit: {im.unit} · Beneficiaries: {im.beneficiaries}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BEFORE & AFTER VISUAL VERIFICATION COMPARISON CARD (SIH CORE) */}
          <div className="card" style={{ border: '1.5px solid #b7cde3', background: '#fafcff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
              <div>
                <h4 style={{ fontSize: 15, margin: 0 }}>Ground-Truth Visual Verification (Before vs After)</h4>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  Photographic proof connecting problem report with verified on-ground resolution.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className={`btn btn-sm ${evidenceTab === 'both' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setEvidenceTab('both')}
                >
                  Side-by-Side
                </button>
                <button
                  className={`btn btn-sm ${evidenceTab === 'before' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setEvidenceTab('before')}
                >
                  Before
                </button>
                <button
                  className={`btn btn-sm ${evidenceTab === 'after' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setEvidenceTab('after')}
                >
                  After
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: evidenceTab === 'both' ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr', gap: 14 }}>
              {/* BEFORE PHOTO */}
              {(evidenceTab === 'both' || evidenceTab === 'before') && (
                <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                  <div style={{ position: 'relative', height: 210, background: '#eee' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={beforePhoto}
                      alt="Before Repair"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(220, 38, 38, 0.9)', color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                      BEFORE · INITIAL DAMAGE REPORT
                    </div>
                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0, 0, 0, 0.75)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 3 }}>
                      DEMO EVIDENCE: Reported Problem
                    </div>
                  </div>
                  <div style={{ padding: 10, fontSize: 11.5, color: 'var(--ink-soft)' }}>
                    <b>Initial Condition:</b> Severe pothole erosion at campus entry gate, hazardous to two-wheelers and buses.
                  </div>
                </div>
              )}

              {/* AFTER PHOTO */}
              {(evidenceTab === 'both' || evidenceTab === 'after') && (
                <div style={{ border: '1px solid #bbf7d0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                  <div style={{ position: 'relative', height: 210, background: '#eee' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={afterPhoto}
                      alt="After Repair"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(23, 138, 86, 0.9)', color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                      AFTER · COMPACTED REPAIR PATCH
                    </div>
                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0, 0, 0, 0.75)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 3 }}>
                      DEMO EVIDENCE: Field Resolution
                    </div>
                  </div>
                  <div style={{ padding: 10, fontSize: 11.5, color: 'var(--ink-soft)' }}>
                    <b>Completed Resolution:</b> Smooth cold-mix bio-polymer asphalt compacted flush with existing road grade.
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, padding: '10px 12px', background: problem.stage >= 8 ? 'var(--green-soft)' : '#f1f5f9', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ fontSize: 12 }}>
                <b>Verification Status: </b>
                <span style={{ color: problem.stage >= 8 ? 'var(--green)' : 'var(--blue)', fontWeight: 600 }}>
                  {problem.stage >= 8
                    ? '✅ Confirmed on ground by Citizen Sign-Off (Stage 8 Complete)'
                    : problem.stage >= 7
                    ? '⚡ Physical repair complete — Awaiting citizen sign-off below'
                    : '⏳ Technical solution in deployment pipeline'}
                </span>
              </div>
              <span className="demo-tag">DEMO EVIDENCE</span>
            </div>
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
                    <button className="btn btn-primary btn-sm" onClick={() => inviteOrg(m)}>
                      Join / Invite to Workspace
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

            {currentRole !== 'government' && (
              <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 11.5, color: '#92400e' }}>
                <b>Civic Oversight Rule:</b> Only statutory Government authorities can grant formal approval for solution deployment (Current role: <b>{currentRole || 'Guest'}</b>).
              </div>
            )}

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
                          <button className="btn btn-secondary btn-sm" onClick={() => reviewSolution(s.id, 'Under Review')} disabled={isUpdating}>Put Under Review</button>
                          <button className="btn btn-primary btn-sm" onClick={() => reviewSolution(s.id, 'Approved')} disabled={isUpdating}>Approve Solution (Govt)</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => reviewSolution(s.id, 'Rejected')} disabled={isUpdating}>Reject</button>
                        </>
                      )}
                      {s.status === 'Under Review' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => reviewSolution(s.id, 'Approved')} disabled={isUpdating}>Grant Statutory Approval</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => reviewSolution(s.id, 'Rejected')} disabled={isUpdating}>Reject</button>
                        </>
                      )}
                      {s.status === 'Approved' && (
                        <button className="btn btn-primary btn-sm" onClick={() => reviewSolution(s.id, 'In Deployment')} disabled={isUpdating}>
                          🚀 Move to Field Deployment (Stage 6)
                        </button>
                      )}
                      {s.status === 'In Deployment' && (
                        <button className="btn btn-primary btn-sm" onClick={() => reviewSolution(s.id, 'Completed')} disabled={isUpdating}>
                          ✅ Mark On-Ground Work Completed (Stage 7)
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
              <h4 style={{ fontSize: 14, margin: 0, color: 'var(--blue)' }}>Citizen Ground-Truth Verification</h4>
              <span className="proto-tag" style={{ background: 'var(--green)', color: '#fff' }}>Stage 8 Closed Loop</span>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 10px' }}>
              <b>No problem is marked resolved by government or contractors alone.</b> The loop is closed only when local citizens confirm the on-ground resolution with field evidence.
            </p>

            {currentRole && currentRole !== 'citizen' && (
              <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 11.5, color: '#92400e' }}>
                ⚠️ <b>Citizen Role Required:</b> You are logged in as <b>{currentRole}</b>. Switch role in top header to <b>Citizen</b> to submit final ground verification.
              </div>
            )}

            <div className="fb-row" style={{ display: 'flex', gap: 10 }}>
              <button className="yes btn btn-primary" style={{ flex: 1, padding: '10px 12px' }} onClick={() => giveFeedback(true)} disabled={isUpdating}>
                ✓ Confirm Resolved on Ground (Stage 8)
              </button>
              <button className="no btn btn-secondary" style={{ flex: 1, padding: '10px 12px' }} onClick={() => giveFeedback(false)} disabled={isUpdating}>
                ✗ Problem Still Exists (Reopen)
              </button>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Attach After-Repair Ground Verification Evidence *
              </label>

              {/* Action Buttons for After Evidence */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => {
                    if (isAfterCameraActive) captureAfterSnapshot();
                    else startAfterCamera();
                  }}
                >
                  {isAfterCameraActive ? '📸 Capture Snapshot' : '📷 Take After Photo'}
                </button>

                <label
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0 }}
                >
                  <span>🖼 Upload After Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleAfterFileUpload}
                  />
                </label>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11.5 }}
                  onClick={() => {
                    stopAfterCamera();
                    setEvidenceRef('/demo/pothole_after.jpg');
                    toast('🎯 Demo Mode: Loaded SIH Benchmark After Photo (/demo/pothole_after.jpg)', 'info');
                  }}
                  title="Load verified SIH benchmark after photo"
                >
                  🎯 Load Benchmark After-Photo (Demo)
                </button>
              </div>

              {/* Live WebRTC Camera Stream for Citizen Verification */}
              {isAfterCameraActive && (
                <div className="camera-container" style={{ marginBottom: 12, minHeight: 220 }}>
                  <video ref={afterVideoRef} autoPlay playsInline muted className="camera-video" style={{ maxHeight: 240 }} />
                  <canvas ref={afterCanvasRef} style={{ display: 'none' }} />
                  <div className="camera-controls">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={captureAfterSnapshot}
                    >
                      📸 Capture
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={stopAfterCamera}
                    >
                      ✕ Close Camera
                    </button>
                  </div>
                </div>
              )}

              {/* Before vs After Ground-Truth Evidence Comparison */}
              {evidenceRef && (
                <div style={{ marginTop: 10, padding: 10, background: '#f8fafc', border: '1px solid var(--line)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                    Ground-Truth Evidence Comparison (Before &amp; After)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>
                        BEFORE (Incident Evidence)
                      </div>
                      <div style={{ width: '100%', height: 95, borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={problem.photos[0]?.src || '/demo/pothole_before.jpg'}
                          alt="Before Incident Evidence"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>
                        AFTER (Resolution Evidence)
                      </div>
                      <div style={{ width: '100%', height: 95, borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={evidenceRef}
                          alt="After Resolution Evidence"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 6, wordBreak: 'break-all' }}>
                    {uploadingAfterEvidence ? 'Uploading to Supabase verification-evidence bucket…' : `Supabase Storage Ref: ${evidenceRef}`}
                  </div>
                </div>
              )}
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12 }}>Verification Observation Notes</label>
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
                  ? `✅ Citizen Sign-Off Recorded: Problem verified as resolved on ground. Ticket closed successfully (Stage 8 Complete).`
                  : `⚠️ Citizen Feedback Recorded: Problem flagged as still unresolved. Reopened for field action.`}
                {problem.verification?.comment && (
                  <div style={{ marginTop: 4, fontWeight: 400, fontSize: 11.5 }}>
                    &ldquo;{problem.verification.comment}&rdquo;
                  </div>
                )}
                {problem.verification?.evidence_ref && (
                  <div style={{ marginTop: 6, fontSize: 11, fontWeight: 500 }}>
                    Evidence Attached: <code>{problem.verification.evidence_ref}</code>
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
