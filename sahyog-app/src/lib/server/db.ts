import fs from 'fs/promises';
import path from 'path';
import type {
  Problem,
  Solution,
  OrgMatch,
  Verification,
  Notification,
  ProblemEvent,
  LocationSource,
  UserRecord,
  OrganizationRecord,
  ProblemClassificationRecord,
  SolverMatchRecord,
  CollaborationRecord,
  SolutionRecord,
  VerificationRecord,
  Role,
} from '@/lib/types';
import { INITIAL_PROBLEMS, INITIAL_NOTIFICATIONS, ORG_POOL, DEMO_LOCATION } from '@/lib/constants';
import { classify, buildMatches, makeId } from '@/lib/classifier';

interface DatabaseSchema {
  version: number;
  users: UserRecord[];
  organizations: OrganizationRecord[];
  problems: Problem[];
  problem_classifications: ProblemClassificationRecord[];
  solver_matches: SolverMatchRecord[];
  collaborations: CollaborationRecord[];
  solutions: SolutionRecord[];
  problem_updates: ProblemEvent[];
  verifications: VerificationRecord[];
  notifications: Notification[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'sahyog.db.json');

// In-memory cache for ultra-fast local reads with background write
let cachedDb: DatabaseSchema | null = null;
let savePromise: Promise<void> | null = null;

function getInitialDemoOrgs(): OrganizationRecord[] {
  const orgs: OrganizationRecord[] = [];
  const seen = new Set<string>();

  Object.values(ORG_POOL).flat().forEach((m, idx) => {
    if (!seen.has(m.name)) {
      seen.add(m.name);
      orgs.push({
        id: `ORG-${String(idx + 1).padStart(3, '0')}`,
        name: m.name,
        type: m.type,
        jurisdiction: m.location.includes('Hyderabad') || m.location.includes('City') ? 'Hyderabad Metropolitan Region' : 'State Jurisdiction',
        location: m.location,
        expertise: m.expertise,
        resources: m.resources,
        capacity_score: m.factors.capacity * 10,
        is_demo: true,
        created_at: new Date().toISOString()
      });
    }
  });

  return orgs;
}

function getInitialDemoProblems(): {
  problems: Problem[];
  classifications: ProblemClassificationRecord[];
  matches: SolverMatchRecord[];
  solutions: SolutionRecord[];
  events: ProblemEvent[];
} {
  const classifications: ProblemClassificationRecord[] = [];
  const matches: SolverMatchRecord[] = [];
  const solutions: SolutionRecord[] = [];
  const events: ProblemEvent[] = [];

  const problems: Problem[] = INITIAL_PROBLEMS.map((p, pIdx) => {
    const ai = p.ai ?? classify(p.title, p.desc, p.category);
    const orgMatches = p._matches ?? buildMatches(ai.category, p.location, p.lat, p.lng);

    // Classification record
    classifications.push({
      id: `CLS-${p.id}`,
      problem_id: p.id,
      method: 'RULE_BASED_PROTOTYPE',
      category: ai.category,
      subcategory: ai.subcategory,
      authority: ai.authority,
      reason: ai.reason,
      action: ai.action,
      confidence: ai.confidence,
      matched_terms: ai.terms,
      created_at: new Date(Date.now() - (8 - pIdx) * 3600000).toISOString()
    });

    // Solver match records
    orgMatches.forEach((m, mIdx) => {
      matches.push({
        id: `MTC-${p.id}-${mIdx + 1}`,
        problem_id: p.id,
        org_name: m.name,
        org_type: m.type,
        score: m.score,
        score_type: 'PROTOTYPE_WEIGHTED_SCORE',
        factor_domain: m.factors.domain,
        factor_jurisdiction: m.factors.jurisdiction,
        factor_expertise: m.factors.expertise,
        factor_capacity: m.factors.capacity,
        role_in_problem: m.roleInProblem,
        status: mIdx === 0 ? 'accepted' : 'recommended',
        created_at: new Date(Date.now() - (8 - pIdx) * 3600000).toISOString()
      });
    });

    // Solutions records
    p.solutions.forEach((s) => {
      solutions.push({
        id: s.id,
        problem_id: p.id,
        title: s.title,
        org_name: s.org,
        status: s.status,
        desc: s.desc,
        tech: s.tech,
        cost: s.cost,
        time: s.time,
        impact: s.impact,
        created_at: new Date(Date.now() - (7 - pIdx) * 3600000).toISOString(),
        updated_at: new Date(Date.now() - (3 - pIdx) * 3600000).toISOString()
      });
    });

    // Initial lifecycle events adhering to the 9-stage sequence:
    // 0: Reported, 1: Verified, 2: Matched, 3: Collaborating, 4: Solution Proposed,
    // 5: Approved, 6: In Deployment, 7: Resolved, 8: Citizen Verified
    const initialEvents: ProblemEvent[] = [
      {
        id: `EV-${p.id}-01`,
        problem_id: p.id,
        event_type: 'REPORTED',
        stage: 0,
        actor_role: 'Citizen',
        description: `Citizen submitted problem report at ${p.location}`,
        timestamp: new Date(Date.now() - (8 - pIdx) * 3600000).toISOString()
      },
      {
        id: `EV-${p.id}-02`,
        problem_id: p.id,
        event_type: 'CLASSIFIED',
        stage: 1,
        actor_role: 'System',
        description: `Rule-based classification assigned to ${ai.category} -> ${ai.authority}`,
        timestamp: new Date(Date.now() - (8 - pIdx) * 3600000 + 60000).toISOString()
      }
    ];

    if (p.stage >= 2) {
      initialEvents.push({
        id: `EV-${p.id}-03`,
        problem_id: p.id,
        event_type: 'MATCHED',
        stage: 2,
        actor_role: 'System',
        description: `Multi-stakeholder solver matching recommended 4 organizations`,
        timestamp: new Date(Date.now() - (7 - pIdx) * 3600000).toISOString()
      });
    }

    if (p.stage >= 3) {
      initialEvents.push({
        id: `EV-${p.id}-04`,
        problem_id: p.id,
        event_type: 'ASSIGNED',
        stage: 3,
        actor_role: 'Government',
        description: `Statutory authority acknowledged problem and joined collaboration workspace`,
        timestamp: new Date(Date.now() - (6 - pIdx) * 3600000).toISOString()
      });
    }

    if (p.solutions.length > 0 && p.stage >= 4) {
      initialEvents.push({
        id: `EV-${p.id}-05`,
        problem_id: p.id,
        event_type: 'SOLUTION_PROPOSED',
        stage: 4,
        actor_role: 'University',
        description: `Solution proposal "${p.solutions[0].title}" submitted by ${p.solutions[0].org}`,
        timestamp: new Date(Date.now() - (4 - pIdx) * 3600000).toISOString()
      });
    }

    if (p.stage >= 5) {
      initialEvents.push({
        id: `EV-${p.id}-06`,
        problem_id: p.id,
        event_type: 'SOLUTION_APPROVED',
        stage: 5,
        actor_role: 'Government',
        description: `Statutory civic permit and technical validation granted by Municipal Authority`,
        timestamp: new Date(Date.now() - (2 - pIdx) * 3600000).toISOString()
      });
    }

    if (p.stage >= 6) {
      initialEvents.push({
        id: `EV-${p.id}-07`,
        problem_id: p.id,
        event_type: 'DEPLOYMENT_STARTED',
        stage: 6,
        actor_role: 'Industry',
        description: `Field compaction crew and materials mobilized on site`,
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
      });
    }

    if (p.stage >= 7) {
      initialEvents.push({
        id: `EV-${p.id}-08`,
        problem_id: p.id,
        event_type: 'DEPLOYMENT_COMPLETED',
        stage: 7,
        actor_role: 'Industry',
        description: `Repair completed on ground; awaiting final citizen ground-truth verification`,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      });
    }

    if (p.stage >= 8 && p.verification) {
      initialEvents.push({
        id: `EV-${p.id}-09`,
        problem_id: p.id,
        event_type: p.verification.resolved ? 'VERIFIED' : 'REOPENED',
        stage: p.verification.resolved ? 8 : 3,
        actor_role: 'Citizen',
        description: `Citizen on-ground verification: ${p.verification.resolved ? 'CONFIRMED RESOLVED' : 'REOPENED'} — "${p.verification.comment}"`,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      });
    }

    initialEvents.forEach(ev => events.push(ev));

    // Ensure realistic evidence photo for flagship case
    const photos = pIdx === 0
      ? [{ src: '/demo/pothole_before.jpg', isVideo: false, name: 'college_gate_pothole_evidence.jpg' }]
      : p.photos;

    return {
      ...p,
      photos,
      latitude: p.lat ?? (pIdx === 0 ? DEMO_LOCATION.lat : 17.3850 + (p.mapY / 1000)),
      longitude: p.lng ?? (pIdx === 0 ? DEMO_LOCATION.lng : 78.4867 + (p.mapX / 1000)),
      address: p.location,
      location_source: pIdx === 0 ? 'DEMO_LOCATION' : 'MAP_SELECTED',
      location_accuracy: pIdx === 0 ? 'Exact GPS (LIET Campus Benchmark)' : '~25m',
      location_confirmed: true,
      location_updated_at: new Date().toISOString(),
      ai,
      _matches: orgMatches,
      events: initialEvents
    };
  });

  return { problems, classifications, matches, solutions, events };
}

function seedDatabase(): DatabaseSchema {
  const initialOrgs = getInitialDemoOrgs();
  const { problems, classifications, matches, solutions, events } = getInitialDemoProblems();

  const users: UserRecord[] = [
    { id: 'USR-001', name: 'Dr. T. Kaif (Citizen Reporter)', email: 'citizen@sahyog.org', role: 'citizen', created_at: new Date().toISOString() },
    { id: 'USR-002', name: 'Er. S. Rao (Chief Engineer, GHMC)', email: 'govt@ghmc.gov.in', role: 'government', org_id: 'ORG-001', created_at: new Date().toISOString() },
    { id: 'USR-003', name: 'Prof. A. Farhan (Civil Tech Lab, LIET)', email: 'univ@lords.ac.in', role: 'university', org_id: 'ORG-002', created_at: new Date().toISOString() },
    { id: 'USR-004', name: 'Rajesh K. (Project Lead, Deccan InfraTech)', email: 'industry@deccaninfra.com', role: 'industry', org_id: 'ORG-003', created_at: new Date().toISOString() },
    { id: 'USR-005', name: 'Priya Sharma (SafeRoads Civic Foundation)', email: 'ngo@saferoads.org', role: 'ngo', org_id: 'ORG-004', created_at: new Date().toISOString() },
  ];

  const collaborations: CollaborationRecord[] = problems.map((p, idx) => ({
    id: `COL-${p.id}`,
    problem_id: p.id,
    status: p.stage >= 8 ? 'completed' : 'active',
    current_action: p.stage >= 8
      ? 'Citizen Verification Complete — Case Closed'
      : p.stage >= 6
        ? 'Active Field Deployment — Rapid Polymer Pothole Compaction Crew On Ground'
        : p.stage >= 5
          ? 'Solution Approved by Statutory Authority — Material Logistics Mobilizing'
          : p.stage >= 4
            ? 'Solution Proposal Submitted — Under Statutory Civic Review'
            : 'Multi-Stakeholder Collaboration Workspace Active',
    started_at: new Date(Date.now() - (7 - idx) * 3600000).toISOString(),
    updated_at: new Date().toISOString()
  }));

  const verifications: VerificationRecord[] = [];
  problems.forEach(p => {
    if (p.verification) {
      verifications.push({
        id: `VER-${p.id}`,
        problem_id: p.id,
        status: p.verification.resolved ? 'VERIFIED_RESOLVED' : 'REOPENED',
        feedback: p.verification.comment,
        evidence_ref: p.verification.evidence_ref || '/demo/pothole_after.jpg',
        verified_by: 'Citizen Reporter (Ground-Truth Verification)',
        timestamp: new Date().toISOString()
      });
    }
  });

  return {
    version: 2,
    users,
    organizations: initialOrgs,
    problems,
    problem_classifications: classifications,
    solver_matches: matches,
    collaborations,
    solutions,
    problem_updates: events,
    verifications,
    notifications: INITIAL_NOTIFICATIONS.map((n, i) => ({
      id: `NOTIF-${i + 1}`,
      text: n.text,
      unread: n.unread,
      time: (n as { text: string; unread: boolean; time?: string }).time || `${(i + 1) * 15}m ago`,
      created_at: new Date().toISOString()
    }))
  };
}

/**
 * Load database from disk or initialize if missing
 */
export async function getDb(): Promise<DatabaseSchema> {
  if (cachedDb) return cachedDb;

  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    cachedDb = JSON.parse(raw) as DatabaseSchema;
    return cachedDb;
  } catch {
    // If file doesn't exist or is invalid, seed fresh database
    const freshDb = seedDatabase();
    await saveDb(freshDb);
    cachedDb = freshDb;
    return cachedDb;
  }
}

/**
 * Persist database to disk safely
 */
export async function saveDb(db: DatabaseSchema): Promise<void> {
  cachedDb = db;
  const dir = path.dirname(DB_FILE);

  const writeOp = async () => {
    await fs.mkdir(dir, { recursive: true });
    const tmpFile = `${DB_FILE}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
    await fs.rename(tmpFile, DB_FILE);
  };

  savePromise = (savePromise || Promise.resolve()).then(writeOp);
  await savePromise;
}

// ==========================================
// Database Query & Mutation Operations
// ==========================================

export async function listProblems(filters?: { category?: string; severity?: string; stage?: number }): Promise<Problem[]> {
  const db = await getDb();
  let list = db.problems;

  if (filters?.category) list = list.filter(p => p.category === filters.category);
  if (filters?.severity) list = list.filter(p => p.severity === filters.severity);
  if (filters?.stage !== undefined) list = list.filter(p => p.stage === filters.stage);

  return list;
}

export async function getProblem(id: string): Promise<Problem | null> {
  const db = await getDb();
  const p = db.problems.find(x => x.id === id);
  if (!p) return null;

  // Hydrate with latest relational records
  const solutions = db.solutions.filter(s => s.problem_id === id);
  const events = db.problem_updates.filter(e => e.problem_id === id);
  const verification = db.verifications.find(v => v.problem_id === id);

  return {
    ...p,
    solutions: solutions.length ? solutions.map(s => ({
      id: s.id,
      title: s.title,
      org: s.org_name,
      status: s.status,
      desc: s.desc,
      tech: s.tech,
      cost: s.cost,
      time: s.time,
      impact: s.impact,
    })) : p.solutions,
    verification: verification ? {
      resolved: verification.status === 'VERIFIED_RESOLVED',
      comment: verification.feedback,
      evidence_ref: verification.evidence_ref,
      timestamp: verification.timestamp,
      verified_by: verification.verified_by
    } : p.verification,
    events: events.length ? events : p.events
  };
}

export async function createProblemRecord(payload: {
  title: string;
  desc: string;
  category: string;
  location: string;
  severity: string;
  affected?: string;
  landmark?: string;
  datetime?: string;
  contact?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_source?: LocationSource;
  location_accuracy?: string;
  location_confirmed?: boolean;
  photos?: Problem['photos'];
}): Promise<Problem> {
  const db = await getDb();
  const nextNumber = db.problems.length + 101;
  const id = `SY-2026-${String(1000 + nextNumber).padStart(4, '0')}`;

  // 1. Authoritative Backend Classification (RULE_BASED_PROTOTYPE)
  const aiResult = classify(payload.title, payload.desc, payload.category);
  const classificationRecord: ProblemClassificationRecord = {
    id: `CLS-${id}`,
    problem_id: id,
    method: 'RULE_BASED_PROTOTYPE',
    category: aiResult.category,
    subcategory: aiResult.subcategory,
    authority: aiResult.authority,
    reason: aiResult.reason,
    action: aiResult.action,
    confidence: aiResult.confidence,
    matched_terms: aiResult.terms,
    created_at: new Date().toISOString()
  };
  db.problem_classifications.push(classificationRecord);

  // 2. Multi-Stakeholder Solver Matching (PROTOTYPE_WEIGHTED_SCORE with geographic factor)
  const orgMatches = buildMatches(aiResult.category, payload.location, payload.latitude, payload.longitude);
  orgMatches.forEach((m, idx) => {
    db.solver_matches.push({
      id: `MTC-${id}-${idx + 1}`,
      problem_id: id,
      org_name: m.name,
      org_type: m.type,
      score: m.score,
      score_type: 'PROTOTYPE_WEIGHTED_SCORE',
      factor_domain: m.factors.domain,
      factor_jurisdiction: m.factors.jurisdiction,
      factor_expertise: m.factors.expertise,
      factor_capacity: m.factors.capacity,
      role_in_problem: m.roleInProblem,
      status: idx === 0 ? 'accepted' : 'recommended',
      created_at: new Date().toISOString()
    });
  });

  // 3. Problem Events
  const nowStr = new Date().toISOString();
  const initialEvents: ProblemEvent[] = [
    {
      id: `EV-${id}-01`,
      problem_id: id,
      event_type: 'REPORTED',
      stage: 0,
      actor_role: 'Citizen',
      description: `Problem reported at ${payload.location} (Source: ${payload.location_source || 'MANUAL_ENTRY'})`,
      timestamp: nowStr
    },
    {
      id: `EV-${id}-02`,
      problem_id: id,
      event_type: 'CLASSIFIED',
      stage: 1,
      actor_role: 'System',
      description: `Prototype Rule-Based Classification: Assigned to ${aiResult.category} (Mandated Authority: ${aiResult.authority})`,
      metadata: { method: 'RULE_BASED_PROTOTYPE', confidence: aiResult.confidence },
      timestamp: nowStr
    },
    {
      id: `EV-${id}-03`,
      problem_id: id,
      event_type: 'MATCHED',
      stage: 2,
      actor_role: 'System',
      description: `Explainable 4-Factor Solver Matching completed (Domain 40%, Jurisdiction 30%, Expertise 20%, Capacity 10%).`,
      timestamp: nowStr
    }
  ];
  initialEvents.forEach(e => db.problem_updates.push(e));

  // 4. Initial Collaboration Workspace
  db.collaborations.push({
    id: `COL-${id}`,
    problem_id: id,
    status: 'active',
    current_action: `Statutory Authority (${aiResult.authority}) assigned — Open for technical proposals from academia & industry.`,
    started_at: nowStr,
    updated_at: nowStr
  });

  // 5. Build full problem entity (stage 2: Matched)
  const newProblem: Problem = {
    id,
    title: payload.title,
    desc: payload.desc,
    category: aiResult.category,
    location: payload.location,
    affected: payload.affected || '—',
    severity: payload.severity || 'Medium',
    stage: 2,
    date: 'Today',
    mapX: 20 + Math.random() * 60,
    mapY: 20 + Math.random() * 60,
    landmark: payload.landmark || '',
    datetime: payload.datetime || nowStr,
    contact: payload.contact || '',
    latitude: payload.latitude ?? (payload.location.includes('Lord') ? DEMO_LOCATION.lat : 17.3850),
    longitude: payload.longitude ?? (payload.location.includes('Lord') ? DEMO_LOCATION.lng : 78.4867),
    lat: payload.latitude ?? (payload.location.includes('Lord') ? DEMO_LOCATION.lat : 17.3850),
    lng: payload.longitude ?? (payload.location.includes('Lord') ? DEMO_LOCATION.lng : 78.4867),
    address: payload.location,
    location_source: payload.location_source || 'DEMO_LOCATION',
    location_accuracy: payload.location_accuracy || '~10m',
    location_confirmed: payload.location_confirmed ?? true,
    location_updated_at: nowStr,
    photos: payload.photos || [],
    solutions: [],
    verification: null,
    ai: { ...aiResult, method: 'RULE_BASED_PROTOTYPE' },
    _matches: orgMatches,
    events: initialEvents,
    created_at: nowStr,
    updated_at: nowStr
  };

  db.problems.unshift(newProblem);

  // Add notification
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    text: `New problem ${id} registered in ${payload.location} and classified under ${aiResult.category}.`,
    unread: true,
    time: 'Just now',
    user_role: 'citizen',
    created_at: nowStr
  });

  await saveDb(db);
  return newProblem;
}

export async function addSolutionRecord(payload: {
  problem_id: string;
  title: string;
  org_name: string;
  desc: string;
  tech: string;
  cost: string;
  time: string;
  impact: string;
  actor_role?: string;
}): Promise<Problem | null> {
  const db = await getDb();
  const pIndex = db.problems.findIndex(x => x.id === payload.problem_id);
  if (pIndex === -1) return null;

  // Role validation: Citizens cannot submit technical solutions
  const role = (payload.actor_role || 'university').toLowerCase();
  if (role === 'citizen') {
    throw new Error('Citizens report issues and verify results; solutions must be submitted by University, Industry, or Government partners.');
  }

  const solId = `S${Date.now()}`;
  const newSol: SolutionRecord = {
    id: solId,
    problem_id: payload.problem_id,
    title: payload.title,
    org_name: payload.org_name,
    status: 'Proposed',
    desc: payload.desc,
    tech: payload.tech,
    cost: payload.cost,
    time: payload.time,
    impact: payload.impact,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.solutions.push(newSol);

  // Advance stage to Stage 4 (Solution Proposed)
  const targetStage = Math.max(db.problems[pIndex].stage, 4);
  db.problems[pIndex].stage = targetStage;
  db.problems[pIndex].solutions.push({
    id: solId,
    title: payload.title,
    org: payload.org_name,
    status: 'Proposed',
    desc: payload.desc,
    tech: payload.tech,
    cost: payload.cost,
    time: payload.time,
    impact: payload.impact
  });

  // Log event
  db.problem_updates.push({
    id: `EV-${payload.problem_id}-${Date.now()}`,
    problem_id: payload.problem_id,
    event_type: 'SOLUTION_PROPOSED',
    stage: targetStage,
    actor_role: (role === 'industry' ? 'Industry' : role === 'government' ? 'Government' : 'University'),
    description: `Solution proposal "${payload.title}" submitted by ${payload.org_name}.`,
    timestamp: new Date().toISOString()
  });

  // Update notification
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    text: `New technical solution proposed for ${payload.problem_id} by ${payload.org_name}.`,
    unread: true,
    time: 'Just now',
    user_role: 'government',
    created_at: new Date().toISOString()
  });

  await saveDb(db);
  return getProblem(payload.problem_id);
}

export async function updateSolutionStatus(
  solutionId: string,
  status: Solution['status'],
  actorRole: 'Government' | 'Industry' | 'University' | 'Citizen' = 'Government'
): Promise<Problem | null> {
  const db = await getDb();
  const solIndex = db.solutions.findIndex(s => s.id === solutionId);
  if (solIndex === -1) return null;

  // Role security: Only Government statutory authorities can approve or reject solutions
  if ((status === 'Approved' || status === 'Rejected') && actorRole !== 'Government') {
    throw new Error('Permission denied: Only statutory Government authorities can approve or reject technical solution proposals.');
  }

  db.solutions[solIndex].status = status;
  db.solutions[solIndex].updated_at = new Date().toISOString();

  const problemId = db.solutions[solIndex].problem_id;
  const pIndex = db.problems.findIndex(p => p.id === problemId);
  if (pIndex === -1) return null;

  // Sync solution in problem document
  db.problems[pIndex].solutions = db.problems[pIndex].solutions.map(s =>
    s.id === solutionId ? { ...s, status } : s
  );

  // Stage advancement in the 9-stage sequence:
  // Approved: Stage 5
  // In Deployment: Stage 6
  // Completed: Stage 7 (Resolved)
  let newStage = db.problems[pIndex].stage;
  let eventType: ProblemEvent['event_type'] = 'SOLUTION_APPROVED';
  if (status === 'Approved') {
    newStage = Math.max(newStage, 5);
    eventType = 'SOLUTION_APPROVED';
  } else if (status === 'In Deployment') {
    newStage = Math.max(newStage, 6);
    eventType = 'DEPLOYMENT_STARTED';
  } else if (status === 'Completed') {
    newStage = Math.max(newStage, 7);
    eventType = 'DEPLOYMENT_COMPLETED';
  }

  db.problems[pIndex].stage = newStage;

  // Log tracking event
  db.problem_updates.push({
    id: `EV-${problemId}-${Date.now()}`,
    problem_id: problemId,
    event_type: eventType,
    stage: newStage,
    actor_role: actorRole as any,
    description: `Solution "${db.solutions[solIndex].title}" status transitioned to "${status}".`,
    timestamp: new Date().toISOString()
  });

  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    text: `Solution "${db.solutions[solIndex].title}" for ${problemId} updated to: ${status}.`,
    unread: true,
    time: 'Just now',
    user_role: 'citizen',
    created_at: new Date().toISOString()
  });

  await saveDb(db);
  return getProblem(problemId);
}

export async function recordVerificationRecord(payload: {
  problem_id: string;
  resolved: boolean;
  comment: string;
  evidence_ref?: string;
  verified_by?: string;
  actor_role?: string;
}): Promise<Problem | null> {
  const db = await getDb();
  const pIndex = db.problems.findIndex(p => p.id === payload.problem_id);
  if (pIndex === -1) return null;

  // Role security: Ground-truth verification is strictly reserved for Citizens
  const role = (payload.actor_role || 'citizen').toLowerCase();
  if (role !== 'citizen' && role !== 'system') {
    throw new Error('Permission denied: Only local Citizens can provide final ground-truth verification sign-off.');
  }

  const nowStr = new Date().toISOString();
  const verificationRecord: VerificationRecord = {
    id: `VER-${payload.problem_id}`,
    problem_id: payload.problem_id,
    status: payload.resolved ? 'VERIFIED_RESOLVED' : 'REOPENED',
    feedback: payload.comment,
    evidence_ref: payload.evidence_ref || '/demo/pothole_after.jpg',
    verified_by: payload.verified_by || 'Citizen Reporter (Ground-Truth Sign-Off)',
    timestamp: nowStr
  };

  // Upsert verification record
  const existingVerIdx = db.verifications.findIndex(v => v.problem_id === payload.problem_id);
  if (existingVerIdx >= 0) db.verifications[existingVerIdx] = verificationRecord;
  else db.verifications.push(verificationRecord);

  // Closed loop: Stage 8 = Citizen Verified, or stage 3 if reopened for corrective action
  const finalStage = payload.resolved ? 8 : 3;
  db.problems[pIndex].stage = finalStage;
  db.problems[pIndex].verification = {
    resolved: payload.resolved,
    comment: payload.comment,
    evidence_ref: verificationRecord.evidence_ref,
    timestamp: nowStr,
    verified_by: verificationRecord.verified_by
  };

  // Log tracking event
  db.problem_updates.push({
    id: `EV-${payload.problem_id}-${Date.now()}`,
    problem_id: payload.problem_id,
    event_type: payload.resolved ? 'VERIFIED' : 'REOPENED',
    stage: finalStage,
    actor_role: 'Citizen',
    description: `Citizen ground-truth sign-off: ${payload.resolved ? 'CONFIRMED RESOLUTION (Stage 8 Closed-Loop Complete)' : 'REOPENED FOR CORRECTIVE ACTION'} — "${payload.comment}"`,
    timestamp: nowStr
  });

  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    text: `Citizen ground-truth verification completed for ${payload.problem_id}: ${payload.resolved ? 'Resolved & Verified' : 'Reopened'}.`,
    unread: true,
    time: 'Just now',
    user_role: 'government',
    created_at: nowStr
  });

  await saveDb(db);
  return getProblem(payload.problem_id);
}

export async function joinCollaborationWorkspace(payload: {
  problem_id: string;
  org_name: string;
  org_type: 'Government' | 'University' | 'Industry' | 'NGO';
  role_in_problem: string;
}): Promise<Problem | null> {
  const db = await getDb();
  const pIndex = db.problems.findIndex(p => p.id === payload.problem_id);
  if (pIndex === -1) return null;

  // Advance stage to Stage 3 (Collaborating) if earlier
  const targetStage = Math.max(db.problems[pIndex].stage, 3);
  db.problems[pIndex].stage = targetStage;

  // Log event
  db.problem_updates.push({
    id: `EV-${payload.problem_id}-${Date.now()}`,
    problem_id: payload.problem_id,
    event_type: 'ASSIGNED',
    stage: targetStage,
    actor_role: payload.org_type as any,
    description: `${payload.org_name} (${payload.org_type}) joined the collaboration workspace as: ${payload.role_in_problem}.`,
    timestamp: new Date().toISOString()
  });

  await saveDb(db);
  return getProblem(payload.problem_id);
}

export async function getDashboardMetrics() {
  const db = await getDb();
  const total = db.problems.length;
  const verified = db.problems.filter(p => p.stage >= 8).length;
  const activeDeployments = db.problems.filter(p => p.stage >= 5 && p.stage < 8).length;
  const matchingOrReview = db.problems.filter(p => p.stage < 5).length;

  return {
    meta: {
      type: 'PROTOTYPE_METRICS',
      purpose: 'Smart India Hackathon 2026 Evaluation (PS: SIH26043)',
      persistent: true,
      lastUpdated: new Date().toISOString()
    },
    counts: {
      totalProblems: total,
      citizenVerified: verified,
      activeDeployments,
      inMatchingOrReview: matchingOrReview,
      participatingOrganizations: db.organizations.length,
      crossSectorProposals: db.solutions.length
    },
    byRole: {
      citizen: {
        reported: total,
        awaitingVerification: db.problems.filter(p => p.stage === 7).length,
        verifiedComplete: verified
      },
      government: {
        totalUnderJurisdiction: total,
        pendingApproval: db.solutions.filter(s => s.status === 'Proposed' || s.status === 'Under Review').length,
        approvedForDeployment: db.solutions.filter(s => s.status === 'Approved' || s.status === 'In Deployment').length
      },
      university: {
        availableChallenges: total,
        activePrototypes: db.solutions.filter(s => s.status !== 'Rejected').length,
        matchedInstitutes: db.organizations.filter(o => o.type === 'University').length
      },
      industry: {
        contractTenders: db.solutions.filter(s => s.status === 'Approved').length,
        activeDeployments,
        matchedCompanies: db.organizations.filter(o => o.type === 'Industry').length
      },
      ngo: {
        communityLiaisonCases: total,
        onGroundVerifications: verified,
        participatingNGOs: db.organizations.filter(o => o.type === 'NGO').length
      }
    }
  };
}

export async function getNotifications(role?: Role | null): Promise<Notification[]> {
  const db = await getDb();
  if (!role) return db.notifications;
  return db.notifications.filter(n => !n.user_role || n.user_role === role);
}

export async function markNotificationsAsRead(): Promise<void> {
  const db = await getDb();
  db.notifications = db.notifications.map(n => ({ ...n, unread: false }));
  await saveDb(db);
}

export async function resetDatabaseToDemo(): Promise<DatabaseSchema> {
  const freshDb = seedDatabase();
  await saveDb(freshDb);
  return freshDb;
}
