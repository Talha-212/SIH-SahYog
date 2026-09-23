'use client';
import { useState } from 'react';
import { useSahYog } from '@/store/useSahYog';
import { toast } from '@/components/ToastStack';

export default function SolutionModal() {
  const { state, dispatch, submitSolution } = useSahYog();
  const { solutionOpen, currentRole, currentDetailId, problems } = state;

  const activeProblem = problems.find(p => p.id === currentDetailId);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tech, setTech] = useState('');
  const [cost, setCost] = useState('');
  const [time, setTime] = useState('');
  const [impact, setImpact] = useState('');
  const [mentor, setMentor] = useState('');
  const [studentTeam, setStudentTeam] = useState('');
  const [prototypePlan, setPrototypePlan] = useState('');
  const [pilotPlan, setPilotPlan] = useState('');
  const [supportNeeded, setSupportNeeded] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (!title.trim()) { toast('Please provide a solution proposal title.', 'error'); return; }
    if (!currentDetailId) { toast('No active societal challenge selected.', 'error'); return; }

    if (currentRole === 'citizen') {
      toast('Citizens crowdsource challenges and verify impact. Switch role to University or Industry to submit engineering proposals.', 'error');
      return;
    }

    const defaultOrg = currentRole === 'university'
      ? 'Birsa Agricultural University (BAU) / BIT Mesra Squad'
      : currentRole === 'industry'
      ? 'Tata Steel Foundation / Regional Industry Partner'
      : currentRole === 'government'
      ? 'Govt. of Jharkhand Departmental Research Cell'
      : 'Technical Solution Partner';

    const finalOrg = orgName.trim() || defaultOrg;

    setIsSubmitting(true);
    const res = await submitSolution({
      problem_id: currentDetailId,
      title: title.trim(),
      org_name: finalOrg,
      desc: desc || 'Engineered multidisciplinary collaborative solution.',
      tech: tech || 'Applied Technology & Prototyping',
      cost: cost ? `₹${cost}` : '₹50,000 (Research subsidized)',
      time: time || '6 weeks',
      impact: impact || (activeProblem?.expected_outcome || 'Community societal impact in Jharkhand'),
      problem_understanding: desc,
      proposed_approach: tech,
      faculty_mentor: mentor || undefined,
      student_team: studentTeam || undefined,
      prototype_plan: prototypePlan || undefined,
      testing_plan: 'Lab validation followed by controlled field stress testing.',
      pilot_plan: pilotPlan || undefined,
      social_impact: impact || undefined,
      support_needed: supportNeeded || undefined
    });
    setIsSubmitting(false);

    if (!res.success) {
      toast(res.error || 'Failed to submit solution proposal to backend.', 'error');
      return;
    }

    toast('🎉 Solution proposal successfully submitted to the Government of Jharkhand ecosystem!', 'success');
    setTitle(''); setDesc(''); setTech(''); setCost(''); setTime(''); setImpact(''); setMentor(''); setStudentTeam(''); setPrototypePlan(''); setPilotPlan(''); setSupportNeeded(''); setOrgName('');
  }

  if (!solutionOpen) return null;
  return (
    <div className="overlay show" onClick={e => { if (e.target === e.currentTarget) dispatch({ type: 'CLOSE_SOLUTION_MODAL' }); }}>
      <div className="modal modal-wide" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-head">
          <div>
            <h3 style={{ fontSize: 17, margin: 0 }}>Submit Solution Proposal &amp; R&amp;D Plan</h3>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
              Government of Jharkhand Societal Innovation Ecosystem (PS: SIH26043)
            </div>
          </div>
          <button className="modal-close" onClick={() => dispatch({ type: 'CLOSE_SOLUTION_MODAL' })}>✕</button>
        </div>

        {activeProblem && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Responding to Societal Challenge:</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{activeProblem.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
              Domain: {activeProblem.category} · District: {activeProblem.district || 'Ranchi'}, Jharkhand
            </div>
          </div>
        )}

        <div className="field">
          <label>Proposal Title *</label>
          <input
            type="text"
            placeholder="e.g. Decentralized Solar-Powered Micro-Lift Irrigation Skid with LoRaWAN Soil Telemetry"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className="row-2">
          <div className="field">
            <label>Institution / Organization Name</label>
            <input
              type="text"
              placeholder="e.g. Birsa Agricultural University / BIT Mesra"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Faculty Research Mentor &amp; Department</label>
            <input
              type="text"
              placeholder="e.g. Dr. R. Oraon, Dept. of Agricultural Engineering"
              value={mentor}
              onChange={e => setMentor(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Multidisciplinary Student Squad (Names &amp; Departments)</label>
          <input
            type="text"
            placeholder="e.g. Anjali (Agri Engg - Lead), Vikram (Electrical - Solar Telemetry), Pooja (CS - App)"
            value={studentTeam}
            onChange={e => setStudentTeam(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Problem Understanding &amp; Technical Approach *</label>
          <textarea
            rows={3}
            placeholder="Explain the root problem and the engineering solution formulated by the university squad..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        <div className="row-2">
          <div className="field">
            <label>Core Technology / Hardware / Software Stack</label>
            <input
              type="text"
              placeholder="e.g. Solar PV + BLDC Pump + LoRaWAN Telemetry Nodes + Mobile App"
              value={tech}
              onChange={e => setTech(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Estimated R&amp;D &amp; Material Cost (₹)</label>
            <input
              type="number"
              placeholder="e.g. 185000"
              value={cost}
              onChange={e => setCost(e.target.value)}
            />
          </div>
        </div>

        <div className="row-2">
          <div className="field">
            <label>Prototype &amp; Testing Timeline</label>
            <input
              type="text"
              placeholder="e.g. 4 weeks lab testing, 2 weeks field deployment"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Expected Measurable Community Impact</label>
            <input
              type="text"
              placeholder="e.g. 450 tribal farming families, 85 cultivated acres"
              value={impact}
              onChange={e => setImpact(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Prototype Validation &amp; Field Pilot Plan</label>
          <textarea
            rows={2}
            placeholder="Describe the prototype fabrication milestones and pilot deployment in Jharkhand community..."
            value={pilotPlan}
            onChange={e => setPilotPlan(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Industry Support / CSR Co-Funding Needed</label>
          <input
            type="text"
            placeholder="e.g. Seeking industry partner for equipment fabrication and CSR matching grant"
            value={supportNeeded}
            onChange={e => setSupportNeeded(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="btn btn-secondary btn-block" onClick={() => dispatch({ type: 'CLOSE_SOLUTION_MODAL' })}>
            Cancel
          </button>
          <button className="btn btn-primary btn-block" onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting Proposal...' : 'Submit to Govt. of Jharkhand Ecosystem'}
          </button>
        </div>
      </div>
    </div>
  );
}
