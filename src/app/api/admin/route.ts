import { NextResponse } from 'next/server';
import { getAdminSupabaseClient, requireAdmin } from '@/lib/server/adminAuth';

const VALID_STATUSES = new Set(['reported','verified','matched','collaborating','solution_proposed','approved','deployed','resolved','citizen_verified','rejected']);

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  const supabase = getAdminSupabaseClient();
  if (!supabase) return NextResponse.json({ success: false, error: 'Supabase admin client is not configured.' }, { status: 503 });
  const [problemsRes, orgsRes, profilesRes, solutionsRes] = await Promise.all([
    supabase.from('problems').select('id,title,category,subcategory,status,severity,suggested_severity,state,district,block,address,latitude,longitude,location_status,location_confirmed,reporter_id,created_at,updated_at').order('created_at', { ascending: false }),
    supabase.from('organizations').select('id,name,type,expertise,capabilities,jurisdiction,capacity').order('name'),
    supabase.from('profiles').select('id,full_name,email,role,organization_id,created_at').order('created_at', { ascending: false }),
    supabase.from('solutions').select('id,problem_id,title,org_name,status,organization_id,created_at,updated_at').order('created_at', { ascending: false })
  ]);
  if (problemsRes.error) return NextResponse.json({ success: false, error: problemsRes.error.message }, { status: 500 });
  const problems = problemsRes.data || [];
  const solutions = solutionsRes.data || [];
  const organizations = orgsRes.data || [];
  const profiles = profilesRes.data || [];
  const by = (key: string) => problems.reduce<Record<string, number>>((acc, p: any) => { const value = p[key] || 'Unknown'; acc[value] = (acc[value] || 0) + 1; return acc; }, {});
  return NextResponse.json({ success: true, data: {
    admin: auth.profile,
    summary: {
      totalChallenges: problems.length,
      pendingReview: problems.filter((p: any) => p.status === 'reported').length,
      activeProjects: problems.filter((p: any) => ['matched','collaborating','solution_proposed','approved','deployed'].includes(p.status)).length,
      resolved: problems.filter((p: any) => ['resolved','citizen_verified'].includes(p.status)).length,
      universities: organizations.filter((o: any) => String(o.type).toLowerCase() === 'university').length,
      industryPartners: organizations.filter((o: any) => ['industry','startup','msme','csr'].includes(String(o.type).toLowerCase())).length,
      solutions: solutions.length
    },
    status: by('status'), domain: by('category'), district: by('district'), problems, organizations, profiles, solutions
  }});
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  const supabase = getAdminSupabaseClient();
  if (!supabase) return NextResponse.json({ success: false, error: 'Supabase admin client is not configured.' }, { status: 503 });
  const body = await request.json();
  const problemId = String(body.problem_id || '');
  const status = String(body.status || '');
  const severity = body.severity ? String(body.severity) : '';
  if (!problemId) return NextResponse.json({ success: false, error: 'problem_id is required.' }, { status: 400 });
  if (status && !VALID_STATUSES.has(status)) return NextResponse.json({ success: false, error: 'Invalid problem status.' }, { status: 400 });
  const updates: Record<string, string> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (severity) updates.severity = severity;
  const { data, error } = await supabase.from('problems').update(updates).eq('id', problemId).select('id,title,status,severity,updated_at').single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  await supabase.from('problem_updates').insert({ problem_id: problemId, actor_id: auth.userId, actor_role: 'admin', event_type: 'ADMIN_STATUS_UPDATE', new_status: status || null, title: 'Government Control Center update', description: 'Admin updated challenge workflow.', metadata: { severity: severity || null } });
  return NextResponse.json({ success: true, data });
}