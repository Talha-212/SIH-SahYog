import type { AIResult, OrgMatch } from './types';
import { KEYWORDS, SUBCATEGORY, AUTHORITY, AUTH_REASON, RECOMMENDED_ACTION, ORG_POOL } from './constants';

export function classify(title: string, desc: string, category: string): AIResult {
  const text = (title + ' ' + desc).toLowerCase();
  let bestCat = category;
  let bestHits = 0;
  let hitTerms: string[] = [];

  Object.entries(KEYWORDS).forEach(([cat, words]) => {
    const found = words.filter(w => text.includes(w));
    if (found.length > bestHits) { bestHits = found.length; bestCat = cat; hitTerms = found; }
  });

  const finalCat = bestHits > 0 ? bestCat : category;
  const confidence = bestHits > 0 ? Math.min(97, 78 + bestHits * 7) : 66;
  if (hitTerms.length === 0) hitTerms = [category.toLowerCase().split(' ')[0]];

  return {
    category: finalCat,
    subcategory: SUBCATEGORY[finalCat] || 'General',
    authority: AUTHORITY[finalCat] || 'General Administration',
    reason: AUTH_REASON[finalCat] || 'This authority typically handles cases in this category for the selected area.',
    action: RECOMMENDED_ACTION[finalCat] || 'Field verification and assessment.',
    confidence,
    terms: hitTerms,
    method: 'RULE_BASED_PROTOTYPE'
  };
}

/**
 * Builds solver matches with 4-factor scoring breakdown:
 * - Domain (40%)
 * - Jurisdiction / Geographic Proximity (30%)
 * - Expertise (20%)
 * - Implementation Capacity (10%)
 */
export function buildMatches(
  category: string,
  location?: string,
  lat?: number | null,
  lng?: number | null
): OrgMatch[] {
  const pool = ORG_POOL[category] || ORG_POOL['default'];
  const locLower = (location || '').toLowerCase();
  const isHydOrLocal =
    locLower.includes('hyderabad') ||
    locLower.includes('himayat') ||
    locLower.includes('lord') ||
    locLower.includes('telangana') ||
    (lat !== undefined && lat !== null && lat >= 17.0 && lat <= 17.7);

  return pool.map((org) => {
    let jurisdictionScore = org.factors.jurisdiction;

    // Geographic jurisdiction relevance boost if problem is in solver's jurisdiction
    if (isHydOrLocal && (org.location.toLowerCase().includes('hyderabad') || org.location.toLowerCase().includes('zone') || org.location.toLowerCase().includes('city'))) {
      jurisdictionScore = Math.min(30, jurisdictionScore + 2);
    }

    const total = org.factors.domain + jurisdictionScore + org.factors.expertise + org.factors.capacity;
    return {
      ...org,
      score: total,
      score_type: 'PROTOTYPE_WEIGHTED_SCORE',
      factors: {
        ...org.factors,
        jurisdiction: jurisdictionScore
      }
    };
  });
}

export function makeId(n: number) {
  return 'SY-2026-' + String(n).padStart(5, '0');
}
