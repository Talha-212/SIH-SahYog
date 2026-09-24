import type React from 'react';
import { Suspense } from 'react';
import SignupForm from './signup-form';

export default function SignupPage() {
  return (
    <main style={shell}>
      <div style={card}>
        <Suspense fallback={<div style={loading}>Loading account registration…</div>}>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  );
}

const shell: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  background: '#f5f8fb',
  fontFamily: 'inherit',
};

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 480,
  background: '#fff',
  border: '1px solid #dbe4ec',
  borderRadius: 16,
  padding: 30,
  boxShadow: '0 16px 40px rgba(15,76,129,.08)',
};

const loading: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  textAlign: 'center',
  padding: 24,
};
