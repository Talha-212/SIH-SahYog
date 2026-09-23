import { NextResponse } from 'next/server';
import { assignChallengeToOrganization } from '@/lib/server/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.problem_id || !body.organization_name) {
      return NextResponse.json({ success: false, error: 'problem_id and organization_name are required' }, { status: 400 });
    }
    const actorRole = request.headers.get('x-user-role') || body.actor_role || 'government';
    const data = await assignChallengeToOrganization({
      problem_id: body.problem_id,
      organization_id: body.organization_id,
      organization_name: body.organization_name,
      responsibility: body.responsibility,
      actor_role: actorRole
    });
    if (!data) return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Government assignment recorded', data });
  } catch (error: any) {
    const forbidden = String(error?.message || '').toLowerCase().includes('permission denied');
    return NextResponse.json({ success: false, error: error?.message || 'Failed to assign challenge' }, { status: forbidden ? 403 : 500 });
  }
}
