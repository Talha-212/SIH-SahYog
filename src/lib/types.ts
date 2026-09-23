export type LocationSource =
  | 'DEVICE_GPS'
  | 'PHOTO_EXIF'
  | 'MAP_SELECTED'
  | 'MANUAL_ENTRY'
  | 'DEMO_LOCATION';

export type LocationStatus =
  | 'UNVERIFIED'
  | 'VALID_JHARKHAND'
  | 'OUTSIDE_JHARKHAND'
  | 'MANUAL_JHARKHAND'
  | 'UNAVAILABLE';

export interface Photo {
  src: string;
  isVideo: boolean;
  name?: string;
  exifGpsFound?: boolean;
}

export interface MultidisciplinaryTeam {
  faculty_mentor?: string;
  faculty_dept?: string;
  student_members?: Array<{ name: string; dept: string; role?: string }>;
  external_advisor?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  desc: string;
  due: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  deliverables?: string;
  completed_at?: string;
}

export interface IndustryPartnership {
  org_name: string;
  org_type: 'Industry' | 'Startup' | 'MSME' | 'CSR';
  support_type: 'Mentorship' | 'Funding' | 'Prototyping' | 'Testing' | 'Pilot' | 'Tech Transfer';
  status: 'Under Discussion' | 'Active' | 'Delivered';
  contribution?: string;
}

export interface ImpactMetric {
  metric: string;
  before: string | number;
  after: string | number;
  unit: string;
  beneficiaries: string | number;
  validation_status: 'Preliminary' | 'Validated' | 'Audited';
}

export interface Solution {
  id: string;
  title: string;
  org: string;
  status: 'Proposed' | 'Under Review' | 'Approved' | 'In Deployment' | 'Completed' | 'Rejected';
  desc: string;
  tech: string;
  cost: string;
  time: string;
  impact: string;
  created_at?: string;
  updated_at?: string;
  // Extended societal innovation fields
  problem_understanding?: string;
  proposed_approach?: string;
  faculty_mentor?: string;
  student_team?: string;
  prototype_plan?: string;
  testing_plan?: string;
  pilot_plan?: string;
  social_impact?: string;
  support_needed?: string;
  lifecycle_data?: {
    milestones?: Array<{ title: string; due?: string; status?: string; deliverable?: string }>;
    industry_support?: Array<{ organization: string; support_type: string; status?: string; contribution?: string }>;
    impact_metrics?: Array<{ metric: string; baseline?: string; target?: string; unit?: string; validation_status?: string }>;
  };
}

export interface AIResult {
  category: string;
  subcategory: string;
  authority: string;
  reason: string;
  action: string;
  confidence: number;
  terms: string[];
  method?: 'RULE_BASED_PROTOTYPE' | 'INDIC_BERT_PIPELINE';
  // Societal innovation additions
  domain?: string;
  subdomain?: string;
  required_expertise?: string[];
}

export interface Verification {
  resolved: boolean;
  comment: string;
  evidence_ref?: string;
  timestamp?: string;
  verified_by?: string;
}

export interface MatchFactors {
  domain: number;         // e.g. 40 max
  jurisdiction: number;   // e.g. 30 max
  expertise: number;      // e.g. 20 max
  capacity: number;       // e.g. 10 max
}

export interface OrgMatch {
  name: string;
  type: 'Government' | 'University' | 'Industry' | 'NGO';
  roleInProblem: string;
  expertise: string;
  location: string;
  resources: string;
  projects: string;
  reasons: string[];
  score: number;
  score_type?: 'PROTOTYPE_WEIGHTED_SCORE';
  factors: MatchFactors;
}

export interface ProblemEvent {
  id: string;
  problem_id: string;
  event_type: 'REPORTED' | 'CLASSIFIED' | 'MATCHED' | 'ASSIGNED' | 'SOLUTION_PROPOSED' | 'SOLUTION_APPROVED' | 'DEPLOYMENT_STARTED' | 'DEPLOYMENT_COMPLETED' | 'VERIFIED' | 'REOPENED';
  stage: number;
  actor_role: 'Citizen' | 'Government' | 'University' | 'Industry' | 'NGO' | 'System';
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface Problem {
  id: string;
  title: string;
  desc: string;
  category: string;
  location: string;
  affected: number | string;
  severity: string;
  priority?: string;
  stage: number;
  date: string;
  mapX: number;
  mapY: number;
  photos: Photo[];
  solutions: Solution[];
  verification: Verification | null;
  ai?: AIResult;
  _matches?: OrgMatch[];
  landmark?: string;
  datetime?: string;
  contact?: string;

  // Structured location & administrative hierarchy (Jharkhand)
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  address?: string;
  location_source?: LocationSource;
  location_accuracy?: string;
  location_confirmed?: boolean;
  location_status?: LocationStatus;
  location_updated_at?: string;
  state?: string;
  district?: string;
  block?: string;

  // Societal Challenge & Innovation Ecosystem fields
  domain?: string;
  subdomain?: string;
  affected_population?: string | number;
  expected_outcome?: string;
  required_expertise?: string[];
  project_team?: MultidisciplinaryTeam;
  milestones?: ProjectMilestone[];
  industry_partnerships?: IndustryPartnership[];
  impact_metrics?: ImpactMetric[];

  // Lifecycle events / updates
  events?: ProblemEvent[];
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id?: string;
  text: string;
  unread: boolean;
  time?: string;
  user_role?: Role;
  link?: string;
  created_at?: string;
}

export type Role = 'citizen' | 'government' | 'university' | 'industry' | 'ngo' | 'admin' | null;

export type View = 'home' | 'explore' | 'report' | 'track' | 'detail' | 'dashboard';

export type ExploreTab = 'cards' | 'map';

// ==========================================
// Relational Database Schema Entities
// ==========================================
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'government' | 'university' | 'industry' | 'ngo';
  org_id?: string;
  avatar?: string;
  created_at: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  type: 'Government' | 'University' | 'Industry' | 'NGO';
  jurisdiction: string;
  location: string;
  expertise: string;
  resources: string;
  capacity_score: number;
  is_demo: boolean;
  created_at: string;
}

export interface ProblemClassificationRecord {
  id: string;
  problem_id: string;
  method: 'RULE_BASED_PROTOTYPE';
  category: string;
  subcategory: string;
  authority: string;
  reason: string;
  action: string;
  confidence: number;
  matched_terms: string[];
  created_at: string;
}

export interface SolverMatchRecord {
  id: string;
  problem_id: string;
  org_name: string;
  org_type: 'Government' | 'University' | 'Industry' | 'NGO';
  score: number;
  score_type: 'PROTOTYPE_WEIGHTED_SCORE';
  factor_domain: number;
  factor_jurisdiction: number;
  factor_expertise: number;
  factor_capacity: number;
  role_in_problem: string;
  status: 'recommended' | 'invited' | 'accepted';
  created_at: string;
}

export interface CollaborationRecord {
  id: string;
  problem_id: string;
  status: 'active' | 'completed';
  current_action: string;
  started_at: string;
  updated_at: string;
}

export interface SolutionRecord {
  id: string;
  problem_id: string;
  title: string;
  org_name: string;
  status: 'Proposed' | 'Under Review' | 'Approved' | 'In Deployment' | 'Completed' | 'Rejected';
  desc: string;
  tech: string;
  cost: string;
  time: string;
  impact: string;
  lifecycle_data?: any;
  created_at: string;
  updated_at: string;
}

export interface VerificationRecord {
  id: string;
  problem_id: string;
  status: 'VERIFIED_RESOLVED' | 'REOPENED';
  feedback: string;
  evidence_ref?: string;
  verified_by: string;
  timestamp: string;
}
