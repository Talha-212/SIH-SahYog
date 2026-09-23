// Supabase Database Entity Definitions for SahYog Platform (PS: SIH26043)
// 12 Authoritative Tables matching the existing Supabase Schema

export type UserRole = 'citizen' | 'government' | 'university' | 'industry' | 'ngo' | 'admin';

export type ProblemStatus =
  | 'reported'
  | 'verified'
  | 'matched'
  | 'collaborating'
  | 'solution_proposed'
  | 'approved'
  | 'deployed'
  | 'resolved'
  | 'citizen_verified'
  | 'rejected';

export type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical';

export type LocationSourceType = 'exif' | 'device_gps' | 'map' | 'manual' | 'demo';

export type EvidenceType = 'initial' | 'additional' | 'verification';

export type CollaborationStatus = 'invited' | 'accepted' | 'in_progress' | 'completed' | 'declined';

export type SolutionStatus = 'proposed' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'completed';

export type SolverMatchStatus = 'suggested' | 'selected' | 'accepted' | 'rejected' | 'completed';

// 1. profiles (linked to auth.users.id)
export interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  organization_id?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 2. organizations
export interface OrganizationRow {
  id: string;
  name: string;
  type: 'Government' | 'University' | 'Industry' | 'NGO' | string;
  description?: string | null;
  expertise?: string | null;
  capabilities?: string | null;
  jurisdiction?: string | null;
  capacity?: number | string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  is_demo?: boolean;
  created_at?: string;
}

// 3. problems
export interface ProblemRow {
  id: string;
  reporter_id?: string | null;
  title: string;
  description: string;
  category: string;
  subcategory?: string | null;
  status: ProblemStatus | string;
  severity: SeverityLevel | string;
  suggested_severity?: string | null;
  severity_method?: string | null;
  authority?: string | null;
  recommended_action?: string | null;
  landmark?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_source?: LocationSourceType | string | null;
  location_confirmed?: boolean;
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 4. problem_evidence
export interface ProblemEvidenceRow {
  id: string;
  problem_id: string;
  uploaded_by?: string | null;
  evidence_type: EvidenceType | string;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  gps_source?: string | null;
  captured_at?: string | null;
  exif_available?: boolean;
  is_demo?: boolean;
  created_at?: string;
}

// 5. problem_classifications
export interface ProblemClassificationRow {
  id: string;
  problem_id: string;
  category: string;
  subcategory?: string | null;
  authority?: string | null;
  recommended_action?: string | null;
  confidence?: number | null;
  method: string;
  matched_terms?: string[] | null;
  reasoning?: string | null;
  created_at?: string;
}

// 6. severity_assessments
export interface SeverityAssessmentRow {
  id: string;
  problem_id: string;
  suggested_severity: string;
  final_severity: string;
  factors?: Record<string, any> | null;
  total_score?: number | null;
  created_at?: string;
}

// 7. solver_matches
export interface SolverMatchRow {
  id: string;
  problem_id: string;
  organization_id?: string | null;
  score: number;
  domain_score?: number | null;
  jurisdiction_score?: number | null;
  expertise_score?: number | null;
  capacity_score?: number | null;
  match_reason?: string | null;
  score_type: string;
  rank?: number | null;
  status: SolverMatchStatus | string;
  created_at?: string;
}

// 8. collaborations
export interface CollaborationRow {
  id: string;
  problem_id: string;
  organization_id?: string | null;
  role?: string | null;
  responsibility?: string | null;
  status: CollaborationStatus | string;
  assigned_by?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 9. solutions
export interface SolutionRow {
  id: string;
  problem_id: string;
  proposed_by?: string | null;
  organization_id?: string | null;
  title: string;
  description: string;
  estimated_cost?: string | null;
  estimated_duration?: string | null;
  technical_details?: string | null;
  implementation_plan?: string | null;
  problem_understanding?: string | null;
  proposed_approach?: string | null;
  faculty_mentor?: string | null;
  student_team?: string | null;
  prototype_plan?: string | null;
  testing_plan?: string | null;
  pilot_plan?: string | null;
  social_impact?: string | null;
  support_needed?: string | null;
  lifecycle_data?: Record<string, any> | null;
  status: SolutionStatus | string;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 10. problem_updates
export interface ProblemUpdateRow {
  id: string;
  problem_id: string;
  actor_id?: string | null;
  actor_role?: string | null;
  event_type: string;
  previous_status?: string | null;
  new_status?: string | null;
  title?: string | null;
  description: string;
  metadata?: Record<string, any> | null;
  created_at?: string;
}

// 11. verifications
export interface VerificationRow {
  id: string;
  problem_id: string;
  verified_by: string;
  resolved: boolean;
  comment?: string | null;
  evidence_ref?: string | null;
  created_at?: string;
}

// 12. notifications
export interface NotificationRow {
  id: string;
  user_id?: string | null;
  problem_id?: string | null;
  title: string;
  message: string;
  notification_type?: string | null;
  read: boolean;
  created_at?: string;
}
