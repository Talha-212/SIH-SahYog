'use client';
import { useState } from 'react';
import { useSahYog } from '@/store/useSahYog';
import type { Solution } from '@/lib/types';
import { toast } from '@/components/ToastStack';

export default function SolutionModal() {
  const { state, dispatch } = useSahYog();
  const { solutionOpen, currentRole } = state;

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tech, setTech] = useState('');
  const [cost, setCost] = useState('');
  const [time, setTime] = useState('');
  const [impact, setImpact] = useState('');
  const [resources, setResources] = useState('');
  const [plan, setPlan] = useState('');

  function submit() {
    if (!title) { toast('Please add a solution title.', 'error'); return; }
    const org = currentRole === 'university'
      ? "Lord's Institute Infrastructure Lab (You)"
      : currentRole === 'industry'
      ? 'Deccan InfraTech Partner (You)'
      : currentRole === 'ngo'
      ? 'Community Action Partner (You)'
      : 'Collaborative Problem Solver (You)';
    const sol: Omit<Solution, 'id'> = {
      title, org, status: 'Proposed',
      desc: desc || 'Engineered collaborative solution.',
      tech: tech || '—',
      cost: cost ? `₹${cost}` : '—',
      time: time || '—',
      impact: impact || '—',
    };
    dispatch({ type: 'SUBMIT_SOLUTION', sol });
    toast('Solution proposal submitted to collaboration workspace!', 'success');
    setTitle(''); setDesc(''); setTech(''); setCost(''); setTime(''); setImpact(''); setResources(''); setPlan('');
  }

  if (!solutionOpen) return null;
  return (
    <div className="overlay show" onClick={e => { if (e.target === e.currentTarget) dispatch({ type: 'CLOSE_SOLUTION_MODAL' }); }}>
      <div className="modal modal-wide">
        <div className="modal-head">
          <h3 style={{ fontSize: 17 }}>Propose a Solution</h3>
          <button className="modal-close" onClick={() => dispatch({ type: 'CLOSE_SOLUTION_MODAL' })}>✕</button>
        </div>
        <div className="field"><label>Solution title</label><input type="text" placeholder="e.g. Smart segregation bins with fill sensors" value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="field"><label>Solution description</label><textarea placeholder="Describe the approach..." value={desc} onChange={e => setDesc(e.target.value)} /></div>
        <div className="row-2">
          <div className="field"><label>Technology / method</label><input type="text" placeholder="e.g. IoT sensors + mobile app" value={tech} onChange={e => setTech(e.target.value)} /></div>
          <div className="field"><label>Estimated cost (₹)</label><input type="number" placeholder="e.g. 250000" value={cost} onChange={e => setCost(e.target.value)} /></div>
        </div>
        <div className="row-2">
          <div className="field"><label>Estimated time</label><input type="text" placeholder="e.g. 6 weeks" value={time} onChange={e => setTime(e.target.value)} /></div>
          <div className="field"><label>Expected impact</label><input type="text" placeholder="e.g. 250+ residents" value={impact} onChange={e => setImpact(e.target.value)} /></div>
        </div>
        <div className="field"><label>Resources required</label><input type="text" placeholder="e.g. 2 engineers, municipal access" value={resources} onChange={e => setResources(e.target.value)} /></div>
        <div className="field"><label>Implementation plan</label><textarea placeholder="High-level rollout steps..." value={plan} onChange={e => setPlan(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-block" onClick={() => dispatch({ type: 'CLOSE_SOLUTION_MODAL' })}>Save Draft</button>
          <button className="btn btn-primary btn-block" onClick={submit}>Submit Solution</button>
        </div>
      </div>
    </div>
  );
}
