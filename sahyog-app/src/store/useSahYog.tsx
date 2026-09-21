'use client';
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { Problem, Notification, Role, View, ExploreTab, Photo, Solution, OrgMatch, LocationSource } from '@/lib/types';
import { INITIAL_PROBLEMS, INITIAL_NOTIFICATIONS, DEMO_LOCATION } from '@/lib/constants';
import { classify, buildMatches, makeId } from '@/lib/classifier';

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
  | { type: 'SUBMIT_PROBLEM'; title: string; desc: string; category: string; location: string; affected: string; latitude?: number | null; longitude?: number | null; location_source?: LocationSource }
  | { type: 'REVIEW_SOLUTION'; problemId: string; solId: string; status: Solution['status'] }
  | { type: 'SUBMIT_SOLUTION'; sol: Omit<Solution,'id'> }
  | { type: 'GIVE_FEEDBACK'; resolved: boolean; comment: string }
  | { type: 'GOV_ACTION'; action: 'assign' | 'verify' }
  | { type: 'INVITE_ORG'; name: string }
  | { type: 'SET_PROBLEM_STAGE'; id: string; stage: number }
  | { type: 'TOGGLE_LOGIN' }
  | { type: 'OPEN_SOLUTION_MODAL' }
  | { type: 'CLOSE_SOLUTION_MODAL' }
  | { type: 'OPEN_ORG_PROFILE'; org: OrgMatch }
  | { type: 'CLOSE_ORG_PROFILE' }
  | { type: 'OPEN_WORKFLOW' }
  | { type: 'CLOSE_WORKFLOW' }
  | { type: 'SET_WF_FILES'; files: Photo[] }
  | { type: 'SET_WF_LOCATION_CONFIRMED'; confirmed: boolean }
  | { type: 'CREATE_FROM_WORKFLOW'; data: Omit<Problem,'id'|'solutions'|'verification'|'_matches'> }
  | { type: 'RESTORE'; state: Partial<Pick<State,'problems'|'problemCounter'|'notifications'>> }
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
      if (!p) return state;
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
      const next = (state.lightboxIndex + action.dir + photos.length) % photos.length;
      return { ...state, lightboxIndex: next };
    }
    case 'SUBMIT_PROBLEM': {
      const counter = state.problemCounter + 1;
      const result = classify(action.title, action.desc, action.category);
      const latVal = action.latitude ?? DEMO_LOCATION.lat;
      const lngVal = action.longitude ?? DEMO_LOCATION.lng;
      const newP: Problem = {
        id: makeId(counter),
        title: action.title,
        desc: action.desc,
        category: result.category,
        location: action.location,
        affected: action.affected || '—',
        severity: state.selectedSeverity ?? 'Medium',
        stage: 1,
        date: 'Today',
        mapX: 20 + Math.random() * 60,
        mapY: 20 + Math.random() * 60,
        lat: latVal,
        lng: lngVal,
        latitude: latVal,
        longitude: lngVal,
        address: action.location,
        location_source: action.location_source || 'MANUAL_ENTRY',
        location_accuracy: '~15m',
        location_confirmed: true,
        location_updated_at: new Date().toISOString(),
        photos: state.uploadedPhotos.slice(),
        solutions: [],
        verification: null,
        ai: result
      };
      const notifs = addNotif(state.notifications, `Problem ${newP.id} submitted and rule-classified under ${result.category}.`);
      const matches = buildMatches(result.category, action.location, latVal, lngVal);

      // Async backend persistence
      fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newP.title,
          desc: newP.desc,
          category: newP.category,
          location: newP.location,
          severity: newP.severity,
          affected: newP.affected,
          latitude: newP.latitude,
          longitude: newP.longitude,
          location_source: newP.location_source,
          photos: newP.photos
        })
      }).catch(() => {});

      return {
        ...state,
        problemCounter: counter,
        problems: [{ ...newP, _matches: matches }, ...state.problems],
        notifications: notifs,
        currentDetailId: newP.id,
        detailFromView: 'report',
        currentView: 'detail'
      };
    }
    case 'REVIEW_SOLUTION': {
      const problems = state.problems.map(p => {
        if (p.id !== action.problemId) return p;
        const solutions = p.solutions.map(s => s.id === action.solId ? { ...s, status: action.status } : s);
        let stage = p.stage;
        if (action.status === 'Approved') stage = Math.max(stage, 4);
        if (action.status === 'In Deployment') stage = Math.max(stage, 5);
        if (action.status === 'Completed') stage = Math.max(stage, 6);
        return { ...p, solutions, stage };
      });
      const sol = state.problems.find(x => x.id === action.problemId)?.solutions.find(s => s.id === action.solId);
      const notifs = addNotif(state.notifications, `Solution "${sol?.title}" for ${action.problemId} is now: ${action.status}.`);

      // Async backend update
      fetch(`/api/solutions/${action.solId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action.status, actor_role: 'Government' })
      }).catch(() => {});

      return { ...state, problems, notifications: notifs };
    }
    case 'SUBMIT_SOLUTION': {
      if (!state.currentDetailId) return state;
      const sol: Solution = { ...action.sol, id: 'S' + Date.now() };
      const problems = state.problems.map(p => {
        if (p.id !== state.currentDetailId) return p;
        return { ...p, solutions: [...p.solutions, sol], stage: Math.max(p.stage, 3) };
      });
      const notifs = addNotif(state.notifications, `Solution "${sol.title}" submitted for ${state.currentDetailId}.`);

      // Async backend persistence
      fetch('/api/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: state.currentDetailId,
          title: sol.title,
          org_name: sol.org,
          desc: sol.desc,
          tech: sol.tech,
          cost: sol.cost,
          time: sol.time,
          impact: sol.impact
        })
      }).catch(() => {});

      return { ...state, problems, notifications: notifs, solutionOpen: false };
    }
    case 'GIVE_FEEDBACK': {
      if (!state.currentDetailId) return state;
      const problems = state.problems.map(p => {
        if (p.id !== state.currentDetailId) return p;
        const stage = action.resolved ? 7 : Math.max(1, p.stage - 2);
        return { ...p, verification: { resolved: action.resolved, comment: action.comment }, stage };
      });
      const notifs = addNotif(state.notifications, `${state.currentDetailId} — citizen ${action.resolved ? 'confirmed resolution.' : 'reported it is still unresolved.'}`);

      // Async backend verification record
      fetch('/api/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: state.currentDetailId,
          resolved: action.resolved,
          comment: action.comment
        })
      }).catch(() => {});

      return { ...state, problems, notifications: notifs };
    }
    case 'GOV_ACTION': {
      if (!state.currentDetailId) return state;
      const p = state.problems.find(x => x.id === state.currentDetailId);
      if (!p) return state;
      if (action.action === 'assign') {
        const problems = state.problems.map(x => x.id === state.currentDetailId ? { ...x, stage: Math.max(x.stage, 2) } : x);
        const notifs = addNotif(state.notifications, `${state.currentDetailId} assigned to ${p.ai?.authority}.`);
        return { ...state, problems, notifications: notifs };
      }
      const notifs = addNotif(state.notifications, `Verification requested for ${state.currentDetailId}.`);
      return { ...state, notifications: notifs };
    }
    case 'INVITE_ORG': {
      const notifs = addNotif(state.notifications, `${action.name} has been invited to collaborate on ${state.currentDetailId}.`);
      return { ...state, notifications: notifs };
    }
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
    case 'CREATE_FROM_WORKFLOW': {
      const counter = state.problemCounter + 1;
      const id = 'SY-2026-' + String(1000 + counter).padStart(4, '0');
      const ai = classify(action.data.title, action.data.desc, action.data.category);
      const latVal = action.data.latitude ?? action.data.lat ?? DEMO_LOCATION.lat;
      const lngVal = action.data.longitude ?? action.data.lng ?? DEMO_LOCATION.lng;
      const newP: Problem = {
        ...action.data,
        id,
        solutions: [],
        verification: null,
        ai,
        category: ai.category || action.data.category,
        photos: state.wfFiles.slice(),
        lat: latVal,
        lng: lngVal,
        latitude: latVal,
        longitude: lngVal,
        address: action.data.address || action.data.location,
        location_source: action.data.location_source || 'DEMO_LOCATION',
        location_accuracy: action.data.location_accuracy || '~10m',
        location_confirmed: true,
        location_updated_at: new Date().toISOString()
      };
      const matches = buildMatches(ai.category, newP.location, latVal, lngVal);
      const notifs = addNotif(state.notifications, `Your problem ${id} has been submitted and classified.`);

      // Async backend persistence
      fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newP.title,
          desc: newP.desc,
          category: newP.category,
          location: newP.location,
          severity: newP.severity,
          affected: newP.affected,
          landmark: newP.landmark,
          datetime: newP.datetime,
          contact: newP.contact,
          latitude: newP.latitude,
          longitude: newP.longitude,
          location_source: newP.location_source,
          location_accuracy: newP.location_accuracy,
          photos: newP.photos
        })
      }).catch(() => {});

      return {
        ...state,
        problemCounter: counter,
        wfCreatedId: id,
        problems: [{ ...newP, _matches: matches }, ...state.problems],
        notifications: notifs
      };
    }
    case 'RESTORE':
      return {
        ...state,
        problems: action.state.problems ?? state.problems,
        problemCounter: action.state.problemCounter ?? state.problemCounter,
        notifications: action.state.notifications ?? state.notifications,
      };
    case 'RESET': {
      fetch('/api/seed', { method: 'POST' }).catch(() => {});
      return init();
    }
    default:
      return state;
  }
}

// ---------- Context ----------
interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  showView: (view: View) => void;
  openDetail: (id: string, from: View) => void;
}

const SahYogContext = createContext<ContextValue | null>(null);

export function SahYogProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  // Sync with persistent Next.js API / Database on initial load
  useEffect(() => {
    async function syncWithBackend() {
      try {
        const res = await fetch('/api/problems');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            dispatch({
              type: 'RESTORE',
              state: {
                problems: json.data,
                problemCounter: json.data.length + 120
              }
            });
            return;
          }
        }
      } catch {
        // Backend fetch fallback handled below
      }

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

    syncWithBackend();
  }, []);

  // Sync to localStorage as client cache
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

  return (
    <SahYogContext.Provider value={{ state, dispatch, showView, openDetail }}>
      {children}
    </SahYogContext.Provider>
  );
}

export function useSahYog() {
  const ctx = useContext(SahYogContext);
  if (!ctx) throw new Error('useSahYog must be used within SahYogProvider');
  return ctx;
}
