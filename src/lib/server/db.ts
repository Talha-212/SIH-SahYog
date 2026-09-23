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
import { getServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { deleteFromStorage, BUCKETS } from '@/lib/supabase/storage';
import type {
  ProblemRow,
  ProblemEvidenceRow,
  ProblemClassificationRow,
  SeverityAssessmentRow,
  SolverMatchRow,
  CollaborationRow,
  SolutionRow,
  ProblemUpdateRow,
  VerificationRow,
  NotificationRow,
  OrganizationRow,
  LocationSourceType
} from '@/lib/supabase/types';

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
let orgMapCache: Record<string, string> = {};
let orgIdToNameCache: Record<string, string> = {};

export async function getOrInitSupabaseOrgs(supabase: any): Promise<Record<string, string>> {
  if (Object.keys(orgMapCache).length > 0) return orgMapCache;

  try {
    const { data: existingOrgs } = await supabase.from('organizations').select('id, name');
    if (existingOrgs && existingOrgs.length > 0) {
      existingOrgs.forEach((o: any) => {
        orgMapCache[o.name] = o.id;
        orgIdToNameCache[o.id] = o.name;
      });
      return orgMapCache;
    }

    const initialOrgs = [
      { name: 'Department of Urban Development & Housing, Govt. of Jharkhand', type: 'government', jurisdiction: 'Jharkhand State', capacity: 90 },
      { name: 'Road Construction Department, Govt. of Jharkhand', type: 'government', jurisdiction: 'Jharkhand State', capacity: 85 },
      { name: "BIT Mesra - Higher Education Innovation Partner", type: 'university', jurisdiction: 'Jharkhand', capacity: 80 },
      { name: 'IIT (ISM) Dhanbad - Research Partner', type: 'university', jurisdiction: 'Jharkhand / Regional', capacity: 75 },
      { name: 'Jharkhand MSME Innovation Partner', type: 'industry', jurisdiction: 'Jharkhand / National', capacity: 95 },
      { name: 'Tata Steel Innovation & CSR Partner', type: 'industry', jurisdiction: 'Jharkhand / National', capacity: 90 },
      { name: 'Jharkhand Community Innovation Network', type: 'ngo', jurisdiction: 'Local Municipalities', capacity: 70 },
      { name: 'Jharkhand Community Partner', type: 'ngo', jurisdiction: 'Community Clusters', capacity: 65 }
    ];

    for (const org of initialOrgs) {
      const oId = randomUUID();
      const { data } = await supabase.from('organizations').insert({
        id: oId,
        name: org.name,
        type: org.type,
        description: 'Partner organization participating in SahYog societal innovation framework',
        jurisdiction: org.jurisdiction,
        capacity: org.capacity,
        is_demo: true,
        created_at: new Date().toISOString()
      }).select();
      if (data && data[0]) {
        orgMapCache[org.name] = data[0].id;
        orgIdToNameCache[data[0].id] = org.name;
      }
    }
  } catch (err: any) {
    console.warn('[SahYog Database] Org seeding notice:', err?.message);
  }

  return orgMapCache;
}

export function stageToStatus(stage: number): string {
  switch (stage) {
    case 0: return 'reported';
    case 1: return 'verified';
    case 2: return 'matched';
    case 3: return 'collaborating';
    case 4: return 'solution_proposed';
    case 5: return 'approved';
    case 6: return 'deployed';
    case 7: return 'resolved';
    case 8: return 'citizen_verified';
    default: return 'reported';
  }
}

export function statusToStage(status?: string): number {
  switch (status?.toLowerCase()) {
    case 'reported': return 0;
    case 'verified': return 1;
    case 'matched': return 2;
    case 'collaborating': return 3;
    case 'solution_proposed': return 4;
    case 'approved': return 5;
    case 'deployed': return 6;
    case 'resolved': return 7;
    case 'citizen_verified': return 8;
    case 'rejected': return 0;
    default: return 0;
  }
}

function normalizeSeverity(s?: string): string {
  if (!s) return 'moderate';
  const lower = s.toLowerCase();
  if (lower === 'medium') return 'moderate';
  if (['low', 'moderate', 'high', 'critical'].includes(lower)) return lower;
  return 'moderate';
}

function normalizeLocationSource(src?: string): LocationSourceType {
  if (!src) return 'manual';
  const lower = src.toLowerCase();
  if (lower.includes('exif')) return 'exif';
  if (lower.includes('device') || lower.includes('gps')) return 'device_gps';
  if (lower.includes('map')) return 'map';
  if (lower.includes('demo')) return 'demo';
  return 'manual';
}

function parseNumericCost(cost?: string | number | null): number | null {
  if (cost === null || cost === undefined) return null;
  if (typeof cost === 'number') return cost;
  const cleaned = String(cost).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function displaySeverity(s?: string): string {
  if (!s) return 'Moderate';
  const lower = s.toLowerCase();
  if (lower === 'low') return 'Low';
  if (lower === 'moderate' || lower === 'medium') return 'Moderate';
  if (lower === 'high') return 'High';
  if (lower === 'critical') return 'Critical';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
        jurisdiction: m.location.toLowerCase().includes('jharkhand') ? 'Jharkhand State' : 'Regional / National',
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
        updated_at: new Date(Date.now() - (7 - pIdx) * 3600000).toISOString()
      });
    });

    events.push({
      id: `EV-${p.id}-1`,
      problem_id: p.id,
      event_type: 'REPORTED',
      stage: 0,
      actor_role: 'Citizen',
      description: `Problem reported by citizen at ${p.location}. Initial evidence captured.`,
      timestamp: new Date(Date.now() - 86400000).toISOString()
    });

    if (p.stage >= 1) {
      events.push({
        id: `EV-${p.id}-2`,
        problem_id: p.id,
        event_type: 'CLASSIFIED',
        stage: 1,
        actor_role: 'System',
        description: `Prototype classification assigned to ${ai.authority} with ${ai.confidence}% confidence.`,
        timestamp: new Date(Date.now() - 72000000).toISOString()
      });
    }

    return {
      ...p,
      ai,
      _matches: orgMatches,
      events: events.filter(e => e.problem_id === p.id)
    };
  });

  return { problems, classifications, matches, solutions, events };
}

function seedDatabase(): DatabaseSchema {
  const demoOrgs = getInitialDemoOrgs();
  const demoData = getInitialDemoProblems();

  return {
    version: 2,
    users: [
      { id: 'usr-citizen-01', name: 'Citizen Reporter', email: 'citizen@sahyog.local', role: 'citizen', created_at: new Date().toISOString() },
      { id: 'usr-gov-01', name: 'Government of Jharkhand Innovation Official', email: 'innovation@gov.jharkhand.in', role: 'government', org_id: 'ORG-001', created_at: new Date().toISOString() },
      { id: 'usr-univ-01', name: 'Lord\'s Innovation Lead', email: 'innovation@hei.sahyog.local', role: 'university', org_id: 'ORG-002', created_at: new Date().toISOString() },
      { id: 'usr-ind-01', name: 'SmartRoads Infra Partner', email: 'industry@sahyog.local', role: 'industry', org_id: 'ORG-003', created_at: new Date().toISOString() },
      { id: 'usr-ngo-01', name: 'Hyderabad Civic Watch', email: 'community@sahyog.local', role: 'ngo', org_id: 'ORG-004', created_at: new Date().toISOString() },
    ],
    organizations: demoOrgs,
    problems: demoData.problems,
    problem_classifications: demoData.classifications,
    solver_matches: demoData.matches,
    collaborations: [],
    solutions: demoData.solutions,
    problem_updates: demoData.events,
    verifications: [],
    notifications: INITIAL_NOTIFICATIONS.map((n, i) => ({
      id: `NOTIF-${i + 1}`,
      text: n.text,
      unread: n.unread,
      time: (n as any).time || 'Just now',
      created_at: new Date().toISOString()
    }))
  };
}

export async function getDb(): Promise<DatabaseSchema> {
  if (cachedDb) return cachedDb;

  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    cachedDb = JSON.parse(raw);
    return cachedDb!;
  } catch {
    cachedDb = seedDatabase();
    await saveDb(cachedDb);
    return cachedDb;
  }
}

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

// Transform a Supabase problem row with its relations into the Problem entity expected by the UI
function transformSupabaseProblem(row: any): Problem {
  const evidenceList = Array.isArray(row.problem_evidence) ? row.problem_evidence : [];
  const classifications = Array.isArray(row.problem_classifications) ? row.problem_classifications : [];
  const solutions = Array.isArray(row.solutions) ? row.solutions : [];
  const verifications = Array.isArray(row.verifications) ? row.verifications : [];
  const updates = Array.isArray(row.problem_updates) ? row.problem_updates : [];
  const matches = Array.isArray(row.solver_matches) ? row.solver_matches : [];

  const firstCls = classifications[0];
  const firstVer = verifications[0];

  const photos = evidenceList.map((e: any) => ({
    src: e.file_url,
    isVideo: e.mime_type?.includes('video') || false,
    name: e.file_name,
    exifGpsFound: e.exif_available
  }));

  const uiSolutions: Solution[] = solutions.map((s: any) => ({
    id: s.id,
    title: s.title,
    org: (s.organization_id && orgIdToNameCache[s.organization_id]) || s.proposed_by || "BIT Mesra - Higher Education Innovation Partner",
    status: (s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1).replace('_', ' ') : 'Proposed') as any,
    desc: s.description || '',
    tech: s.technical_details || '',
    cost: s.estimated_cost !== null && s.estimated_cost !== undefined ? `₹${Number(s.estimated_cost).toLocaleString('en-IN')}` : '',
    time: s.estimated_duration || '',
    impact: s.social_impact || 'High community impact',
    problem_understanding: s.problem_understanding || undefined,
    proposed_approach: s.proposed_approach || undefined,
    faculty_mentor: s.faculty_mentor || undefined,
    student_team: s.student_team || undefined,
    prototype_plan: s.prototype_plan || undefined,
    testing_plan: s.testing_plan || undefined,
    pilot_plan: s.pilot_plan || undefined,
    social_impact: s.social_impact || undefined,
    support_needed: s.support_needed || undefined,
    lifecycle_data: s.lifecycle_data || undefined,
    created_at: s.created_at,
    updated_at: s.updated_at
  }));

  const uiEvents: ProblemEvent[] = updates.map((u: any) => ({
    id: u.id,
    problem_id: u.problem_id,
    event_type: u.event_type || 'REPORTED',
    stage: statusToStage(u.new_status),
    actor_role: (u.actor_role ? u.actor_role.charAt(0).toUpperCase() + u.actor_role.slice(1) : 'System') as any,
    description: u.description || '',
    metadata: u.metadata,
    timestamp: u.created_at
  }));

  const orgMatches: OrgMatch[] = matches.map((m: any) => ({
    name: (m.organization_id && orgIdToNameCache[m.organization_id]) || 'Matched Solver',
    type: 'University',
    roleInProblem: m.match_reason || 'Technical Research & Development',
    expertise: 'Domain Specific',
    location: 'Regional',
    resources: 'Labs & Faculty',
    projects: 'Urban Innovation',
    reasons: [m.match_reason || 'High domain match'],
    score: m.score || 80,
    score_type: 'PROTOTYPE_WEIGHTED_SCORE',
    factors: {
      domain: m.domain_score || 35,
      jurisdiction: m.jurisdiction_score || 25,
      expertise: m.expertise_score || 18,
      capacity: m.capacity_score || 8
    }
  }));

  const lat = row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null;
  const lng = row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null;

  return {
    id: row.id,
    title: row.title,
    desc: row.description,
    category: row.category,
    location: row.address || row.landmark || 'Reported Location',
    affected: '100+ Citizens',
    severity: displaySeverity(row.severity),
    stage: statusToStage(row.status),
    date: row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : 'Recent',
    mapX: 50,
    mapY: 50,
    photos,
    solutions: uiSolutions,
    verification: firstVer ? {
      resolved: Boolean(firstVer.resolved),
      comment: firstVer.comment || '',
      evidence_ref: evidenceList.find((e: any) => e.id === firstVer.evidence_ref || e.evidence_type === 'verification')?.file_url || firstVer.evidence_ref,
      timestamp: firstVer.created_at,
      verified_by: firstVer.verified_by
    } : null,
    ai: firstCls ? {
      category: firstCls.category,
      subcategory: firstCls.subcategory || 'General',
      authority: firstCls.authority || row.authority || 'Municipal Authority',
      reason: firstCls.reasoning || 'Automated rule-based prototype classification',
      action: firstCls.recommended_action || row.recommended_action || 'Field inspection',
      confidence: firstCls.confidence || 85,
      terms: firstCls.matched_terms || [row.category],
      method: 'RULE_BASED_PROTOTYPE'
    } : undefined,
    _matches: orgMatches.length > 0 ? orgMatches : undefined,
    landmark: row.landmark || undefined,
    latitude: lat,
    longitude: lng,
    lat,
    lng,
    address: row.address || undefined,
    location_source: row.location_source?.toUpperCase() as any || 'MANUAL_ENTRY',
    location_confirmed: row.location_confirmed ?? true,
    state: (row.severity_assessments?.[0]?.factors as any)?.state || row.state || 'Jharkhand',
    district: (row.severity_assessments?.[0]?.factors as any)?.district || row.city || undefined,
    block: (row.severity_assessments?.[0]?.factors as any)?.block || undefined,
    domain: (row.severity_assessments?.[0]?.factors as any)?.domain || firstCls?.category?.toLowerCase() || 'other',
    subdomain: (row.severity_assessments?.[0]?.factors as any)?.subdomain || firstCls?.subcategory,
    affected_population: (row.severity_assessments?.[0]?.factors as any)?.affected_population || undefined,
    expected_outcome: (row.severity_assessments?.[0]?.factors as any)?.expected_outcome || undefined,
    required_expertise: (row.severity_assessments?.[0]?.factors as any)?.required_expertise || undefined,
    events: uiEvents,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// ==========================================
// 1. List Problems (Supabase Source of Truth)
// ==========================================
export async function listProblems(filters?: { category?: string; severity?: string; stage?: number }): Promise<Problem[]> {
  const supabase = getServerSupabaseClient();

  if (supabase && isServerSupabaseConfigured()) {
    try {
      let query = supabase
        .from('problems')
        .select(`
          *,
          problem_evidence (*),
          problem_classifications (*),
          severity_assessments (*),
          solver_matches (*),
          collaborations (*),
          solutions (*),
          problem_updates (*),
          verifications (*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.severity) {
        query = query.ilike('severity', filters.severity);
      }
      if (filters?.stage !== undefined) {
        const status = stageToStatus(filters.stage);
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(transformSupabaseProblem);
      }
      if (error) {
        console.warn('[SahYog Database] Supabase listProblems warning:', error.message);
      }
    } catch (err: any) {
      console.warn('[SahYog Database] Supabase listProblems exception:', err?.message);
    }
  }

  // Fallback to local store if Supabase offline / not configured
  const db = await getDb();
  let list = db.problems;

  if (filters?.category) list = list.filter(p => p.category === filters.category);
  if (filters?.severity) list = list.filter(p => p.severity.toLowerCase() === filters.severity?.toLowerCase());
  if (filters?.stage !== undefined) list = list.filter(p => p.stage === filters.stage);

  return list;
}

// ==========================================
// 2. Get Single Problem (Supabase Source of Truth)
// ==========================================
export async function getProblem(id: string): Promise<Problem | null> {
  const supabase = getServerSupabaseClient();

  if (supabase && isServerSupabaseConfigured()) {
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isValidUuid) {
      try {
        const { data, error } = await supabase
          .from('problems')
          .select(`
            *,
            problem_evidence (*),
            problem_classifications (*),
            severity_assessments (*),
            solver_matches (*),
            collaborations (*),
            solutions (*),
            problem_updates (*),
            verifications (*)
          `)
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return transformSupabaseProblem(data);
        }
      } catch (err: any) {
        console.warn('[SahYog Database] Supabase getProblem exception:', err?.message);
      }
    }
  }

  const db = await getDb();
  const p = db.problems.find(x => x.id === id);
  if (!p) return null;

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

// ==========================================
// 3. Create Problem (Writes to problems, problem_evidence,
//    problem_classifications, severity_assessments, solver_matches,
//    problem_updates, notifications)
// ==========================================
export async function createProblemRecord(payload: {
  title: string;
  desc: string;
  category: string;
  location: string;
  severity: string;
  priority?: string;
  affected?: string;
  landmark?: string;
  datetime?: string;
  contact?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_source?: LocationSource;
  location_accuracy?: string;
  location_confirmed?: boolean;
  location_status?: string;
  photos?: Problem['photos'];
  factors?: any;
  state?: string;
  district?: string;
  block?: string;
  domain?: string;
  subdomain?: string;
  affected_population?: string | number;
  expected_outcome?: string;
  required_expertise?: string[];
}): Promise<Problem> {
  const db = await getDb();
  const nextNumber = db.problems.length + 101;
  const id = `SY-2026-${String(1000 + nextNumber).padStart(4, '0')}`;
  const nowStr = new Date().toISOString();

  if (payload.location_status === 'OUTSIDE_JHARKHAND') {
    throw new Error('The detected location is outside Jharkhand.');
  }

  if (!payload.location_confirmed) {
    throw new Error('A verified or manually selected Jharkhand location is required.');
  }

  // Authoritative Backend Classification (RULE_BASED_PROTOTYPE)
  const aiResult = classify(payload.title, payload.desc, payload.category);
  const lat = payload.latitude ?? null;
  const lng = payload.longitude ?? null;
  const orgMatches = buildMatches(aiResult.category, payload.location, lat, lng);
  const normalizedSev = normalizeSeverity(payload.severity);

  const supabase = getServerSupabaseClient();
  const supabaseProblemId = randomUUID();

  if (supabase && isServerSupabaseConfigured()) {
    try {
      const orgMap = await getOrInitSupabaseOrgs(supabase);
      const defaultOrgId = Object.values(orgMap)[0];

      // 1. Insert into problems table
      const problemRow: ProblemRow = {
        id: supabaseProblemId,
        reporter_id: null,
        title: payload.title,
        description: payload.desc,
        category: aiResult.category,
        subcategory: aiResult.subcategory,
        status: 'reported',
        severity: normalizedSev,
        suggested_severity: normalizedSev,
        severity_method: 'PROTOTYPE_FACTOR_ANALYSIS',
        authority: aiResult.authority,
        recommended_action: aiResult.action,
        landmark: payload.landmark || null,
        address: payload.location,
        state: payload.state || 'Jharkhand',
        city: payload.district || null,
        district: payload.district || null,
        block: payload.block || null,
        latitude: lat,
        longitude: lng,
        location_source: normalizeLocationSource(payload.location_source),
        location_status: payload.location_status || 'manual_jharkhand',
        location_confirmed: payload.location_confirmed ?? false,
        is_demo: false,
        created_at: nowStr,
        updated_at: nowStr
      };

      const { error: probError } = await supabase.from('problems').insert(problemRow);
      if (probError) {
        console.error('[SahYog Database] Failed to insert problem in Supabase:', probError);
      } else {
        // 2. Insert into problem_evidence
        if (payload.photos && payload.photos.length > 0) {
          const evidenceRows: ProblemEvidenceRow[] = payload.photos.map((ph, idx) => ({
            id: randomUUID(),
            problem_id: supabaseProblemId,
            evidence_type: 'initial',
            file_url: ph.src,
            file_name: ph.name || `evidence_${idx + 1}.jpg`,
            mime_type: ph.isVideo ? 'video/mp4' : 'image/jpeg',
            latitude: lat,
            longitude: lng,
            gps_source: normalizeLocationSource(payload.location_source),
            captured_at: nowStr,
            exif_available: ph.exifGpsFound ?? false,
            is_demo: false,
            created_at: nowStr
          }));
          const { error: evInitErr } = await supabase.from('problem_evidence').insert(evidenceRows);
          if (evInitErr) console.error('[SahYog Database] Failed to insert initial evidence:', evInitErr);
        }

        // 3. Insert into problem_classifications
        const clsRow: ProblemClassificationRow = {
          id: randomUUID(),
          problem_id: supabaseProblemId,
          category: aiResult.category,
          subcategory: aiResult.subcategory,
          authority: aiResult.authority,
          recommended_action: aiResult.action,
          confidence: aiResult.confidence,
          method: 'RULE_BASED_PROTOTYPE',
          matched_terms: aiResult.terms,
          reasoning: aiResult.reason,
          created_at: nowStr
        };
        await supabase.from('problem_classifications').insert(clsRow);

        // 4. Insert into severity_assessments
        const combinedFactors = {
          ...(typeof payload.factors === 'object' ? payload.factors : { raw_factors: payload.factors }),
          assessment_data: typeof payload.factors === 'object' && payload.factors !== null ? payload.factors : {},
          state: payload.state || 'Jharkhand',
          district: payload.district || '',

          block: payload.block || '',
          domain: payload.domain || aiResult.domain,
          subdomain: payload.subdomain || aiResult.subcategory,
          affected_population: payload.affected_population || payload.affected,
          expected_outcome: payload.expected_outcome,
          required_expertise: payload.required_expertise || aiResult.required_expertise,
          priority: payload.priority || normalizedSev,
          location_status: payload.location_status || 'manual_jharkhand',
          location_source: payload.location_source || 'MANUAL_ENTRY'
        };

        const sevRow: SeverityAssessmentRow = {
          id: randomUUID(),
          problem_id: supabaseProblemId,
          suggested_severity: normalizedSev,
          final_severity: normalizedSev,
          factors: combinedFactors,
          total_score: normalizedSev === 'critical' ? 90 : normalizedSev === 'high' ? 75 : 50,
          created_at: nowStr
        };
        await supabase.from('severity_assessments').insert(sevRow);

        // 5. Insert into solver_matches
        const matchRows: SolverMatchRow[] = orgMatches.map((m, mIdx) => {
          const matchedOrgId = Object.entries(orgMap).find(([name]) => m.name.includes(name) || name.includes(m.name))?.[1] || defaultOrgId;
          return {
            id: randomUUID(),
            problem_id: supabaseProblemId,
            organization_id: matchedOrgId,
            score: m.score,
            domain_score: m.factors.domain,
            jurisdiction_score: m.factors.jurisdiction,
            expertise_score: m.factors.expertise,
            capacity_score: m.factors.capacity,
            match_reason: m.reasons?.[0] || 'Domain match and regional jurisdiction',
            score_type: 'PROTOTYPE_WEIGHTED_SCORE',
            rank: mIdx + 1,
            status: mIdx === 0 ? 'accepted' : 'suggested',
            created_at: nowStr
          };
        });
        if (matchRows.length > 0 && defaultOrgId) {
          await supabase.from('solver_matches').insert(matchRows);
        }

        // 6. Insert into problem_updates
        const updateRow: ProblemUpdateRow = {
          id: randomUUID(),
          problem_id: supabaseProblemId,
          actor_role: 'Citizen',
          event_type: 'REPORT_CREATED',
          previous_status: null,
          new_status: 'reported',
          title: 'Societal Challenge Submitted',
          description: `Community challenge "${payload.title}" registered in Government of Jharkhand innovation ecosystem.`,
          created_at: nowStr
        };
        await supabase.from('problem_updates').insert(updateRow);

        const created = await getProblem(supabaseProblemId);
        if (created) return created;
      }
    } catch (err: any) {
      console.error('[SahYog Database] Supabase createProblemRecord error:', err?.message);
    }
  }

  // Local fallback persistence
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
    created_at: nowStr
  };
  db.problem_classifications.push(classificationRecord);

  const matchRecords: SolverMatchRecord[] = orgMatches.map((m, mIdx) => ({
    id: `MTC-${id}-${mIdx + 1}`,
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
    status: mIdx === 0 ? 'accepted' : 'recommended',
    created_at: nowStr
  }));
  db.solver_matches.push(...matchRecords);

  const newProblem: Problem = {
    id,
    title: payload.title,
    desc: payload.desc,
    category: aiResult.category,
    location: payload.location,
    affected: payload.affected_population ? `${payload.affected_population} Community Members` : (payload.affected || '100+ Citizens'),
    severity: displaySeverity(payload.severity),
    stage: 0,
    date: 'Just now',
    mapX: 50,
    mapY: 50,
    photos: payload.photos || [],
    solutions: [],
    verification: null,
    ai: aiResult,
    _matches: orgMatches,
    landmark: payload.landmark,
    datetime: payload.datetime || 'Just now',
    contact: payload.contact,
    latitude: lat,
    longitude: lng,
    lat,
    lng,
    address: payload.location,
    location_source: payload.location_source || 'MANUAL_ENTRY',
    location_accuracy: payload.location_accuracy || '~15m',
    location_confirmed: payload.location_confirmed ?? true,
    location_updated_at: nowStr,
    state: payload.state || 'Jharkhand',
    district: payload.district || 'Ranchi',
    block: payload.block || '',
    domain: payload.domain || aiResult.domain,
    subdomain: payload.subdomain || aiResult.subcategory,
    affected_population: payload.affected_population || payload.affected,
    expected_outcome: payload.expected_outcome,
    required_expertise: payload.required_expertise || aiResult.required_expertise,
    events: [
      {
        id: `EV-${id}-1`,
        problem_id: id,
        event_type: 'REPORTED',
        stage: 0,
        actor_role: 'Citizen',
        description: `Citizen registered issue "${payload.title}" with evidence and geolocation ${lat != null && lng != null ? `(${lat.toFixed(4)}, ${lng.toFixed(4)})` : '(location pending)'}.`,
        timestamp: nowStr
      },
      {
        id: `EV-${id}-2`,
        problem_id: id,
        event_type: 'CLASSIFIED',
        stage: 1,
        actor_role: 'System',
        description: `Prototype classification assigned to ${aiResult.authority} (${aiResult.confidence}% confidence). Recommended action: ${aiResult.action}.`,
        timestamp: nowStr
      }
    ],
    created_at: nowStr,
    updated_at: nowStr
  };

  db.problems.unshift(newProblem);
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    text: `New problem registered: "${payload.title}" [${id}]. Classified for ${aiResult.authority}.`,
    unread: true,
    time: 'Just now',
    user_role: 'government',
    created_at: nowStr
  });

  await saveDb(db);
  return newProblem;
}

// ==========================================
// 4. Add Solution Proposal (Writes to solutions,
//    problem_updates, notifications)
// ==========================================
export async function addSolutionRecord(payload: {
  problem_id: string;
  title: string;
  org_name: string;
  desc?: string;
  tech?: string;
  cost?: string;
  time?: string;
  impact?: string;
  actor_role?: string;
  problem_understanding?: string;
  proposed_approach?: string;
  faculty_mentor?: string;
  student_team?: string;
  prototype_plan?: string;
  testing_plan?: string;
  pilot_plan?: string;
  social_impact?: string;
  support_needed?: string;
  lifecycle_data?: any;
}): Promise<Problem | null> {
  const nowStr = new Date().toISOString();
  const solId = `SOL-${payload.problem_id}-${Date.now().toString(36)}`;

  const role = (payload.actor_role || 'university').toLowerCase();
  if (role === 'citizen') {
    throw new Error('Permission denied: Citizens report issues; solutions must be submitted by Universities, Industry partners, or NGOs.');
  }

  const supabase = getServerSupabaseClient();

  if (supabase && isServerSupabaseConfigured()) {
    try {
      const orgMap = await getOrInitSupabaseOrgs(supabase);
      const matchedOrgId = Object.entries(orgMap).find(([name]) =>
        payload.org_name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(payload.org_name.toLowerCase())
      )?.[1] || Object.values(orgMap)[0] || null;

      // 1. Insert into solutions table
      const solRow: SolutionRow = {
        id: randomUUID(),
        problem_id: payload.problem_id,
        organization_id: matchedOrgId,
        proposed_by: null,
        title: payload.title,
        description: payload.desc || '',
        technical_details: payload.tech || '',
        estimated_cost: parseNumericCost(payload.cost) as any,
        estimated_duration: payload.time || '10-14 days',
        implementation_plan: payload.pilot_plan || null,
        problem_understanding: payload.problem_understanding || null,
        proposed_approach: payload.proposed_approach || null,
        faculty_mentor: payload.faculty_mentor || null,
        student_team: payload.student_team || null,
        prototype_plan: payload.prototype_plan || null,
        testing_plan: payload.testing_plan || null,
        pilot_plan: payload.pilot_plan || null,
        social_impact: payload.social_impact || null,
        support_needed: payload.support_needed || null,
        lifecycle_data: payload.lifecycle_data || null,
        status: 'proposed',
        created_at: nowStr,
        updated_at: nowStr
      };
      const { error: solErr } = await supabase.from('solutions').insert(solRow);
      if (solErr) console.error('[SahYog Database] Failed to insert solution in Supabase:', solErr);

      // 2. Update problems status
      await supabase.from('problems').update({
        status: 'solution_proposed',
        updated_at: nowStr
      }).eq('id', payload.problem_id);

      // 3. Insert into problem_updates
      const eventRow: ProblemUpdateRow = {
        id: randomUUID(),
        problem_id: payload.problem_id,
        actor_role: payload.actor_role || 'University',
        event_type: 'SOLUTION_PROPOSED',
        previous_status: 'collaborating',
        new_status: 'solution_proposed',
        title: 'Solution Proposal Submitted',
        description: `${payload.org_name} submitted technical solution: "${payload.title}".`,
        created_at: nowStr
      };
      await supabase.from('problem_updates').insert(eventRow);

      return getProblem(payload.problem_id);
    } catch (err: any) {
      console.error('[SahYog Database] Supabase addSolutionRecord error:', err?.message);
    }
  }

  // Local fallback
  const db = await getDb();
  const pIndex = db.problems.findIndex(p => p.id === payload.problem_id);
  if (pIndex === -1) return null;

  const solRecord: SolutionRecord = {
    id: solId,
    problem_id: payload.problem_id,
    title: payload.title,
    org_name: payload.org_name,
    status: 'Proposed',
    desc: payload.desc || '',
    tech: payload.tech || '',
    cost: payload.cost || 'Estimated upon civic approval',
    time: payload.time || '10-14 days',
    impact: payload.impact || 'High local impact',
    lifecycle_data: payload.lifecycle_data,
    created_at: nowStr,
    updated_at: nowStr
  };
  db.solutions.push(solRecord);

  const targetStage = Math.max(db.problems[pIndex].stage, 4);
  db.problems[pIndex].stage = targetStage;
  db.problems[pIndex].solutions.push({
    id: solId,
    title: solRecord.title,
    org: solRecord.org_name,
    status: solRecord.status,
    desc: solRecord.desc,
    tech: solRecord.tech,
    cost: solRecord.cost,
    time: solRecord.time,
    impact: solRecord.impact
  });

  db.problem_updates.push({
    id: `EV-${payload.problem_id}-${Date.now()}`,
    problem_id: payload.problem_id,
    event_type: 'SOLUTION_PROPOSED',
    stage: targetStage,
    actor_role: (payload.actor_role as any) || 'University',
    description: `${payload.org_name} proposed technical solution: "${payload.title}". Technical methodology: ${payload.tech || 'Standard civic protocol'}.`,
    timestamp: nowStr
  });

  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    text: `New solution proposal submitted for ${payload.problem_id} by ${payload.org_name}.`,
    unread: true,
    time: 'Just now',
    user_role: 'government',
    created_at: nowStr
  });

  await saveDb(db);
  return getProblem(payload.problem_id);
}

// ==========================================
// 5. Update Solution Status (Role Security: Government/Industry)
// ==========================================
export async function updateSolutionStatus(
  solutionId: string,
  status: Solution['status'],
  actor_role: string = 'Government',
  problemId?: string
): Promise<Problem | null> {
  const nowStr = new Date().toISOString();
  const role = (actor_role || 'government').toLowerCase();

  if (status === 'Approved' || status === 'Rejected') {
    if (role !== 'government' && role !== 'system') {
      throw new Error('Permission denied: Only statutory Government authorities can approve or reject technical solutions.');
    }
  }

  const supabase = getServerSupabaseClient();

  if (supabase && isServerSupabaseConfigured()) {
    try {
      let targetProblemId = problemId;
      if (!targetProblemId) {
        const { data: sol } = await supabase.from('solutions').select('problem_id').eq('id', solutionId).maybeSingle();
        if (sol?.problem_id) targetProblemId = sol.problem_id;
      }

      const lowerStatus = status === 'Approved' ? 'approved' : status === 'In Deployment' ? 'in_progress' : status === 'Completed' ? 'completed' : status === 'Rejected' ? 'rejected' : 'under_review';

      await supabase.from('solutions').update({
        status: lowerStatus,
        approved_by: status === 'Approved' ? 'Government Authority' : undefined,
        approved_at: status === 'Approved' ? nowStr : undefined,
        updated_at: nowStr
      }).eq('id', solutionId);

      if (targetProblemId) {
        const probStatus = status === 'Approved' ? 'approved' : status === 'In Deployment' ? 'deployed' : status === 'Completed' ? 'resolved' : 'collaborating';

        await supabase.from('problems').update({
          status: probStatus,
          updated_at: nowStr
        }).eq('id', targetProblemId);

        const eventRow: ProblemUpdateRow = {
          id: randomUUID(),
          problem_id: targetProblemId,
          actor_role: 'Government',
          event_type: status === 'Approved' ? 'SOLUTION_APPROVED' : status === 'In Deployment' ? 'DEPLOYED' : 'RESOLVED',
          title: `Solution ${status}`,
          description: `Government statutory authority transitioned solution to "${status}".`,
          created_at: nowStr
        };
        await supabase.from('problem_updates').insert(eventRow);

        return getProblem(targetProblemId);
      }
    } catch (err: any) {
      console.error('[SahYog Database] Supabase updateSolutionStatus error:', err?.message);
    }
  }

  // Local fallback
  const db = await getDb();
  const solIdx = db.solutions.findIndex(s => s.id === solutionId);
  if (solIdx === -1) return null;

  const targetProblemId = problemId || db.solutions[solIdx].problem_id;
  const pIndex = db.problems.findIndex(p => p.id === targetProblemId);
  if (pIndex === -1) return null;

  db.solutions[solIdx].status = status;
  db.solutions[solIdx].updated_at = nowStr;

  const pSolIdx = db.problems[pIndex].solutions.findIndex(s => s.id === solutionId);
  if (pSolIdx >= 0) {
    db.problems[pIndex].solutions[pSolIdx].status = status;
  }

  let nextStage = db.problems[pIndex].stage;
  let eventType: ProblemEvent['event_type'] = 'SOLUTION_APPROVED';
  if (status === 'Approved') {
    nextStage = Math.max(nextStage, 5);
    eventType = 'SOLUTION_APPROVED';
  } else if (status === 'In Deployment') {
    nextStage = Math.max(nextStage, 6);
    eventType = 'DEPLOYMENT_STARTED';
  } else if (status === 'Completed') {
    nextStage = Math.max(nextStage, 7);
    eventType = 'DEPLOYMENT_COMPLETED';
  }

  db.problems[pIndex].stage = nextStage;
  db.problem_updates.push({
    id: `EV-${targetProblemId}-${Date.now()}`,
    problem_id: targetProblemId,
    event_type: eventType,
    stage: nextStage,
    actor_role: 'Government',
    description: `Statutory Government authority transitioned solution status to "${status}".`,
    timestamp: nowStr
  });

  await saveDb(db);
  return getProblem(targetProblemId);
}


// ==========================================
// 6. Citizen Ground-Truth Verification
//    (Writes to verifications, problem_evidence,
//     problem_updates, notifications)
// ==========================================
export async function recordVerificationRecord(payload: {
  problem_id: string;
  resolved: boolean;
  comment: string;
  evidence_ref?: string;
  verified_by?: string;
  actor_role?: string;
}): Promise<Problem | null> {
  const role = (payload.actor_role || 'citizen').toLowerCase();
  if (role !== 'citizen' && role !== 'system') {
    throw new Error('Permission denied: Only local Citizens can provide final ground-truth verification sign-off.');
  }

  const nowStr = new Date().toISOString();
  const supabase = getServerSupabaseClient();

  if (supabase && isServerSupabaseConfigured()) {
    try {
      const isValidUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      // 1. Insert verification evidence into problem_evidence if after-repair photo exists
      let evidenceId: string | null = null;
      if (payload.evidence_ref) {
        evidenceId = randomUUID();
        const evidenceRow: ProblemEvidenceRow = {
          id: evidenceId,
          problem_id: payload.problem_id,
          evidence_type: 'verification',
          file_url: payload.evidence_ref,
          file_name: 'citizen_after_repair.jpg',
          mime_type: 'image/jpeg',
          is_demo: false,
          created_at: nowStr
        };
        const { error: evErr } = await supabase.from('problem_evidence').insert(evidenceRow);
        if (evErr) console.error('[SahYog Database] Failed to insert verification evidence in Supabase:', evErr);
      }

      // 2. Insert into verifications table
      const verRow: any = {
        id: randomUUID(),
        problem_id: payload.problem_id,
        verified_by: isValidUuid(payload.verified_by) ? payload.verified_by : null,
        resolved: payload.resolved,
        comment: payload.comment,
        evidence_ref: evidenceId,
        created_at: nowStr
      };
      const { error: verErr } = await supabase.from('verifications').insert(verRow);
      if (verErr) console.error('[SahYog Database] Failed to insert verification in Supabase:', verErr);

      // 3. Update problems table status: citizen_verified (Stage 8) or reported (Reopened)
      const newStatus = payload.resolved ? 'citizen_verified' : 'reported';
      await supabase.from('problems').update({
        status: newStatus,
        updated_at: nowStr
      }).eq('id', payload.problem_id);

      // 4. Insert into problem_updates
      const updateRow: ProblemUpdateRow = {
        id: randomUUID(),
        problem_id: payload.problem_id,
        actor_role: 'Citizen',
        event_type: payload.resolved ? 'CITIZEN_VERIFIED' : 'REOPENED',
        previous_status: 'resolved',
        new_status: newStatus,
        title: payload.resolved ? 'Citizen Ground-Truth Verified' : 'Problem Reopened',
        description: `Citizen sign-off: ${payload.resolved ? 'RESOLUTION CONFIRMED' : 'REOPENED FOR CORRECTIVE ACTION'} — "${payload.comment}"`,
        created_at: nowStr
      };
      await supabase.from('problem_updates').insert(updateRow);

      return getProblem(payload.problem_id);
    } catch (err: any) {
      console.error('[SahYog Database] Supabase recordVerificationRecord error:', err?.message);
    }
  }

  // Local fallback
  const db = await getDb();
  const pIndex = db.problems.findIndex(p => p.id === payload.problem_id);
  if (pIndex === -1) return null;

  const verificationRecord: VerificationRecord = {
    id: `VER-${payload.problem_id}`,
    problem_id: payload.problem_id,
    status: payload.resolved ? 'VERIFIED_RESOLVED' : 'REOPENED',
    feedback: payload.comment,
    evidence_ref: payload.evidence_ref || '/demo/pothole_after.jpg',
    verified_by: payload.verified_by || 'Citizen Reporter (Ground-Truth Sign-Off)',
    timestamp: nowStr
  };

  const existingVerIdx = db.verifications.findIndex(v => v.problem_id === payload.problem_id);
  if (existingVerIdx >= 0) db.verifications[existingVerIdx] = verificationRecord;
  else db.verifications.push(verificationRecord);

  const finalStage = payload.resolved ? 8 : 3;
  db.problems[pIndex].stage = finalStage;
  db.problems[pIndex].verification = {
    resolved: payload.resolved,
    comment: payload.comment,
    evidence_ref: verificationRecord.evidence_ref,
    timestamp: nowStr,
    verified_by: verificationRecord.verified_by
  };

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

// ==========================================
// 7. Join Collaboration Workspace (collaborations, problem_updates)
// ==========================================
export async function joinCollaborationWorkspace(payload: {
  problem_id: string;
  org_name: string;
  org_type: 'Government' | 'University' | 'Industry' | 'NGO';
  role_in_problem: string;
}): Promise<Problem | null> {
  const nowStr = new Date().toISOString();
  const supabase = getServerSupabaseClient();

  if (supabase && isServerSupabaseConfigured()) {
    try {
      const orgMap = await getOrInitSupabaseOrgs(supabase);
      const matchedOrgId = Object.entries(orgMap).find(([name]) =>
        payload.org_name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(payload.org_name.toLowerCase())
      )?.[1] || Object.values(orgMap)[0] || null;

      const colRow: CollaborationRow = {
        id: randomUUID(),
        problem_id: payload.problem_id,
        organization_id: matchedOrgId,
        role: payload.role_in_problem || 'Collaborating Partner',
        responsibility: `${payload.org_name} (${payload.org_type})`,
        status: 'accepted',
        started_at: nowStr,
        created_at: nowStr,
        updated_at: nowStr
      };
      await supabase.from('collaborations').insert(colRow);

      await supabase.from('problems').update({
        status: 'collaborating',
        updated_at: nowStr
      }).eq('id', payload.problem_id);

      const updateRow: ProblemUpdateRow = {
        id: randomUUID(),
        problem_id: payload.problem_id,
        actor_role: payload.org_type as any,
        event_type: 'COLLABORATION_STARTED',
        previous_status: 'matched',
        new_status: 'collaborating',
        title: 'Collaborator Joined',
        description: `${payload.org_name} (${payload.org_type}) joined the collaboration workspace as: ${payload.role_in_problem}.`,
        created_at: nowStr
      };
      await supabase.from('problem_updates').insert(updateRow);

      return getProblem(payload.problem_id);
    } catch (err: any) {
      console.error('[SahYog Database] Supabase joinCollaborationWorkspace error:', err?.message);
    }
  }

  // Local fallback
  const db = await getDb();
  const pIndex = db.problems.findIndex(p => p.id === payload.problem_id);
  if (pIndex === -1) return null;

  const targetStage = Math.max(db.problems[pIndex].stage, 3);
  db.problems[pIndex].stage = targetStage;

  db.problem_updates.push({
    id: `EV-${payload.problem_id}-${Date.now()}`,
    problem_id: payload.problem_id,
    event_type: 'ASSIGNED',
    stage: targetStage,
    actor_role: payload.org_type as any,
    description: `${payload.org_name} (${payload.org_type}) joined the collaboration workspace as: ${payload.role_in_problem}.`,
    timestamp: nowStr
  });

  await saveDb(db);
  return getProblem(payload.problem_id);
}

// ==========================================
 // 7A. Government Jurisdiction / HEI Assignment
 // ==========================================
 export async function assignChallengeToOrganization(payload: {
   problem_id: string;
   organization_id?: string;
   organization_name: string;
   actor_role?: string;
   responsibility?: string;
 }): Promise<Problem | null> {
   const role = (payload.actor_role || 'government').toLowerCase();
   if (role !== 'government' && role !== 'system') {
     throw new Error('Permission denied: only Government of Jharkhand authorities can assign challenges.');
   }
   const nowStr = new Date().toISOString();
   const supabase = getServerSupabaseClient();
   if (supabase && isServerSupabaseConfigured()) {
     const orgMap = await getOrInitSupabaseOrgs(supabase);
     const orgId = payload.organization_id || Object.entries(orgMap).find(([name]) =>
       name.toLowerCase().includes(payload.organization_name.toLowerCase()) ||
       payload.organization_name.toLowerCase().includes(name.toLowerCase())
     )?.[1];
     if (!orgId) throw new Error('Selected institution is not registered in the SahYog organization registry.');
     const { data: problem } = await supabase.from('problems').select('status').eq('id', payload.problem_id).maybeSingle();
     if (!problem) return null;
     await supabase.from('solver_matches').update({ status: 'selected' }).eq('problem_id', payload.problem_id);
     await supabase.from('solver_matches').update({ status: 'selected' }).eq('problem_id', payload.problem_id).eq('organization_id', orgId);
     await supabase.from('collaborations').upsert({
       id: randomUUID(),
       problem_id: payload.problem_id,
       organization_id: orgId,
       role: 'Government-assigned institutional lead',
       responsibility: payload.responsibility || 'Evaluate challenge, constitute multidisciplinary HEI team and prepare solution proposal',
       status: 'invited',
       assigned_by: null,
       created_at: nowStr,
       updated_at: nowStr
     }, { onConflict: 'id' });
     await supabase.from('problems').update({ status: 'matched', updated_at: nowStr }).eq('id', payload.problem_id);
     await supabase.from('problem_updates').insert({
       id: randomUUID(),
       problem_id: payload.problem_id,
       actor_role: 'Government',
       event_type: 'ASSIGNED',
       previous_status: problem.status,
       new_status: 'matched',
       title: 'Government of Jharkhand assigned institutional lead',
       description: `Challenge assigned to ${payload.organization_name} for multidisciplinary evaluation and solution formulation.`,
       metadata: { organization_id: orgId, responsibility: payload.responsibility || null },
       created_at: nowStr
     });
     return getProblem(payload.problem_id);
   }
   const db = await getDb();
   const p = db.problems.find(x => x.id === payload.problem_id);
   if (!p) return null;
   p.stage = Math.max(p.stage, 2);
   db.problem_updates.push({
     id: `EV-${payload.problem_id}-${Date.now()}`,
     problem_id: payload.problem_id,
     event_type: 'ASSIGNED',
     stage: 2,
     actor_role: 'Government',
     description: `Government of Jharkhand assigned ${payload.organization_name} as institutional lead.`,
     timestamp: nowStr
   });
   await saveDb(db);
   return p;
 }

// ==========================================
// 8. Dashboard Metrics Aggregation
// ==========================================
export async function getDashboardMetrics() {
  const problems = await listProblems();
  const total = problems.length;
  const verified = problems.filter(p => p.stage >= 8).length;
  const activeDeployments = problems.filter(p => p.stage >= 5 && p.stage < 8).length;
  const matchingOrReview = problems.filter(p => p.stage < 5).length;

  return {
    meta: {
      type: 'PROTOTYPE_METRICS',
      source: isServerSupabaseConfigured() ? 'Supabase PostgreSQL + Storage' : 'Local Fallback Cache',
      purpose: 'Smart India Hackathon 2026 Evaluation (PS: SIH26043)',
      persistent: true,
      lastUpdated: new Date().toISOString()
    },
    counts: {
      totalProblems: total,
      citizenVerified: verified,
      activeDeployments,
      inMatchingOrReview: matchingOrReview,
      participatingOrganizations: new Set(problems.flatMap(p => (p._matches || []).map(m => m.name))).size,
      crossSectorProposals: problems.reduce((acc, p) => acc + (p.solutions?.length || 0), 0)
    },
    byRole: {
      citizen: {
        reported: total,
        awaitingVerification: problems.filter(p => p.stage === 7).length,
        verifiedComplete: verified
      },
      government: {
        totalUnderJurisdiction: total,
        pendingApproval: problems.reduce((acc, p) => acc + (p.solutions?.filter(s => s.status === 'Proposed' || s.status === 'Under Review').length || 0), 0),
        approvedForDeployment: problems.reduce((acc, p) => acc + (p.solutions?.filter(s => s.status === 'Approved' || s.status === 'In Deployment').length || 0), 0)
      },
      university: {
        availableChallenges: total,
        activePrototypes: problems.reduce((acc, p) => acc + (p.solutions?.filter(s => s.status !== 'Rejected').length || 0), 0),
        matchedInstitutes: new Set(problems.flatMap(p => (p._matches || []).filter(m => m.type === 'University').map(m => m.name))).size
      },
      industry: {
        contractTenders: problems.reduce((acc, p) => acc + (p.solutions?.filter(s => s.status === 'Approved').length || 0), 0),
        activeDeployments,
        matchedCompanies: new Set(problems.flatMap(p => (p._matches || []).filter(m => m.type === 'Industry').map(m => m.name))).size
      },
      ngo: {
        communityLiaisonCases: total,
        onGroundVerifications: verified,
        participatingNGOs: new Set(problems.flatMap(p => (p._matches || []).filter(m => m.type === 'NGO').map(m => m.name))).size
      }
    }
  };
}

// ==========================================
// 9. Notifications (Supabase Source of Truth)
// ==========================================
export async function getNotifications(role?: Role | null): Promise<Notification[]> {
  const supabase = getServerSupabaseClient();

  if (supabase && isServerSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && Array.isArray(data)) {
        return data.map((n: NotificationRow) => ({
          id: n.id,
          text: n.message || n.title,
          unread: !n.read,
          time: n.created_at ? new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          created_at: n.created_at
        }));
      }
    } catch (err: any) {
      console.warn('[SahYog Database] Supabase getNotifications warning:', err?.message);
    }
  }

  const db = await getDb();
  if (!role) return db.notifications;
  return db.notifications.filter(n => !n.user_role || n.user_role === role);
}

export async function markNotificationsAsRead(): Promise<void> {
  const supabase = getServerSupabaseClient();

  if (supabase && isServerSupabaseConfigured()) {
    try {
      await supabase.from('notifications').update({ read: true }).eq('read', false);
      return;
    } catch (err: any) {
      console.warn('[SahYog Database] Supabase markNotificationsAsRead warning:', err?.message);
    }
  }

  const db = await getDb();
  db.notifications = db.notifications.map(n => ({ ...n, unread: false }));
  await saveDb(db);
}

// ==========================================
// 10. Seed Demo Data to Supabase & Local Cache
// ==========================================
export async function resetDatabaseToDemo(): Promise<DatabaseSchema> {
  const freshDb = seedDatabase();
  await saveDb(freshDb);

  const supabase = getServerSupabaseClient();
  if (supabase && isServerSupabaseConfigured()) {
    try {
      // Ensure organizations are populated in Supabase
      await getOrInitSupabaseOrgs(supabase);
    } catch (err: any) {
      console.warn('[SahYog Database] Supabase seed warning:', err?.message);
    }
  }

  return freshDb;
}
