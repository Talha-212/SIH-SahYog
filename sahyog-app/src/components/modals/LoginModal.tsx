'use client';
import { useSahYog } from '@/store/useSahYog';
import type { Role } from '@/lib/types';

export default function LoginModal() {
  const { state, dispatch } = useSahYog();

  function selectRole(role: Role) {
    if (!role) return;
    dispatch({ type: 'SET_ROLE', role });
    dispatch({ type: 'TOGGLE_LOGIN' });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Logged in as ${role.charAt(0).toUpperCase() + role.slice(1)} — Prototype Login.` });
    dispatch({ type: 'SET_VIEW', view: 'dashboard' });
  }

  if (!state.loginOpen) return null;
  return (
    <div className="overlay show" onClick={e => { if (e.target === e.currentTarget) dispatch({ type: 'TOGGLE_LOGIN' }); }}>
      <div className="modal">
        <div className="modal-head">
          <h3 style={{ fontSize: 17 }}>Prototype Login</h3>
          <button className="modal-close" onClick={() => dispatch({ type: 'TOGGLE_LOGIN' })}>✕</button>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>This is a mock sign-in for demo purposes. No real government authentication is used.</p>
        <div className="role-pick">
          {([['citizen', 'Report and track problems'], ['government', 'Verify, assign and manage problems'], ['university', 'Propose and build solutions'], ['industry', 'Offer technology and resources'], ['ngo', 'Support on-ground implementation']] as [Role, string][]).map(([role, desc]) => (
            <button key={role!} onClick={() => selectRole(role)}>
              {role!.charAt(0).toUpperCase() + role!.slice(1)}
              <small>{desc}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
