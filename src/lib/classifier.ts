import type { AIResult, OrgMatch, Problem } from './types';
import {
  KEYWORDS,
  SUBCATEGORY,
  AUTHORITY,
  AUTH_REASON,
  RECOMMENDED_ACTION,
  ORG_POOL,
  JHARKHAND_DISTRICTS
} from './constants';
import {
  resolveDomainKey,
  extractRequiredExpertise
} from './impactQuestions';

/**
 * AI-Assisted Societal Challenge Evaluator & Classifier
 * Prototype rule-based & keyword mapping engine for Government of Jharkhand (SIH26043).
 * Identifies domain, sub-domain, coordinating authority, and extracts required multidisciplinary disciplines.
 */
export function classify(title: string, desc: string, category?: string): AIResult {
  const text = (title + ' ' + desc).toLowerCase();
  let bestCat = category || 'Other';
  let bestHits = 0;
  let hitTerms: string[] = [];

  Object.entries(KEYWORDS).forEach(([cat, words]) => {
    const found = words.filter(w => text.includes(w.toLowerCase()));
    if (found.length > bestHits) {
      bestHits = found.length;
      bestCat = cat;
      hitTerms = found;
    }
  });

  const finalCat = bestHits > 0 ? bestCat : (category || 'Other');
  const domainKey = resolveDomainKey(finalCat);
  const confidence = bestHits > 0 ? Math.min(96, 75 + bestHits * 6) : 65;
  if (hitTerms.length === 0) hitTerms = [finalCat.toLowerCase().split(' ')[0]];

  const requiredExpertise = extractRequiredExpertise(domainKey, title + ' ' + desc);

  return {
    category: finalCat,
    subcategory: SUBCATEGORY[finalCat] || 'General Societal Innovation Challenge',
    authority: AUTHORITY[finalCat] || 'Jharkhand State Innovation Council, Govt. of Jharkhand',
    reason: AUTH_REASON[finalCat] || 'This coordinating department oversees state-level policy, pilot approvals, and institutional funding in this domain.',
    action: RECOMMENDED_ACTION[finalCat] || 'HEI multidisciplinary student-faculty matching and solution proposal formulation.',
    confidence,
    terms: hitTerms,
    method: 'RULE_BASED_PROTOTYPE',
    domain: domainKey,
    subdomain: SUBCATEGORY[finalCat],
    required_expertise: requiredExpertise
  };
}

/**
 * HEI & Industry Partner Matching Engine for Government of Jharkhand
 * 4-factor transparent scoring breakdown:
 * - Domain Relevance (40%)
 * - Regional / District Jurisdiction (30%)
 * - Academic / Lab Expertise (20%)
 * - Implementation Capacity (10%)
 */
export function buildMatches(
  problemOrCategory: Problem | string,
  location?: string | any,
  lat?: number | null,
  lng?: number | null
): OrgMatch[] {
  const isProblemObj = typeof problemOrCategory === 'object' && problemOrCategory !== null;
  const category = isProblemObj
    ? (problemOrCategory.domain || problemOrCategory.category || 'Other')
    : String(problemOrCategory || 'Other');

  const locStr = isProblemObj
    ? (problemOrCategory.location || problemOrCategory.district || '')
    : (typeof location === 'string' ? location : '');

  const finalLat = isProblemObj ? problemOrCategory.latitude : lat;
  const finalLng = isProblemObj ? problemOrCategory.longitude : lng;

  const pool = ORG_POOL[category] || ORG_POOL['default'] || [];
  const locLower = String(locStr || '').toLowerCase();

  // Check if location is in Jharkhand or matches specific Jharkhand districts
  const isJharkhand =
    locLower.includes('jharkhand') ||
    locLower.includes('ranchi') ||
    locLower.includes('dhanbad') ||
    locLower.includes('jamshedpur') ||
    locLower.includes('bokaro') ||
    locLower.includes('gumla') ||
    locLower.includes('dumka') ||
    locLower.includes('khunti') ||
    locLower.includes('singhbhum') ||
    JHARKHAND_DISTRICTS.some(d => locLower.includes(d.toLowerCase())) ||
    (finalLat !== undefined && finalLat !== null && finalLat >= 21.5 && finalLat <= 25.5 && finalLng !== undefined && finalLng !== null && finalLng >= 83.0 && finalLng <= 88.0);

  return pool.map((org) => {
    let jurisdictionScore = org.factors.jurisdiction;

    // Proximity boost if institution is located in the same district or state corridor
    const orgLoc = org.location.toLowerCase();
    if (isJharkhand && (orgLoc.includes('jharkhand') || orgLoc.includes('ranchi') || orgLoc.includes('dhanbad') || orgLoc.includes('jamshedpur'))) {
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

// Alias for explicit HEI naming
export const buildHEIAndPartnerMatches = buildMatches;

export function makeId(n: number) {
  return 'JH-2026-' + String(n).padStart(5, '0');
}
