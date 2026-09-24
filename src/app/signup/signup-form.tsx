'use client';

import type React from 'react';
import { FormEvent, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { Role } from '@/lib/types';

export default function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTarget = params.get('redirect') || params.get('next') || '/';

  const { signUp, isAuthenticated, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<Role>('citizen');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (redirectTarget === '/report') {
        router.replace('/?report=1');
      } else {
        router.replace(redirectTarget);
      }
    }
  }, [authLoading, isAuthenticated, redirectTarget, router]);

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!fullName.trim()) {
      setError('Please provide your full legal name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter matching passwords.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase credentials are not configured. Please check environment variables.');
      return;
    }

    setSubmitting(true);

    // Public signup strictly disallows admin
    const chosenRole: Role = accountType === 'admin' ? 'citizen' : accountType;

    const res = await signUp({
      email,
      password,
      fullName,
      role: chosenRole
    });

    setSubmitting(false);

    if (!res.success) {
      const raw = res.error || '';
      if (raw.toLowerCase().includes('already registered') || raw.toLowerCase().includes('user already exists')) {
        setError('An account with this email address is already registered. Please sign in instead.');
      } else {
        setError(raw || 'Failed to create your account. Please try again.');
      }
      return;
    }

    if (res.requireEmailConfirmation) {
      setInfo('Account registered successfully! A confirmation link has been sent to your email. Please verify your email before signing in.');
    } else {
      // Instant session active
      if (redirectTarget === '/report') {
        router.replace('/?report=1');
      } else {
        router.replace(redirectTarget);
      }
    }
  }

  return (
    <>
      <div style={brand}>
        SAHYOG <span>GOVT. OF JHARKHAND · SIH 2026</span>
      </div>
      <h1 style={{ fontSize: 22, color: '#0f4c81', margin: '10px 0 4px', fontWeight: 800 }}>Create Account</h1>
      <p style={muted}>Register to report societal challenges and collaborate with HEIs &amp; industry partners.</p>

      {!isSupabaseConfigured() && (
        <div style={warn}>
          Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </div>
      )}

      {error && <div style={errorBox}>{error}</div>}
      {info && <div style={infoBox}>{info}</div>}

      <form onSubmit={handleSignUp} style={{ display: 'grid', gap: 13 }}>
        <label style={labelStyle}>
          Full Name
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dr. Ramesh Kumar / Priya Kumari"
            style={input}
            autoComplete="name"
          />
        </label>

        <label style={labelStyle}>
          Email Address
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@domain.edu / name@example.com"
            style={input}
            autoComplete="email"
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={labelStyle}>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={input}
              autoComplete="new-password"
            />
          </label>

          <label style={labelStyle}>
            Confirm Password
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={input}
              autoComplete="new-password"
            />
          </label>
        </div>

        <label style={labelStyle}>
          Account Type
          <select
            value={accountType || 'citizen'}
            onChange={(e) => setAccountType(e.target.value as Role)}
            style={{ ...input, cursor: 'pointer', background: '#fff' }}
          >
            <option value="citizen">Citizen Reporter (Default - Report &amp; Verify Challenges)</option>
            <option value="university">University / Higher Education Institution (HEI Partner)</option>
            <option value="industry">Industry / Startup / CSR Partner</option>
            <option value="ngo">Civil Society / NGO Partner</option>
            <option value="government">Government Department Official</option>
          </select>
          <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 }}>
            * Public signups cannot self-assign administrator privileges.
          </span>
        </label>

        <button disabled={submitting || authLoading} style={button} type="submit">
          {submitting ? 'Creating Account…' : 'Create Account'}
        </button>
      </form>

      <div style={divider} />

      <div style={{ textAlign: 'center', fontSize: 13 }}>
        Already have an account?{' '}
        <Link
          href={`/login${redirectTarget && redirectTarget !== '/' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`}
          style={{ color: '#0f4c81', fontWeight: 700, textDecoration: 'none' }}
        >
          Sign In
        </Link>
      </div>

      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <button
          type="button"
          style={secondary}
          onClick={() => router.push('/')}
        >
          ← Return to SahYog Portal
        </button>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#334155' };
const muted: React.CSSProperties = { color: '#64748b', fontSize: 12.5, lineHeight: 1.5, margin: '0 0 16px' };
const input: React.CSSProperties = { display: 'block', width: '100%', marginTop: 5, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13.5, boxSizing: 'border-box' };
const button: React.CSSProperties = { border: 0, borderRadius: 8, padding: '11px 14px', background: '#0f4c81', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, marginTop: 4 };
const secondary: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 14px', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#334155' };
const errorBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 10, borderRadius: 8, fontSize: 12.5, marginBottom: 14 };
const infoBox: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: 10, borderRadius: 8, fontSize: 12.5, marginBottom: 14 };
const warn: React.CSSProperties = { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: 10, borderRadius: 8, fontSize: 12.5, marginBottom: 14 };
const divider: React.CSSProperties = { height: 1, background: '#e2e8f0', margin: '18px 0' };
const brand: React.CSSProperties = { fontWeight: 900, color: '#0f4c81', fontSize: 14, letterSpacing: '.03em' };
