'use client';
import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import type { Problem, Notification, Role, View, ExploreTab, Photo, Solution, OrgMatch, LocationSource } from '@/lib/types';
import { INITIAL_PROBLEMS, INITIAL_NOTIFICATIONS, DEMO_LOCATION } from '@/lib/constants';
import { classify, buildMatches } from '@/lib/classifier';

const STORE_KEY = 'sahyog_demo_v2';

// ---------- State ----------
interface State {
  problems: Problem[];
  problemCounter: number;
  notifications: Notification[];
  currentRole: Role;
  currentView: View;
  currentDetailId: string | null;
  detailFromView: View;
  exploreTab: ExploreTab;
  selectedSeverity: string | null;
  uploadedPhotos: Photo[];
  lightboxPhotos: Photo[];
  lightboxIndex: number;
  // workflow
  wfOpen: boolean;
  wfFiles: Photo[];
  wfCreatedId: string | null;
  wfLocationConfirmed: boolean;
  // modals
  loginOpen: boolean;
  solutionOpen: boolean;
  orgProfileOpen: boolean;
  orgProfileData: OrgMatch | null;
  // network & sync state
  isSubmitting: boolean;
  networkError: string | null;
}

const init = (): State => ({
  problems: INITIAL_PROBLEMS.map(p => {
    const ai = p.ai ?? classify(p.title, p.desc, p.category);
    const matches = p._matches ?? buildMatches(ai.category, p.location, p.lat, p.lng);
    return { ...p, ai, _matches: matches };
  }),
  problemCounter: 124,
  notifications: INITIAL_NOTIFICATIONS.map(n => ({ ...n })),
  currentRole: null,
  currentView: 'home',
  currentDetailId: null,
  detailFromView: 'explore',
  exploreTab: 'cards',
  selectedSeverity: null,
  uploadedPhotos: [],
  lightboxPhotos: [],
  lightboxIndex: 0,
  wfOpen: false,
  wfFiles: [],
  wfCreatedId: null,
  wfLocationConfirmed: false,
  loginOpen: false,
  solutionOpen: false,
  orgProfileOpen: false,
  orgProfileData: null,
  isSubmitting: false,
  networkError: null,
});

// ---------- Actions ----------
type Action =
  | { type: 'SET_VIEW'; view: View }
  | { type: 'SET_ROLE'; role: Role }
  | { type: 'LOGOUT' }
  | { type: 'ADD_NOTIFICATION'; text: string }
  | { type: 'MARK_NOTIFICATIONS_READ' }
  | { type: 'OPEN_DETAIL'; id: string; from: View }
  | { type: 'BACK_FROM_DETAIL' }
  | { type: 'SET_EXPLORE_TAB'; tab: ExploreTab }
  | { type: 'SET_SEVERITY'; sev: string }
  | { type: 'SET_UPLOADED_PHOTOS'; photos: Photo[] }
  | { type: 'OPEN_LIGHTBOX'; photos: Photo[]; index: number }
  | { type: 'CLOSE_LIGHTBOX' }
  | { type: 'LB_NAV'; dir: number }
  | { type: 'SET_PROBLEMS'; problems: Problem[] }
  | { type: 'ADD_PROBLEM'; problem: Problem }
  | { type: 'UPDATE_PROBLEM'; problem: Problem }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'TOGGLE_LOGIN' }
  | { type: 'OPEN_SOLUTION_MODAL' }
  | { type: 'CLOSE_SOLUTION_MODAL' }
  | { type: 'OPEN_ORG_PROFILE'; org: OrgMatch }
  | { type: 'CLOSE_ORG_PROFILE' }
  | { type: 'OPEN_WORKFLOW' }
  | { type: 'CLOSE_WORKFLOW' }
  | { type: 'SET_WF_FILES'; files: Photo[] }
  | { type: 'SET_WF_LOCATION_CONFIRMED'; confirmed: boolean }
  | { type: 'SET_WF_CREATED_ID'; id: string }
  | { type: 'RESTORE'; state: Partial<Pick<State, 'problems' | 'problemCounter' | 'notifications'>> }
  | { type: 'RESET' };

function now() {
  return new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
}

function addNotif(notifications: Notification[], text: string): Notification[] {
  return [{ text, unread: true, time: now() }, ...notifications];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.view };
    case 'SET_ROLE':
      return { ...state, currentRole: action.role };
    case 'LOGOUT':
      return { ...state, currentRole: null };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: addNotif(state.notifications, action.text) };
    case 'MARK_NOTIFICATIONS_READ': {
      fetch('/api/notifications', { method: 'PATCH' }).catch(() => {});
      return { ...state, notifications: state.notifications.map(n => ({ ...n, unread: false })) };
    }
    case 'OPEN_DETAIL': {
      const p = state.problems.find(x => x.id === action.id);
      if (!p) return { ...state, currentDetailId: action.id, detailFromView: action.from, currentView: 'detail' };
      const ai = p.ai ?? classify(p.title, p.desc, p.category);
      const matches = p._matches && p._matches.length > 0 ? p._matches : buildMatches(ai.category, p.location, p.lat, p.lng);
      const updated = state.problems.map(x => x.id === action.id ? { ...x, ai, _matches: matches } : x);
      return { ...state, problems: updated, currentDetailId: action.id, detailFromView: action.from, currentView: 'detail' };
    }
    case 'BACK_FROM_DETAIL':
      return { ...state, currentView: state.detailFromView === 'report' ? 'home' : state.detailFromView };
    case 'SET_EXPLORE_TAB':
      return { ...state, exploreTab: action.tab };
    case 'SET_SEVERITY':
      return { ...state, selectedSeverity: action.sev };
    case 'SET_UPLOADED_PHOTOS':
      return { ...state, uploadedPhotos: action.photos };
    case 'OPEN_LIGHTBOX':
      return { ...state, lightboxPhotos: action.photos, lightboxIndex: action.index };
    case 'CLOSE_LIGHTBOX':
      return { ...state, lightboxPhotos: [], lightboxIndex: 0 };
    case 'LB_NAV': {
      const photos = state.lightboxPhotos.filter(p => !p.isVideo);
      if (photos.length === 0) return state;
      const next = (state.lightboxIndex + action.dir + photos.length) % photos.length;
      return { ...state, lightboxIndex: next };
    }

    // Authoritative state updates
    case 'SET_PROBLEMS':
      return { ...state, problems: action.problems, problemCounter: action.problems.length + 100 };
    case 'ADD_PROBLEM': {
      const exists = state.problems.some(p => p.id === action.problem.id);
      const updatedProblems = exists
        ? state.problems.map(p => p.id === action.problem.id ? action.problem : p)
        : [action.problem, ...state.problems];
      return {
        ...state,
        problems: updatedProblems,
        problemCounter: state.problemCounter + 1,
        currentDetailId: action.problem.id,
        detailFromView: 'report',
        currentView: 'detail',
        uploadedPhotos: [],
        wfCreatedId: action.problem.id,
        notifications: addNotif(state.notifications, `Problem ${action.problem.id} registered and classified in backend database.`)
      };
    }
    case 'UPDATE_PROBLEM': {
      const updatedProblems = state.problems.map(p =>
        p.id === action.problem.id ? action.problem : p
      );
      return {
        ...state,
        problems: updatedProblems
      };
    }
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'SET_ERROR':
      return { ...state, networkError: action.error };

    case 'TOGGLE_LOGIN':
      return { ...state, loginOpen: !state.loginOpen };
    case 'OPEN_SOLUTION_MODAL':
      return { ...state, solutionOpen: true };
    case 'CLOSE_SOLUTION_MODAL':
      return { ...state, solutionOpen: false };
    case 'OPEN_ORG_PROFILE':
      return { ...state, orgProfileOpen: true, orgProfileData: action.org };
    case 'CLOSE_ORG_PROFILE':
      return { ...state, orgProfileOpen: false };
    case 'OPEN_WORKFLOW':
      return { ...state, wfOpen: true, wfFiles: [], wfCreatedId: null, wfLocationConfirmed: false };
    case 'CLOSE_WORKFLOW':
      return { ...state, wfOpen: false };
    case 'SET_WF_FILES':
      return { ...state, wfFiles: action.files };
    case 'SET_WF_LOCATION_CONFIRMED':
      return { ...state, wfLocationConfirmed: action.confirmed };
    case 'SET_WF_CREATED_ID':
      return { ...state, wfCreatedId: action.id };
    case 'RESTORE':
      return {
        ...state,
        problems: action.state.problems ?? state.problems,
        problemCounter: action.state.problemCounter ?? state.problemCounter,
        notifications: action.state.notifications ?? state.notifications,
      };
    case 'RESET': {
      return init();
    }
    default:
      return state;
  }
}

// ---------- Context ----------
interface SubmitProblemPayload {
  title: string;
  desc: string;
  category: string;
  location: string;
  severity?: string;
  affected?: string;
  landmark?: string;
  datetime?: string;
  contact?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_source?: LocationSource;
  location_accuracy?: string;
  photos?: Photo[];
}

interface SubmitSolutionPayload {
  problem_id: string;
  title: string;
  org_name: string;
  desc?: string;
  tech?: string;
  cost?: string;
  time?: string;
  impact?: string;
}

interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  showView: (view: View) => void;
  openDetail: (id: string, from: View) => void;
  // Authoritative Async Actions (Backend Source of Truth)
  submitProblem: (payload: SubmitProblemPayload) => Promise<{ success: boolean; data?: Problem; error?: string }>;
  submitSolution: (payload: SubmitSolutionPayload) => Promise<{ success: boolean; data?: Problem; error?: string }>;
  updateSolutionStatus: (problemId: string, solutionId: string, status: Solution['status']) => Promise<{ success: boolean; data?: Problem; error?: string }>;
  verifyProblem: (problemId: string, resolved: boolean, comment: string, evidence_ref?: string) => Promise<{ success: boolean; data?: Problem; error?: string }>;
  joinCollaboration: (problemId: string, org_name: string, org_type: 'Government' | 'University' | 'Industry' | 'NGO', role_in_problem?: string) => Promise<{ success: boolean; data?: Problem; error?: string }>;
  reloadProblems: () => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const SahYogContext = createContext<ContextValue | null>(null);

export function SahYogProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  // Authoritative Initial Sync: Fetch from Next.js API / Database first
  const reloadProblems = useCallback(async () => {
    try {
      const res = await fetch('/api/problems');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          dispatch({ type: 'SET_PROBLEMS', problems: json.data });
          return;
        }
      }
    } catch {
      // Offline fallback: read localStorage only if network/API is down
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) {
          const x = JSON.parse(raw);
          if (x?.problems?.length) {
            dispatch({ type: 'RESTORE', state: x });
          }
        }
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    reloadProblems();
  }, [reloadProblems]);

  // Sync to localStorage as client cache (secondary to backend)
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        problems: state.problems,
        problemCounter: state.problemCounter,
        notifications: state.notifications,
      }));
    } catch { /* ignore */ }
  }, [state.problems, state.problemCounter, state.notifications]);

  const showView = useCallback((view: View) => dispatch({ type: 'SET_VIEW', view }), []);
  const openDetail = useCallback((id: string, from: View) => dispatch({ type: 'OPEN_DETAIL', id, from }), []);

  // 1. Submit Problem (Citizen Action -> Backend DB Write -> Authoritative State Update)
  const submitProblem = useCallback(async (payload: SubmitProblemPayload) => {
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': state.currentRole || 'citizen'
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const errMsg = json.error || 'Failed to submit problem to backend database.';
        dispatch({ type: 'SET_ERROR', error: errMsg });
        dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        return { success: false, error: errMsg };
      }

      // Backend write confirmed: update frontend state with authoritative entity
      dispatch({ type: 'ADD_PROBLEM', problem: json.data });
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
      return { success: true, data: json.data };
    } catch (err: any) {
      const errMsg = err?.message || 'Network error while contacting SahYog API backend.';
      dispatch({ type: 'SET_ERROR', error: errMsg });
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
      return { success: false, error: errMsg };
    }
  }, [state.currentRole]);

  // 2. Submit Solution (University/Industry Action -> Backend DB Write -> Authoritative State Update)
  const submitSolution = useCallback(async (payload: SubmitSolutionPayload) => {
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const res = await fetch('/api/solutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': state.currentRole || 'university'
        },
        body: JSON.stringify({
          ...payload,
          actor_role: state.currentRole || 'university'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const errMsg = json.error || 'Failed to submit solution proposal.';
        dispatch({ type: 'SET_ERROR', error: errMsg });
        dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        return { success: false, error: errMsg };
      }

      dispatch({ type: 'UPDATE_PROBLEM', problem: json.data });
      dispatch({ type: 'CLOSE_SOLUTION_MODAL' });
      dispatch({ type: 'ADD_NOTIFICATION', text: `Solution proposal "${payload.title}" recorded in database.` });
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
      return { success: true, data: json.data };
    } catch (err: any) {
      const errMsg = err?.message || 'Network error while contacting SahYog API backend.';
      dispatch({ type: 'SET_ERROR', error: errMsg });
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
      return { success: false, error: errMsg };
    }
  }, [state.currentRole]);

  // 3. Update Solution Status (Government Role Security -> Backend Sync)
  const updateSolutionStatus = useCallback(async (
    problemId: string,
    solutionId: string,
    status: Solution['status']
  ) => {
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const res = await fetch(`/api/solutions/${solutionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': state.currentRole === 'government' ? 'Government' : state.currentRole === 'industry' ? 'Industry' : 'Government'
        },
        body: JSON.stringify({
          status,
          actor_role: state.currentRole === 'government' ? 'Government' : 'Government'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const errMsg = json.error || 'Failed to update solution status in backend.';
        dispatch({ type: 'SET_ERROR', error: errMsg });
        dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        return { success: false, error: errMsg };
      }

      dispatch({ type: 'UPDATE_PROBLEM', problem: json.data });
      dispatch({ type: 'ADD_NOTIFICATION', text: `Solution status transitioned to "${status}" in backend.` });
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
      return { success: true, data: json.data };
    } catch (err: any) {
      const errMsg = err?.message || 'Network error updating solution.';
      dispatch({ type: 'SET_ERROR', error: errMsg });
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
      return { success: false, error: errMsg };
    }
  }, [state.currentRole]);

  // 4. Citizen Verification (Ground-Truth Closed Loop -> Backend DB Write -> Authoritative State Update)
  const verifyProblem = useCallback(async (
    problemId: string,
    resolved: boolean,
    comment: string,
    evidence_ref?: string
  ) => {
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const res = await fetch('/api/verifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': state.currentRole || 'citizen'
        },
        body: JSON.stringify({
          problem_id: problemId,
          resolved,
          comment,
          evidence_ref: evidence_ref || '/demo/pothole_after.jpg',
          actor_role: state.currentRole || 'citizen'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const errMsg = json.error || 'Failed to record citizen ground-truth verification.';
        dispatch({ type: 'SET_ERROR', error: errMsg });
        dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        return { success: false, error: errMsg };
      }

      dispatch({ type: 'UPDATE_PROBLEM', problem: json.data });
      dispatch({
        type: 'ADD_NOTIFICATION',
        text: resolved
          ? `Problem ${problemId} confirmed resolved by citizen on ground (Stage 8 Complete).`
          : `Problem ${problemId} flagged unresolved by citizen and reopened.`
      });
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
      return { success: true, data: json.data };
    } catch (err: any) {
      const errMsg = err?.message || 'Network error recording verification.';
      dispatch({ type: 'SET_ERROR', error: errMsg });
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
      return { success: false, error: errMsg };
    }
  }, [state.currentRole]);

  // 5. Join Collaboration Workspace
  const joinCollaboration = useCallback(async (
    problemId: string,
    org_name: string,
    org_type: 'Government' | 'University' | 'Industry' | 'NGO',
    role_in_problem?: string
  ) => {
    try {
      const res = await fetch('/api/collaborations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_id: problemId, org_name, org_type, role_in_problem })
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        dispatch({ type: 'UPDATE_PROBLEM', problem: json.data });
        dispatch({ type: 'ADD_NOTIFICATION', text: `${org_name} joined problem collaboration workspace.` });
        return { success: true, data: json.data };
      }
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }, []);

  // 6. Reset Database (Seed)
  const resetDatabase = useCallback(async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
      await reloadProblems();
      dispatch({ type: 'RESET' });
    } catch (err) {
      console.error('Failed to reset DB:', err);
    }
  }, [reloadProblems]);

  return (
    <SahYogContext.Provider value={{
      state,
      dispatch,
      showView,
      openDetail,
      submitProblem,
      submitSolution,
      updateSolutionStatus,
      verifyProblem,
      joinCollaboration,
      reloadProblems,
      resetDatabase
    }}>
      {children}
    </SahYogContext.Provider>
  );
}

export function useSahYog() {
  const ctx = useContext(SahYogContext);
  if (!ctx) throw new Error('useSahYog must be used within SahYogProvider');
  return ctx;
}
