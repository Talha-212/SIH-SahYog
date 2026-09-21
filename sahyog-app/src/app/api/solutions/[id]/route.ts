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

    const updatedProblem = await updateSolutionStatus(
      id,
      body.status,
      body.actor_role || 'Government'
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
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update solution' },
      { status: 500 }
    );
  }
}
