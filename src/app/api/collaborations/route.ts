import { NextResponse } from 'next/server';
import { joinCollaborationWorkspace } from '@/lib/server/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.problem_id || !body.org_name || !body.org_type) {
      return NextResponse.json(
        { success: false, error: 'problem_id, org_name, and org_type are required' },
        { status: 400 }
      );
    }

    const updatedProblem = await joinCollaborationWorkspace({
      problem_id: body.problem_id,
      org_name: body.org_name,
      org_type: body.org_type,
      role_in_problem: body.role_in_problem || 'Collaborating Partner'
    });

    if (!updatedProblem) {
      return NextResponse.json(
        { success: false, error: `Problem ${body.problem_id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${body.org_name} has joined the collaboration workspace`,
      data: updatedProblem
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to join collaboration' },
      { status: 500 }
    );
  }
}
