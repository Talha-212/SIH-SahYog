import { NextResponse } from 'next/server';
import { addSolutionRecord } from '@/lib/server/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.problem_id || !body.title || !body.org_name) {
      return NextResponse.json(
        { success: false, error: 'problem_id, title, and org_name are required' },
        { status: 400 }
      );
    }

    const actorRole = request.headers.get('x-user-role') || body.actor_role;

    const updatedProblem = await addSolutionRecord({
      problem_id: body.problem_id,
      title: body.title,
      org_name: body.org_name,
      desc: body.desc || '',
      tech: body.tech || '',
      cost: body.cost || 'Estimated upon civic approval',
      time: body.time || '10-14 days',
      impact: body.impact || 'High local impact',
      actor_role: actorRole
    });

    if (!updatedProblem) {
      return NextResponse.json(
        { success: false, error: `Problem ${body.problem_id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Solution proposal submitted and logged to collaboration workspace',
        data: updatedProblem
      },
      { status: 201 }
    );
  } catch (error: any) {
    const isForbidden = error?.message?.toLowerCase().includes('citizens report issues') || error?.message?.toLowerCase().includes('permission denied');
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit solution proposal' },
      { status: isForbidden ? 403 : 500 }
    );
  }
}
