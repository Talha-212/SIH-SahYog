const {
  IMPACT_QUESTIONS_BY_CATEGORY,
  calculateCategoryImpactSeverity,
  generateCategoryPrefilledDetails,
  validateEvidenceFile,
  resolveCategoryKey,
  getStandardCategoryName,
  CIVIC_CATEGORIES
} = require('../src/lib/impactQuestions');

async function runTests() {
  console.log('=== RUNNING SAHYOG REPORTING WORKFLOW TESTS ===\n');

  // Test 1: Category Configuration Integrity
  console.log('Test 1: Verify all 8 Civic Categories exist in config');
  const expectedKeys = ['road', 'waste', 'drainage', 'streetlight', 'footpath', 'water', 'electrical', 'other'];
  for (const k of expectedKeys) {
    if (!IMPACT_QUESTIONS_BY_CATEGORY[k]) {
      throw new Error(`Missing category config for ${k}`);
    }
    const cfg = IMPACT_QUESTIONS_BY_CATEGORY[k];
    if (!cfg.question1 || !cfg.question2 || !cfg.question3) {
      throw new Error(`Category ${k} is missing questions`);
    }
    console.log(`  ✓ Category [${k}]: ${cfg.categoryLabel} (${cfg.question1.options.length} q1 opts, ${cfg.question2.options.length} q2 opts, ${cfg.question3.options.length} q3 opts)`);
  }

  // Test 2: Dynamic Severity Assessment - Waste Management
  console.log('\nTest 2: Waste Management Impact Severity Assessment');
  const wasteResult = calculateCategoryImpactSeverity({
    categoryKey: 'waste',
    q1OptionId: 'massive',
    q2OptionId: 'drain_blocked',
    contextOptionIds: ['near_food_schools', 'burning_hazard']
  });
  console.log('  Calculated Physical Severity:', wasteResult.suggestedSeverity);
  console.log('  Calculated Response Priority:', wasteResult.suggestedPriority);
  console.log('  Explanation:', wasteResult.explanation);
  if (wasteResult.suggestedSeverity !== 'Critical') throw new Error('Expected Critical severity for massive dump');
  if (wasteResult.suggestedPriority !== 'Critical') throw new Error('Expected Critical priority for burning hazard near food/schools');
  if (!wasteResult.explanation.includes('massive illegal dumping site')) throw new Error('Explanation should reference massive dumping');

  // Test 3: Dynamic Severity Assessment - Streetlight Fault
  console.log('\nTest 3: Streetlight Fault Impact Severity Assessment');
  const streetLightResult = calculateCategoryImpactSeverity({
    categoryKey: 'streetlight',
    q1OptionId: 'single',
    q2OptionId: 'dim',
    contextOptionIds: []
  });
  console.log('  Calculated Physical Severity:', streetLightResult.suggestedSeverity);
  console.log('  Calculated Response Priority:', streetLightResult.suggestedPriority);
  console.log('  Explanation:', streetLightResult.explanation);
  if (streetLightResult.suggestedSeverity !== 'Low') throw new Error('Expected Low severity for single dim fixture');

  // Test 4: Prefilled Details Generation across multiple categories
  console.log('\nTest 4: Category Prefilled Details Generation');
  const prefillWaste = generateCategoryPrefilledDetails({
    categoryKey: 'waste',
    locationAddress: 'Mehdipatnam Commercial Market, Hyderabad',
    severity: wasteResult.suggestedSeverity,
    priority: wasteResult.suggestedPriority,
    factors: wasteResult.factors
  });
  console.log('  Waste Prefilled Title:', prefillWaste.suggestedTitle);
  console.log('  Waste Prefilled Desc:', prefillWaste.suggestedDescription);
  if (!prefillWaste.suggestedTitle.toLowerCase().includes('waste') && !prefillWaste.suggestedTitle.toLowerCase().includes('garbage')) {
    throw new Error('Title should be category-specific for waste');
  }

  // Test 5: Heuristic Evidence Validation
  console.log('\nTest 5: Evidence Validation (Personal/Selfie vs Non-Civic vs Blurry vs Valid)');
  
  const selfieVal = await validateEvidenceFile({ name: 'my_selfie_at_park.jpg' });
  console.log('  Selfie test:', selfieVal.status, '-', selfieVal.title);
  if (selfieVal.status !== 'selfie' || selfieVal.canProceed !== false) throw new Error('Selfie should be blocked');

  const foodVal = await validateEvidenceFile({ name: 'lunch_food_plate.png' });
  console.log('  Non-civic test (food):', foodVal.status, '-', foodVal.title);
  if (foodVal.status !== 'non_civic' || foodVal.canProceed !== false) throw new Error('Food photo should be blocked');

  const blurryVal = await validateEvidenceFile({ name: 'blurry_unclear_photo.jpg' });
  console.log('  Blurry test:', blurryVal.status, '-', blurryVal.title);
  if (blurryVal.status !== 'low_quality' || blurryVal.canProceed !== false) throw new Error('Blurry photo should be blocked');

  const drainVal = await validateEvidenceFile({ name: 'drainage_overflow_main_road.jpg' });
  console.log('  Civic test (drainage):', drainVal.status, '- Category:', drainVal.detectedCategoryKey);
  if (drainVal.status !== 'valid' || drainVal.detectedCategoryKey !== 'drainage') throw new Error('Drainage photo should be valid and detected as drainage');

  const uncertainVal = await validateEvidenceFile({ name: 'unidentified_photo_123.jpg' });
  console.log('  Uncertain test:', uncertainVal.status, '- Category:', uncertainVal.detectedCategoryKey, '- Manual required:', uncertainVal.requiresManualCategory);
  if (uncertainVal.status !== 'uncertain' || uncertainVal.detectedCategoryKey !== 'other' || !uncertainVal.requiresManualCategory) {
    throw new Error('Uncertain photo should default to other and require category selection');
  }

  console.log('\n=== ALL 5 CATEGORY & VALIDATION TESTS PASSED ===');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
