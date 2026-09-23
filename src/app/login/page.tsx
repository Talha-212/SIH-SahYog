'use client';

import type React from 'react';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = getBrowserSupabaseClient();
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError || !data.user) { setError(authError?.message || 'Invalid credentials.'); setLoading(false); return; }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (next === '/admin' && profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('This account does not have Government Control Center access.');
      setLoading(false);
      return;
    }
    router.replace(profile?.role === 'admin' ? '/admin' : next);
  }

  return (
    <main style={shell}>
      <div style={card}>
        <div style={brand}>SAHYOG <span>GOVT. OF JHARKHAND · SIH 2026</span></div>
        <h1>Secure Sign In</h1>
        <p style={muted}>Access the SahYog stakeholder platform.</p>
        {!isSupabaseConfigured() && <div style={warn}>Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.</div>}
        {error && <div style={errorBox}>{error}</div>}
        <form onSubmit={submit} style={{display:'grid',gap:14}}>
          <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={input}/></label>
          <label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={input}/></label>
          <button disabled={loading} style={button}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <div style={divider}/>
        <p style={muted}>Need an account? Use the existing SahYog Role Persona → Supabase Auth signup flow. Administrator accounts are created/promoted by the platform owner and cannot be self-created.</p>
        <button style={secondary} onClick={()=>router.push('/')}>Back to SahYog</button>
      </div>
    </main>
  );
}
const shell: React.CSSProperties={minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#f5f8fb',fontFamily:'inherit'};
const card: React.CSSProperties={width:'100%',maxWidth:440,background:'#fff',border:'1px solid #dbe4ec',borderRadius:16,padding:30,boxShadow:'0 16px 40px rgba(15,76,129,.08)'};
const brand: React.CSSProperties={fontWeight:900,color:'#0f4c81',fontSize:15,letterSpacing:'.03em'};
const muted: React.CSSProperties={color:'#64748b',fontSize:12,lineHeight:1.6};
const input: React.CSSProperties={display:'block',width:'100%',marginTop:6,padding:'11px 12px',border:'1px solid #cbd5e1',borderRadius:8,fontSize:14,boxSizing:'border-box'};
const button: React.CSSProperties={border:0,borderRadius:8,padding:'11px 14px',background:'#0f4c81',color:'#fff',fontWeight:800,cursor:'pointer'};
const secondary: React.CSSProperties={border:'1px solid #cbd5e1',borderRadius:8,padding:'10px 14px',background:'#fff',cursor:'pointer'};
const errorBox: React.CSSProperties={background:'#fef2f2',border:'1px solid #fecaca',color:'#b91c1c',padding:10,borderRadius:8,fontSize:12,margin:'12px 0'};
const warn: React.CSSProperties={background:'#fffbeb',border:'1px solid #fde68a',color:'#92400e',padding:10,borderRadius:8,fontSize:12,margin:'12px 0'};
const divider: React.CSSProperties={height:1,background:'#e2e8f0',margin:'20px 0'};
