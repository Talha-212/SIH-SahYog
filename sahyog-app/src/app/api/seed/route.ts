import { NextResponse } from 'next/server';
import { resetDatabaseToDemo } from '@/lib/server/db';

export async function POST() {
  try {
    const db = await resetDatabaseToDemo();
    return NextResponse.json({
      success: true,
      message: 'SahYog persistent database successfully reset to clean SIH 2026 demo dataset',
      problemsCount: db.problems.length,
      organizationsCount: db.organizations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to reset database' },
      { status: 500 }
    );
  }
}
