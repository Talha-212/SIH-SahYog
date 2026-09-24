'use client';

import type React from 'react';
import { FormEvent, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTarget = params.get('redirect') || params.get('next') || '/';

  const { signIn, resetPassword, isAuthenticated, role, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (redirectTarget === '/report') {
        router.replace('/?report=1');
      } else if (redirectTarget === '/admin' && role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace(redirectTarget);
      }
    }
  }, [authLoading, isAuthenticated, redirectTarget, role, router]);

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);

    if (!isSupabaseConfigured()) {
      setError('Supabase credentials are not configured. Please check environment variables.');
      setSubmitting(false);
      return;
    }

    const res = await signIn(email, password);
    setSubmitting(false);

    if (!res.success) {
      // Map user-friendly error messages
      const raw = res.error || '';
      if (raw.toLowerCase().includes('invalid login credentials') || raw.toLowerCase().includes('invalid credentials')) {
        setError('Incorrect email or password. Please verify your credentials and try again.');
      } else if (raw.toLowerCase().includes('email not confirmed')) {
        setError('Your email has not been confirmed. Please check your inbox for the confirmation link.');
      } else {
        setError(raw || 'Failed to sign in. Please verify your internet connection and try again.');
      }
      return;
    }

    // Role-specific check if trying to access admin
    if (redirectTarget === '/admin' && res.role !== 'admin') {
      setError('This account does not have Government Control Center administrative privileges.');
      return;
    }

    // Redirect user to their intended destination
    if (redirectTarget === '/report') {
      router.replace('/?report=1');
    } else {
      router.replace(redirectTarget);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Please provide your account email to receive a password reset link.');
      return;
    }

    setError('');
    setInfo('');
    setResetSubmitting(true);

    const res = await resetPassword(forgotEmail);
    setResetSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Unable to send password reset email. Please try again.');
    } else {
      setInfo('Password reset email dispatched. Please check your inbox for the reset link.');
      setShowForgot(false);
    }
  }

  return (
    <>
      <div style={brand}>
        SAHYOG <span>GOVT. OF JHARKHAND · SIH 2026</span>
      </div>
      <h1 style={{ fontSize: 22, color: '#0f4c81', margin: '10px 0 4px', fontWeight: 800 }}>Secure Sign In</h1>
      <p style={muted}>Access the SahYog societal innovation &amp; challenge collaboration portal.</p>

      {!isSupabaseConfigured() && (
        <div style={warn}>
          Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </div>
      )}

      {error && <div style={errorBox}>{error}</div>}
      {info && <div style={infoBox}>{info}</div>}

      {!showForgot ? (
        <form onSubmit={handleSignIn} style={{ display: 'grid', gap: 14 }}>
          <label style={labelStyle}>
            Email Address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.edu / you@example.com"
              style={input}
              autoComplete="email"
            />
          </label>

          <label style={labelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Password</span>
              <button
                type="button"
                onClick={() => { setShowForgot(true); setForgotEmail(email); setError(''); setInfo(''); }}
                style={linkButton}
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={input}
              autoComplete="current-password"
            />
          </label>

          <button disabled={submitting || authLoading} style={button} type="submit">
            {submitting ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: 14 }}>
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, color: '#334155' }}>
            Enter your registered email address and we will send you a password reset link.
          </div>

          <label style={labelStyle}>
            Registered Email Address
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@example.com"
              style={input}
            />
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button disabled={resetSubmitting} style={button} type="submit">
              {resetSubmitting ? 'Sending…' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              style={secondary}
              onClick={() => { setShowForgot(false); setError(''); }}
            >
              Back to Login
            </button>
          </div>
        </form>
      )}

      <div style={divider} />

      <div style={{ textAlign: 'center', fontSize: 13 }}>
        Don&apos;t have an account?{' '}
        <Link
          href={`/signup${redirectTarget && redirectTarget !== '/' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`}
          style={{ color: '#0f4c81', fontWeight: 700, textDecoration: 'none' }}
        >
          Create Account
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
const input: React.CSSProperties = { display: 'block', width: '100%', marginTop: 6, padding: '11px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };
const button: React.CSSProperties = { border: 0, borderRadius: 8, padding: '11px 14px', background: '#0f4c81', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 };
const secondary: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 14px', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#334155' };
const linkButton: React.CSSProperties = { background: 'none', border: 0, color: '#0f4c81', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline', padding: 0 };
const errorBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 10, borderRadius: 8, fontSize: 12.5, marginBottom: 14 };
const infoBox: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: 10, borderRadius: 8, fontSize: 12.5, marginBottom: 14 };
const warn: React.CSSProperties = { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: 10, borderRadius: 8, fontSize: 12.5, marginBottom: 14 };
const divider: React.CSSProperties = { height: 1, background: '#e2e8f0', margin: '20px 0' };
const brand: React.CSSProperties = { fontWeight: 900, color: '#0f4c81', fontSize: 14, letterSpacing: '.03em' };