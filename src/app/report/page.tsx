'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ReportRedirectPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace('/login?redirect=/report');
    } else {
      router.replace('/?report=1');
    }
  }, [loading, isAuthenticated, router]);

  return (
    <main style={shell}>
      <div style={card}>
        <div style={spinner} />
        <h2 style={{ fontSize: 18, color: '#0f4c81', margin: '14px 0 6px' }}>SahYog Societal Innovation Pipeline</h2>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          {loading ? 'Verifying secure session…' : isAuthenticated ? 'Opening Jharkhand challenge reporting workflow…' : 'Redirecting to secure sign-in…'}
        </p>
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
  maxWidth: 420,
  background: '#fff',
  border: '1px solid #dbe4ec',
  borderRadius: 16,
  padding: 32,
  textAlign: 'center',
  boxShadow: '0 16px 40px rgba(15,76,129,.08)',
};

const spinner: React.CSSProperties = {
  width: 32,
  height: 32,
  margin: '0 auto',
  border: '3px solid #e2e8f0',
  borderTopColor: '#0f4c81',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};
