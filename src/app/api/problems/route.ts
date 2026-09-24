import { NextResponse } from 'next/server';
import { listProblems, createProblemRecord } from '@/lib/server/db';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const stageStr = searchParams.get('stage');
    const stage = stageStr !== null ? Number(stageStr) : undefined;

    const problems = await listProblems({ category, severity, stage });
    return NextResponse.json({
      success: true,
      count: problems.length,
      data: problems,
      _meta: {
        source: 'sahyog-backend-sqlite/json',
        evaluation: 'SIH 2026 Grand Finale (PS: SIH26043)',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch problems' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : null;
    const supabase = getServerSupabaseClient();

    if (!supabase || !token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in before submitting a societal challenge.' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Your session is invalid or expired. Please sign in again.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.title || !body.desc || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Title, description, and category are required' },
        { status: 400 }
      );
    }

    const locationStatus = body.location_status || body.factors?.locationStatus;
    const locationConfirmed = body.location_confirmed ?? body.factors?.locationConfirmed ?? false;

    if (locationStatus === 'OUTSIDE_JHARKHAND') {
      return NextResponse.json(
        { success: false, error: 'The detected location is outside Jharkhand and cannot be submitted as a Jharkhand challenge.' },
        { status: 400 }
      );
    }

    if (!locationConfirmed) {
      return NextResponse.json(
        { success: false, error: 'A verified or manually selected Jharkhand location is required.' },
        { status: 400 }
      );
    }

    const problem = await createProblemRecord({
      reporter_id: user.id,
      title: body.title,
      desc: body.desc,
      category: body.category,
      location: body.location || body.address || 'Reported Location',
      severity: body.severity || 'Medium',
      priority: body.priority,
      affected: body.affected,
      landmark: body.landmark,
      datetime: body.datetime,
      contact: body.contact,
      latitude: body.latitude ?? body.lat ?? null,
      longitude: body.longitude ?? body.lng ?? null,
      location_source: body.location_source || 'MANUAL_ENTRY',
      location_accuracy: body.location_accuracy || '~15m',
      location_confirmed: locationConfirmed,
      location_status: locationStatus,
      photos: body.photos || [],
      factors: body.factors || body.assessment_factors || null,
      state: body.state || 'Jharkhand',
      district: body.district || undefined,
      block: body.block || '',
      domain: body.domain,
      subdomain: body.subdomain,
      affected_population: body.affected_population || body.affected,
      expected_outcome: body.expected_outcome,
      required_expertise: body.required_expertise
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Problem successfully created, classified, and matched in SahYog pipeline',
        data: problem
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create problem' },
      { status: 500 }
    );
  }
}
