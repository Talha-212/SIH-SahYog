import { createClient, SupabaseClient } from '@supabase/supabase-js';

export async function requireAdmin(request: Request): Promise<
  | { ok: true; userId: string; profile: { id: string; full_name: string; email: string; role: string } }
  | { ok: false; status: number; error: string }
> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey || url.includes('your-project')) return { ok: false, status: 503, error: 'Supabase server authentication is not configured.' };
  if (!token) return { ok: false, status: 401, error: 'Authentication required.' };
  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return { ok: false, status: 401, error: 'Invalid or expired session.' };
  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error: profileError } = await adminClient.from('profiles').select('id, full_name, email, role').eq('id', userData.user.id).maybeSingle();
  if (profileError || !profile) return { ok: false, status: 403, error: 'SahYog profile not found.' };
  if (profile.role !== 'admin') return { ok: false, status: 403, error: 'Admin access required.' };
  return { ok: true, userId: userData.user.id, profile };
}

export function getAdminSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes('your-project')) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}