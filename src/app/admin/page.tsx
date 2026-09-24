'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

type AdminData = {
  admin: { full_name: string; email: string; role: string };
  summary: Record<string, number>;
  status: Record<string, number>;
  domain: Record<string, number>;
  district: Record<string, number>;
  problems: any[];
  organizations: any[];
  profiles: any[];
  solutions: any[];
};

const tabs = ['Overview', 'Challenges', 'Institutions', 'Industry & Partners', 'Users'] as const;
type Tab = typeof tabs[number];

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<Tab>('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured. Add the Supabase environment variables first.');
      setLoading(false);
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace('/login?redirect=/admin');
      return;
    }
    const res = await fetch('/api/admin', {
      headers: { Authorization: 'Bearer ' + sessionData.session.access_token }
    });
    const json = await res.json();
    if (res.status === 401) {
      router.replace('/login?redirect=/admin');
      return;
    }
    if (!res.ok || !json.success) {
      setError(json.error || 'Access Denied. You do not have administrator access.');
      setLoading(false);
      return;
    }
    setData(json.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateProblem(problemId: string, patch: { status?: string; severity?: string }) {
    const supabase = getBrowserSupabaseClient();
    const { data: sessionData } = await supabase!.auth.getSession();
    if (!sessionData.session) return router.replace('/login?redirect=/admin');
    setBusyId(problemId);
    const res = await fetch('/api/admin', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionData.session.access_token
      },
      body: JSON.stringify({ problem_id: problemId, ...patch })
    });
    const json = await res.json();
    setBusyId('');
    if (!res.ok || !json.success) {
      setError(json.error || 'Could not update the challenge.');
      return;
    }
    await load();
  }

  const filteredProblems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data?.problems || [];
    return (data?.problems || []).filter((p: any) =>
      [p.id, p.title, p.category, p.district, p.status, p.severity].some(v => String(v || '').toLowerCase().includes(q))
    );
  }, [data, query]);

  if (loading) return <main style={shell}><div style={loadingBox}>Loading Government Control Center…</div></main>;

  if (error) return (
    <main style={shell}>
      <div style={errorBox}>
        <strong>Government Control Center</strong>
        <p>{error}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={primary} onClick={load}>Try again</button>
          <button style={secondary} onClick={() => router.push('/')}>Back to SahYog</button>
        </div>
      </div>
    </main>
  );

  if (!data) return null;

  return (
    <main style={shell}>
      <header style={header}>
        <div>
          <div style={eyebrow}>GOVT. OF JHARKHAND · SAHYOG · SIH 2026</div>
          <h1 style={{ margin: '4px 0', fontSize: 28 }}>Government Control Center</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Central review, institutional routing and societal innovation monitoring.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={adminBadge}>{data.admin.full_name || 'Administrator'} · ADMIN</div>
          <button style={secondary} onClick={async () => { await getBrowserSupabaseClient()?.auth.signOut(); router.push('/'); }}>Sign out</button>
        </div>
      </header>

      <nav style={tabsBar}>
        {tabs.map(t => <button key={t} onClick={() => setTab(t)} style={tab === t ? activeTab : tabStyle}>{t}</button>)}
      </nav>

      {tab === 'Overview' && <Overview data={data} />}
      {tab === 'Challenges' && (
        <section>
          <div style={toolbar}><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search challenge, district, domain, status…" style={search}/><button style={secondary} onClick={load}>Refresh</button></div>
          <ChallengeTable problems={filteredProblems} busyId={busyId} onUpdate={updateProblem}/>
        </section>
      )}
      {tab === 'Institutions' && <OrgTable organizations={data.organizations.filter((o: any) => String(o.type).toLowerCase() === 'university')} title="Higher Education Institutions" />}
      {tab === 'Industry & Partners' && <OrgTable organizations={data.organizations.filter((o: any) => ['industry','startup','msme','csr'].includes(String(o.type).toLowerCase()))} title="Industry, Startup, MSME & CSR Partners" />}
      {tab === 'Users' && <UsersTable profiles={data.profiles}/>}
    </main>
  );
}

function Overview({ data }: { data: AdminData }) {
  const cards = [
    ['Total Challenges', data.summary.totalChallenges],
    ['Pending Review', data.summary.pendingReview],
    ['Active Projects', data.summary.activeProjects],
    ['Resolved', data.summary.resolved],
    ['Universities', data.summary.universities],
    ['Industry Partners', data.summary.industryPartners],
    ['Solution Proposals', data.summary.solutions]
  ];
  return <section>
    <div style={cardGrid}>{cards.map(([label, value]) => <div key={String(label)} style={metricCard}><span style={{ color: '#64748b', fontSize: 12 }}>{label}</span><strong style={{ fontSize: 27, marginTop: 6 }}>{value}</strong></div>)}</div>
    <div style={twoCol}>
      <Distribution title="Challenge Status" data={data.status}/>
      <Distribution title="Domain Distribution" data={data.domain}/>
    </div>
    <Distribution title="District Distribution" data={data.district}/>
  </section>;
}

function Distribution({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a,b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(x => x[1]));
  return <div style={panel}><h2 style={panelTitle}>{title}</h2>{entries.length === 0 ? <p style={muted}>No data yet.</p> : entries.slice(0, 12).map(([key, value]) =>
    <div key={key} style={{ marginBottom: 12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12 }}><span>{key}</span><strong>{value}</strong></div>
      <div style={barTrack}><div style={{ ...bar, width: (value / max * 100) + '%' }}/></div>
    </div>
  )}</div>;
}

function ChallengeTable({ problems, busyId, onUpdate }: { problems: any[]; busyId: string; onUpdate: (id: string, p: any) => void }) {
  return <div style={panel}><h2 style={panelTitle}>Challenge Review Queue <span style={{ fontSize: 12, fontWeight: 500, color:'#64748b' }}>({problems.length})</span></h2>
    <div style={{ overflowX:'auto' }}><table style={table}><thead><tr><th>ID</th><th>Challenge</th><th>Domain</th><th>Location</th><th>Status</th><th>Severity</th><th>Action</th></tr></thead>
      <tbody>{problems.map(p => <tr key={p.id}>
        <td style={mono}>{p.id}</td><td><strong>{p.title}</strong><div style={muted}>{new Date(p.created_at).toLocaleDateString('en-IN')}</div></td>
        <td>{p.category || 'Unclassified'}</td><td>{[p.district,p.state].filter(Boolean).join(', ') || 'Location pending'}</td>
        <td><select value={p.status || 'reported'} disabled={busyId===p.id} onChange={e => onUpdate(p.id,{status:e.target.value})} style={select}>{['reported','verified','matched','collaborating','solution_proposed','approved','deployed','resolved','citizen_verified','rejected'].map(s=><option key={s}>{s}</option>)}</select></td>
        <td><select value={p.severity || 'moderate'} disabled={busyId===p.id} onChange={e => onUpdate(p.id,{severity:e.target.value})} style={select}>{['low','moderate','high','critical'].map(s=><option key={s}>{s}</option>)}</select></td>
        <td><button style={smallButton} disabled={busyId===p.id} onClick={() => onUpdate(p.id,{status:'verified'})}>{busyId===p.id?'Saving…':'Validate'}</button></td>
      </tr>)}</tbody></table></div>
  </div>;
}

function OrgTable({ organizations, title }: { organizations: any[]; title: string }) {
  return <div style={panel}><h2 style={panelTitle}>{title} <span style={{fontSize:12,color:'#64748b'}}>({organizations.length})</span></h2><div style={{overflowX:'auto'}}><table style={table}><thead><tr><th>Name</th><th>Type</th><th>Expertise</th><th>Jurisdiction</th><th>Capacity</th></tr></thead><tbody>{organizations.map(o=><tr key={o.id}><td><strong>{o.name}</strong></td><td>{o.type}</td><td>{o.expertise || o.capabilities || '—'}</td><td>{o.jurisdiction || '—'}</td><td>{o.capacity ?? '—'}</td></tr>)}</tbody></table></div></div>;
}

function UsersTable({ profiles }: { profiles: any[] }) {
  return <div style={panel}><h2 style={panelTitle}>Registered Stakeholders <span style={{fontSize:12,color:'#64748b'}}>({profiles.length})</span></h2><div style={{overflowX:'auto'}}><table style={table}><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Organization</th><th>Joined</th></tr></thead><tbody>{profiles.map(p=><tr key={p.id}><td>{p.full_name || '—'}</td><td>{p.email}</td><td><span style={roleBadge}>{p.role}</span></td><td>{p.organization_id || '—'}</td><td>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</td></tr>)}</tbody></table></div></div>;
}

const shell: React.CSSProperties = { minHeight:'100vh', background:'#f6f9fc', color:'#0f172a', padding:'32px 5vw', fontFamily:'inherit' };
const header: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', gap:20, marginBottom:24, flexWrap:'wrap' };
const eyebrow: React.CSSProperties = { fontSize:11, fontWeight:800, letterSpacing:'.08em', color:'#0f4c81' };
const tabsBar: React.CSSProperties = { display:'flex', gap:4, overflowX:'auto', background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:5, marginBottom:20 };
const tabStyle: React.CSSProperties = { border:0, background:'transparent', padding:'10px 14px', borderRadius:8, color:'#64748b', cursor:'pointer', whiteSpace:'nowrap' };
const activeTab: React.CSSProperties = { ...tabStyle, background:'#0f4c81', color:'#fff', fontWeight:700 };
const cardGrid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:16 };
const metricCard: React.CSSProperties = { background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:18, display:'flex', flexDirection:'column' };
const twoCol: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16, marginBottom:16 };
const panel: React.CSSProperties = { background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:18, marginBottom:16 };
const panelTitle: React.CSSProperties = { fontSize:16, margin:'0 0 16px' };
const muted: React.CSSProperties = { color:'#64748b', fontSize:11, marginTop:4 };
const barTrack: React.CSSProperties = { height:7, background:'#e2e8f0', borderRadius:99, marginTop:6, overflow:'hidden' };
const bar: React.CSSProperties = { height:'100%', background:'#0f4c81', borderRadius:99 };
const table: React.CSSProperties = { width:'100%', borderCollapse:'collapse', fontSize:12 };
const mono: React.CSSProperties = { fontFamily:'monospace', fontSize:11 };
const select: React.CSSProperties = { border:'1px solid #cbd5e1', borderRadius:7, padding:'6px 8px', background:'#fff', fontSize:11 };
const toolbar: React.CSSProperties = { display:'flex', gap:10, marginBottom:14 };
const search: React.CSSProperties = { flex:1, border:'1px solid #cbd5e1', borderRadius:9, padding:'10px 12px', fontSize:13 };
const primary: React.CSSProperties = { border:0, background:'#0f4c81', color:'#fff', borderRadius:8, padding:'10px 15px', cursor:'pointer', fontWeight:700 };
const secondary: React.CSSProperties = { border:'1px solid #cbd5e1', background:'#fff', color:'#0f172a', borderRadius:8, padding:'10px 15px', cursor:'pointer' };
const smallButton: React.CSSProperties = { border:0, background:'#e8f1f8', color:'#0f4c81', borderRadius:7, padding:'6px 9px', cursor:'pointer', fontWeight:700, fontSize:11 };
const adminBadge: React.CSSProperties = { background:'#e8f1f8', color:'#0f4c81', borderRadius:999, padding:'8px 12px', fontSize:11, fontWeight:800 };
const roleBadge: React.CSSProperties = { background:'#eef2ff', color:'#3730a3', padding:'4px 8px', borderRadius:999, fontSize:10, fontWeight:700 };
const loadingBox: React.CSSProperties = { maxWidth:600, margin:'15vh auto', background:'#fff', padding:30, borderRadius:14, textAlign:'center' };
const errorBox: React.CSSProperties = { maxWidth:650, margin:'12vh auto', background:'#fff', padding:30, borderRadius:14, border:'1px solid #fecaca' };
