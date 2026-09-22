import { NextResponse } from 'next/server';
import { updateSolutionStatus } from '@/lib/server/db';
import type { Solution } from '@/lib/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses: Solution['status'][] = [
      'Proposed',
      'Under Review',
      'Approved',
      'In Deployment',
      'Completed',
      'Rejected'
    ];

    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${body.status}` },
        { status: 400 }
      );
    }

    const actorRole = (request.headers.get('x-user-role') || body.actor_role || 'Government') as 'Government' | 'Industry' | 'University' | 'Citizen';

    const updatedProblem = await updateSolutionStatus(
      id,
      body.status,
      actorRole
    );

    if (!updatedProblem) {
      return NextResponse.json(
        { success: false, error: `Solution ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Solution status updated to "${body.status}" and lifecycle stage synchronized`,
      data: updatedProblem
    });
  } catch (error: any) {
    const isForbidden = error?.message?.toLowerCase().includes('permission denied');
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update solution' },
      { status: isForbidden ? 403 : 500 }
    );
  }
}
