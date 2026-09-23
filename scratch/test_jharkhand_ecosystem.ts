// Self-check test suite for SahYog - Govt. of Jharkhand Societal Innovation Platform
// Run with: npx tsx scratch/test_jharkhand_ecosystem.ts
import assert from 'assert';

// Test 1: 24 Jharkhand Districts
import { JHARKHAND_DISTRICTS, ORG_POOL } from '../src/lib/constants';
assert(Array.isArray(JHARKHAND_DISTRICTS), 'JHARKHAND_DISTRICTS must be an array');
assert.strictEqual(JHARKHAND_DISTRICTS.length, 24, 'Must have exactly 24 Jharkhand districts');
assert(JHARKHAND_DISTRICTS.includes('Ranchi'), 'Ranchi must be present');
assert(JHARKHAND_DISTRICTS.includes('Dhanbad'), 'Dhanbad must be present');
assert(JHARKHAND_DISTRICTS.includes('Gumla'), 'Gumla must be present');
assert(JHARKHAND_DISTRICTS.includes('East Singhbhum'), 'East Singhbhum must be present');
console.log('✓ Test 1: 24 Jharkhand Districts verified.');

// Test 2: 13 Societal Domains
import {
  SOCIETAL_DOMAINS,
  CHALLENGE_ASSESSMENT_BY_DOMAIN,
  extractRequiredExpertise,
  calculateDomainImpactSeverity,
  generateDomainPrefilledDetails
} from '../src/lib/impactQuestions';

assert.strictEqual(SOCIETAL_DOMAINS.length, 13, 'Must have 13 societal domains');
const expectedKeys = [
  'education', 'healthcare', 'agriculture', 'water', 'sanitation',
  'environment', 'energy', 'urban_infra', 'accessibility',
  'public_admin', 'rural_livelihoods', 'rural_dev', 'other'
] as const;

for (const key of expectedKeys) {
  assert(CHALLENGE_ASSESSMENT_BY_DOMAIN[key], `Domain question config missing for: ${key}`);
  const cfg = CHALLENGE_ASSESSMENT_BY_DOMAIN[key];
  assert(cfg.question1 && cfg.question1.options.length >= 3, `Question 1 options missing for ${key}`);
  assert(cfg.question2 && cfg.question2.options.length >= 3, `Question 2 options missing for ${key}`);
  assert(cfg.question3 && cfg.question3.options.length >= 3, `Question 3 options missing for ${key}`);
  assert(Array.isArray(cfg.defaultExpertise) && cfg.defaultExpertise.length >= 2, `Default expertise missing for ${key}`);
}
console.log('✓ Test 2: 13 Societal Domains and question configs verified.');

// Test 3: Multidisciplinary Expertise Extraction
const waterSkills = extractRequiredExpertise('water', 'Solar powered fluoride filtration with IoT telemetry');
assert(Array.isArray(waterSkills), 'Must return array of skills');
assert(waterSkills.some(s => s.toLowerCase().includes('water') || s.toLowerCase().includes('chemical') || s.toLowerCase().includes('environmental')), 'Must include water/chemical skill');
assert(waterSkills.some(s => s.toLowerCase().includes('iot') || s.toLowerCase().includes('embedded')), 'Must include IoT skill');
assert(waterSkills.some(s => s.toLowerCase().includes('solar') || s.toLowerCase().includes('energy') || s.toLowerCase().includes('power')), 'Must include Solar/Power skill');
console.log('✓ Test 3: Multidisciplinary expertise extraction verified:', waterSkills);

// Test 4: Dynamic Impact Severity Calculation
const impactRes = calculateDomainImpactSeverity({
  domainKey: 'water',
  q1OptionId: 'multi_village', // score: 3.5
  q2OptionId: 'chemical_toxins', // score: 3.5
  contextOptionIds: ['fluorosis_symptoms', 'school_anganwadi_source'] // boosts
});
assert.strictEqual(impactRes.suggestedSeverity, 'Critical', 'High score with toxic fluoride should be Critical');
assert.strictEqual(impactRes.suggestedPriority, 'Critical', 'Fluorosis + school context should boost priority to Critical');
assert(impactRes.factors.length >= 3, 'Must capture at least 3 contributing factors');
console.log('✓ Test 4: Dynamic impact severity calculation verified:', impactRes.suggestedSeverity, impactRes.suggestedPriority);

// Test 5: Prefilled Details Generator
const details = generateDomainPrefilledDetails({
  domainKey: 'agriculture',
  district: 'Gumla',
  block: 'Bishunpur',
  priority: 'High'
});
assert(details.suggestedTitle.includes('Gumla'), 'Title must mention district Gumla');
assert(details.expectedOutcome.length > 20, 'Expected outcome must be informative');
console.log('✓ Test 5: Prefilled details generator verified.');

// Test 6: Classifier and Jharkhand HEI Matching
import { classify, buildMatches } from '../src/lib/classifier';
import type { Problem } from '../src/lib/types';

const classRes = classify('Solar-Powered Micro-Drip Irrigation for Tribal Farmers', 'Off-season vegetable farming in Kanke Ranchi with solar pumps', 'Agriculture');
assert(classRes.confidence >= 65, 'Classification confidence should be >= 65');

const mockProblem: Problem = {
  id: 'PRB-TEST-001',
  title: 'Solar Micro-Irrigation Deficit in Kanke Vegetable Belt',
  desc: 'Smallholder tribal farmers need solar drip irrigation',
  category: 'Agriculture & Food Security',
  domain: 'Agriculture & Food Security',
  subdomain: 'Solar Micro-Irrigation',
  district: 'Ranchi',
  state: 'Jharkhand',
  location: 'Kanke Block, Ranchi, Jharkhand',
  latitude: 23.4357,
  longitude: 85.3183,
  severity: 'High',
  priority: 'High',
  stage: 1,
  date: '2026-09-23',
  datetime: new Date().toISOString(),
  mapX: 45,
  mapY: 55,
  solutions: [],
  verification: null,
  affected: '480 tribal farming families',
  photos: [],
  required_expertise: ['Agricultural Engineering', 'IoT & Embedded Systems', 'Renewable Energy']
};

const matches = buildMatches(mockProblem);
assert(matches.length > 0, 'Should find matches for problem');
const topMatch = matches[0];
console.log(`✓ Top match for ${mockProblem.district} challenge: ${topMatch.name} (Score: ${topMatch.score}%, Type: ${topMatch.type})`);
assert(topMatch.location.includes('Jharkhand'), 'Top matched HEI should be in Jharkhand');

console.log('\n=============================================');
console.log('🎉 ALL 6 JHARKHAND ECOSYSTEM TESTS PASSED!');
console.log('=============================================\n');
