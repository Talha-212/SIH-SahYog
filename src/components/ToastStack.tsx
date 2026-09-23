'use client';
import { useState, useCallback } from 'react';
import React from 'react';

interface Toast { id: number; msg: string; type: string; }

let globalToast: ((msg: string, type?: string) => void) | null = null;
export function toast(msg: string, type = '') { globalToast?.(msg, type); }

export default function ToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;

  const addToast = useCallback((msg: string, type = '') => {
    const id = Date.now() + counter++;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  // register globally
  globalToast = addToast;

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}
