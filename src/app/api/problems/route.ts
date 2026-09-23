import { NextResponse } from 'next/server';
import { listProblems, createProblemRecord } from '@/lib/server/db';

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
    const body = await request.json();

    if (!body.title || !body.desc || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Title, description, and category are required' },
        { status: 400 }
      );
    }

    const problem = await createProblemRecord({
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
      location_confirmed: body.location_confirmed ?? true,
      photos: body.photos || [],
      factors: body.factors || body.assessment_factors || null,
      state: body.state || 'Jharkhand',
      district: body.district || 'Ranchi',
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
