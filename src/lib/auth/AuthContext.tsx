'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Role } from '@/lib/types';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  role: Role;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: Role }>;
  signUp: (params: { email: string; password: string; fullName: string; role?: Role }) => Promise<{ success: boolean; error?: string; requireEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Derive role: prioritize profile.role, then user_metadata.role, defaulting to 'citizen' when authenticated
  const role: Role = useMemo(() => {
    if (!user) return null;
    if (profile?.role) return profile.role;
    const metaRole = user.user_metadata?.role as Role;
    if (metaRole && ['citizen', 'government', 'university', 'industry', 'ngo', 'admin'].includes(metaRole)) {
      return metaRole;
    }
    return 'citizen';
  }, [user, profile]);

  const isAuthenticated = Boolean(user);

  // Helper to fetch or create a profile record for an authenticated user
  const fetchOrCreateProfile = useCallback(async (authUser: User): Promise<UserProfile | null> => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return null;

    try {
      // 1. Try to fetch existing profile
      const { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (existing) {
        const up: UserProfile = {
          id: existing.id,
          email: existing.email || authUser.email || '',
          full_name: existing.full_name || authUser.user_metadata?.full_name || 'Citizen',
          role: existing.role as Role
        };
        setProfile(up);
        return up;
      }

      // 2. Profile missing -> auto-create profile row (citizen default)
      const userFullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Citizen';
      const userRole = (authUser.user_metadata?.role as Role) || 'citizen';
      const newProfileData = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: userFullName,
        role: userRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .upsert(newProfileData)
        .select('id, full_name, email, role')
        .maybeSingle();

      if (inserted) {
        const up: UserProfile = {
          id: inserted.id,
          email: inserted.email,
          full_name: inserted.full_name,
          role: inserted.role as Role
        };
        setProfile(up);
        return up;
      }

      // Fallback in memory even if upsert failed
      const memProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: userFullName,
        role: userRole
      };
      setProfile(memProfile);
      return memProfile;
    } catch {
      const fallback: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || 'Citizen',
        role: (authUser.user_metadata?.role as Role) || 'citizen'
      };
      setProfile(fallback);
      return fallback;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchOrCreateProfile(user);
    }
  }, [user, fetchOrCreateProfile]);

  // Synchronize with Supabase Auth state changes
  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Initial session load
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      if (!isMounted) return;
      setSession(initSession);
      setUser(initSession?.user ?? null);
      if (initSession?.user) {
        fetchOrCreateProfile(initSession.user).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    // Reactive Auth State listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchOrCreateProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchOrCreateProfile]);

  // Sign In with Supabase Auth
  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error || !data.user) {
        const msg = error?.message || 'Invalid email or password.';
        return { success: false, error: msg };
      }

      setSession(data.session);
      setUser(data.user);
      const prof = await fetchOrCreateProfile(data.user);
      return { success: true, role: prof?.role || 'citizen' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during sign-in.' };
    }
  }, [fetchOrCreateProfile]);

  // Sign Up with Supabase Auth
  const signUp = useCallback(async ({
    email,
    password,
    fullName,
    role: requestedRole
  }: {
    email: string;
    password: string;
    fullName: string;
    role?: Role;
  }) => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured.' };
    }

    // Public signups cannot self-assign admin
    const safeRole: Role = requestedRole === 'admin' ? 'citizen' : (requestedRole || 'citizen');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: safeRole
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        setSession(data.session);
        setUser(data.user);

        // Ensure profile record exists in profiles table
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          role: safeRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        const createdProfile: UserProfile = {
          id: data.user.id,
          email: email.trim(),
          full_name: fullName.trim(),
          role: safeRole
        };
        setProfile(createdProfile);

        const requireConfirm = !data.session && Boolean(data.user && !data.user.confirmed_at);
        return { success: true, requireEmailConfirmation: requireConfirm };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create account.' };
    }
  }, []);

  // Sign Out
  const signOut = useCallback(async () => {
    const supabase = getBrowserSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  // Forgot Password / Reset
  const resetPassword = useCallback(async (email: string) => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Password reset request failed.' };
    }
  }, []);

  const value: AuthContextValue = useMemo(() => ({
    user,
    session,
    loading,
    isAuthenticated,
    profile,
    role,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile
  }), [
    user,
    session,
    loading,
    isAuthenticated,
    profile,
    role,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
