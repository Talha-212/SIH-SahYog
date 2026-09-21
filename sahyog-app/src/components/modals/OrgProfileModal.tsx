'use client';
import { useSahYog } from '@/store/useSahYog';

export default function OrgProfileModal() {
  const { state, dispatch } = useSahYog();
  const { orgProfileOpen, orgProfileData } = state;

  if (!orgProfileOpen || !orgProfileData) return null;
  const org = orgProfileData;

  return (
    <div className="overlay show" onClick={e => { if (e.target === e.currentTarget) dispatch({ type: 'CLOSE_ORG_PROFILE' }); }}>
      <div className="modal">
        <div className="modal-head">
          <h3 style={{ fontSize: 17 }}>{org.name}</h3>
          <button className="modal-close" onClick={() => dispatch({ type: 'CLOSE_ORG_PROFILE' })}>✕</button>
        </div>
        <div className="kv"><span>Type</span><span>{org.type}</span></div>
        <div className="kv"><span>Location</span><span>{org.location}</span></div>
        <div className="kv"><span>Expertise</span><span style={{ textAlign: 'right' }}>{org.expertise}</span></div>
        <div className="kv"><span>Available resources</span><span style={{ textAlign: 'right' }}>{org.resources}</span></div>
        <div className="kv"><span>Projects</span><span>{org.projects}</span></div>
        <div className="kv"><span>Verification</span><span className="verified-badge">Verified · Prototype</span></div>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 10 }}>Organization verification system is a prototype demonstration and does not reflect a real verified entity.</p>
      </div>
    </div>
  );
}
