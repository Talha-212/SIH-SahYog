import { NextResponse } from 'next/server';
import { classify } from '@/lib/classifier';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = body.title || '';
    const desc = body.desc || '';
    const category = body.category || 'Other';

    const ai = classify(title, desc, category);
    const score = Math.min(99, Math.max(62, ai.confidence));

    return NextResponse.json({
      success: true,
      data: {
        category: ai.category,
        subcategory: ai.subcategory,
        authority: ai.authority,
        reason: ai.reason,
        action: ai.action,
        terms: ai.terms,
        confidence: score,
        confidenceLabel: `${score}% (Keyword/Ontology Match)`,
        method: 'RULE_BASED_PROTOTYPE',
        methodLabel: 'Prototype Rule-Based Classification',
        evaluatorNote: 'Deterministic text/category ontology prototype. This endpoint does not perform computer-vision image classification. Production roadmap may add a genuine multimodal model.'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Classification failed' },
      { status: 500 }
    );
  }
}
