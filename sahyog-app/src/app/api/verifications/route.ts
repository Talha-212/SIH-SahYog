import { NextResponse } from 'next/server';
import { recordVerificationRecord } from '@/lib/server/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.problem_id || typeof body.resolved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'problem_id and resolved (boolean) are required' },
        { status: 400 }
      );
    }

    const updatedProblem = await recordVerificationRecord({
      problem_id: body.problem_id,
      resolved: body.resolved,
      comment: body.comment || (body.resolved ? 'Verified on ground by citizen: Issue resolved.' : 'Citizen feedback: Issue still unresolved.'),
      evidence_ref: body.evidence_ref,
      verified_by: body.verified_by || 'Citizen Reporter'
    });

    if (!updatedProblem) {
      return NextResponse.json(
        { success: false, error: `Problem ${body.problem_id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: body.resolved
        ? 'Citizen ground-truth verification recorded: Stage 8 Closed-Loop Complete'
        : 'Citizen reported unresolved issue: Problem reopened for corrective field action',
      data: updatedProblem
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to record verification' },
      { status: 500 }
    );
  }
}
