'use client';
import { useState } from 'react';
import { useSahYog } from '@/store/useSahYog';
import type { Role } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginModal() {
  const { state, dispatch, signInWithSupabase, signUpWithSupabase } = useSahYog();
  const [tab, setTab] = useState<'quick' | 'auth'>('quick');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('citizen');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const supabaseReady = isSupabaseConfigured();

  function selectRole(role: Role) {
    if (!role) return;
    dispatch({ type: 'SET_ROLE', role });
    dispatch({ type: 'TOGGLE_LOGIN' });
    dispatch({
      type: 'ADD_NOTIFICATION',
      text: `Active role switched to ${role.charAt(0).toUpperCase() + role.slice(1)}.`
    });
    dispatch({ type: 'SET_VIEW', view: 'dashboard' });
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    if (isSignUp) {
      if (!fullName.trim()) {
        setAuthError('Please enter your full name');
        setLoading(false);
        return;
      }
      const res = await signUpWithSupabase(email, password, fullName, selectedRole);
      setLoading(false);
      if (!res.success) {
        setAuthError(res.error || 'Failed to create account.');
        return;
      }
      dispatch({ type: 'TOGGLE_LOGIN' });
      dispatch({ type: 'SET_VIEW', view: 'dashboard' });
    } else {
      const res = await signInWithSupabase(email, password);
      setLoading(false);
      if (!res.success) {
        setAuthError(res.error || 'Invalid credentials or user not found.');
        return;
      }
      dispatch({ type: 'TOGGLE_LOGIN' });
      dispatch({ type: 'SET_VIEW', view: 'dashboard' });
    }
  }

  if (!state.loginOpen) return null;

  return (
    <div
      className="overlay show"
      onClick={e => {
        if (e.target === e.currentTarget) dispatch({ type: 'TOGGLE_LOGIN' });
      }}
    >
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 17, margin: 0 }}>SahYog Authentication</h3>
            <span
              style={{
                fontSize: 10.5,
                padding: '2px 8px',
                borderRadius: 12,
                fontWeight: 600,
                background: supabaseReady ? '#dcfce7' : '#f1f5f9',
                color: supabaseReady ? '#166534' : '#64748b'
              }}
            >
              {supabaseReady ? '● Supabase Connected' : '○ Prototype Mode'}
            </span>
          </div>
          <button className="modal-close" onClick={() => dispatch({ type: 'TOGGLE_LOGIN' })}>
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setTab('quick')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 12.5,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: tab === 'quick' ? '2px solid var(--blue)' : '2px solid transparent',
              color: tab === 'quick' ? 'var(--blue)' : 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            Role Switcher (Judging)
          </button>
          <button
            type="button"
            onClick={() => setTab('auth')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 12.5,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: tab === 'auth' ? '2px solid var(--blue)' : '2px solid transparent',
              color: tab === 'auth' ? 'var(--blue)' : 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            Supabase Auth
          </button>
        </div>

        {tab === 'quick' ? (
          <div>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
              Select any stakeholder role for live presentation and testing across the 9-stage lifecycle:
            </p>
            <div className="role-pick">
              {(
                [
                  ['citizen', 'Report problems and provide ground-truth verification sign-off'],
                  ['government', 'Statutory oversight, problem assignment, and solution approval'],
                  ['university', 'Propose R&D prototypes and innovative solutions'],
                  ['industry', 'Offer commercial engineering, technology, and execution resources'],
                  ['ngo', 'Ground community liaison and public grievance verification']
                ] as [Role, string][]
              ).map(([role, desc]) => (
                <button key={role!} onClick={() => selectRole(role)}>
                  {role!.charAt(0).toUpperCase() + role!.slice(1)}
                  <small>{desc}</small>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              {isSignUp
                ? 'Create a persistent Supabase Auth account and stakeholder profile:'
                : 'Sign in with your Supabase Auth credentials (auth.users -> profiles):'}
            </p>

            {authError && (
              <div
                style={{
                  padding: '8px 12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  borderRadius: 6,
                  fontSize: 12,
                  marginBottom: 12
                }}
              >
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isSignUp && (
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--line)',
                      fontSize: 13
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--line)',
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--line)',
                    fontSize: 13
                  }}
                />
              </div>

              {isSignUp && (
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Stakeholder Role
                  </label>
                  <select
                    value={selectedRole || 'citizen'}
                    onChange={e => setSelectedRole(e.target.value as Role)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--line)',
                      fontSize: 13,
                      background: '#fff'
                    }}
                  >
                    <option value="citizen">Citizen (Reporter & Verification)</option>
                    <option value="government">Government (Statutory Authority)</option>
                    <option value="university">University (R&D Solver)</option>
                    <option value="industry">Industry (Execution Partner)</option>
                    <option value="ngo">NGO (Community Liaison)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Authenticating...' : isSignUp ? 'Create Supabase Profile' : 'Sign In'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setAuthError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--blue)',
                    fontSize: 12,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
