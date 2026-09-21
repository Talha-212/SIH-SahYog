import { NextResponse } from 'next/server';
import { getProblem } from '@/lib/server/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const problem = await getProblem(id);

    if (!problem) {
      return NextResponse.json(
        { success: false, error: `Problem ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: problem,
      _meta: {
        roleContextsSupported: ['citizen', 'government', 'university', 'industry', 'ngo'],
        centralSourceOfTruth: true
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch problem' },
      { status: 500 }
    );
  }
}
