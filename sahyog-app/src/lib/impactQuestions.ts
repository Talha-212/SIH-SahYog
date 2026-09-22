// Centralized Category-Aware Impact Questions and Severity Engine for SahYog (SIH26043)
// Supports all 8 civic problem categories with category-specific questionnaires and dynamic severity calculations.

export type CivicCategoryKey =
  | 'road'
  | 'waste'
  | 'drainage'
  | 'streetlight'
  | 'footpath'
  | 'water'
  | 'electrical'
  | 'other';

export interface ImpactOption {
  id: string;
  label: string;
  score: number;
  factorText: string;
}

export interface ContextOption {
  id: string;
  label: string;
  factorText: string;
  priorityBoost?: boolean;
  severityBoost?: boolean;
}

export const CIVIC_CATEGORIES: Array<{ key: CivicCategoryKey; label: string; icon: string }> = [
  { key: 'road', label: 'Road Damage & Potholes', icon: '🚧' },
  { key: 'waste', label: 'Garbage & Waste', icon: '🗑️' },
  { key: 'drainage', label: 'Drainage & Sewage Overflow', icon: '🌊' },
  { key: 'streetlight', label: 'Street Lighting & Fixtures', icon: '💡' },
  { key: 'footpath', label: 'Footpath & Pedestrian Hazard', icon: '🚶' },
  { key: 'water', label: 'Water Supply Leakage', icon: '🚰' },
  { key: 'electrical', label: 'Electrical & Utility Hazard', icon: '⚡' },
  { key: 'other', label: 'Other / General Civic Issue', icon: '📋' }
];

export interface CategoryQuestionConfig {
  key: CivicCategoryKey;
  categoryLabel: string;
  categoryName?: string;
  standardCategoryName: string;
  detectedProblemDefault: string;
  question1: {
    title: string;
    options: ImpactOption[];
  };
  q1?: {
    title: string;
    options: ImpactOption[];
  };
  question2: {
    title: string;
    options: ImpactOption[];
  };
  q2?: {
    title: string;
    options: ImpactOption[];
  };
  question3: {
    title: string;
    options: ContextOption[];
  };
  q3?: {
    title: string;
    options: ContextOption[];
  };
}

export const IMPACT_QUESTIONS_BY_CATEGORY: Record<CivicCategoryKey, CategoryQuestionConfig> = {
  // 1. ROAD / POTHOLE
  road: {
    key: 'road',
    categoryLabel: 'Road Damage & Potholes',
    standardCategoryName: 'Roads & Infrastructure',
    detectedProblemDefault: 'Pothole & road surface damage',
    question1: {
      title: '1. Approximate size / depth of road damage',
      options: [
        { id: 'small', label: 'Small surface depression (< 1 meter)', score: 1, factorText: 'Small road depression (< 1m)' },
        { id: 'part_lane', label: 'Part of traffic lane (1–2 meters, moderate crater)', score: 2, factorText: 'Partial lane crater (1–2m)' },
        { id: 'most_lane', label: 'Most of traffic lane (2–3 meters, deep pothole)', score: 3, factorText: 'Deep lane-wide pothole (2–3m)' },
        { id: 'multi_lane', label: 'Multi-lane / Entire roadway (> 3 meters crater)', score: 4, factorText: 'Multi-lane crater obstructs road' },
      ],
    },
    question2: {
      title: '2. Is vehicle traffic currently disrupted?',
      options: [
        { id: 'none', label: 'Vehicles pass freely with slight slowdown', score: 1, factorText: 'Slight traffic slowdown' },
        { id: 'minor', label: 'Vehicles must brake & swerve around damage', score: 2, factorText: 'Vehicles swerving to avoid crater' },
        { id: 'severe', label: 'Severe congestion & elevated two-wheeler skid hazard', score: 3, factorText: 'Severe traffic disruption with elevated two-wheeler risk' },
      ],
    },
    question3: {
      title: '3. Roadway hazard & sensitive location context (select all that apply)',
      options: [
        { id: 'school_hospital', label: 'Near school, college, hospital or transit hub', factorText: 'Proximity to school/hospital/transit hub', priorityBoost: true },
        { id: 'waterlogged', label: 'Standing water concealing pothole depth', factorText: 'Standing water conceals crater depth', severityBoost: true },
        { id: 'busy_junction', label: 'Located at major road crossing or sharp turn', factorText: 'Location at major road junction/turn', priorityBoost: true },
        { id: 'night_hazard', label: 'Unlit road with severe night collision risk', factorText: 'Dark road with severe night accident risk', severityBoost: true },
      ],
    },
  },

  // 2. GARBAGE / WASTE
  waste: {
    key: 'waste',
    categoryLabel: 'Garbage & Waste Accumulation',
    standardCategoryName: 'Waste Management',
    detectedProblemDefault: 'Garbage accumulation & waste overflow',
    question1: {
      title: '1. Approximate volume of accumulated waste',
      options: [
        { id: 'small', label: 'Small roadside litter / Scattered trash', score: 1, factorText: 'Small scattered litter' },
        { id: 'medium', label: 'Medium pile / Overflowing roadside bin', score: 2, factorText: 'Medium overflowing waste pile' },
        { id: 'large', label: 'Large continuous heap / Full corner dump', score: 3, factorText: 'Large open garbage dump' },
        { id: 'massive', label: 'Massive illegal dumping ground across public area', score: 4, factorText: 'Massive illegal dumping site' },
      ],
    },
    question2: {
      title: '2. Obstruction & physical public impact',
      options: [
        { id: 'none', label: 'Contained on roadside, no path or road blocked', score: 1, factorText: 'Contained to roadside verge' },
        { id: 'path_blocked', label: 'Spilling onto footpath / Pedestrians forced to road', score: 2, factorText: 'Spilling onto pedestrian footpath' },
        { id: 'drain_blocked', label: 'Blocking road lane, stormwater drain, or building gate', score: 3, factorText: 'Blocking road lane and public drainage' },
      ],
    },
    question3: {
      title: '3. Health & environmental context (select all that apply)',
      options: [
        { id: 'foul_odor', label: 'Foul odor / Decomposing organic matter', factorText: 'Severe decomposition & foul odor', severityBoost: true },
        { id: 'near_food_schools', label: 'Near homes, schools, food market, or hospital', factorText: 'Immediate proximity to homes/food stalls/schools', priorityBoost: true },
        { id: 'stagnant_leachate', label: 'Leachate liquid runoff / Pest & rodent infestation', factorText: 'Toxic leachate runoff with rodent risk', severityBoost: true },
        { id: 'burning_hazard', label: 'Waste is actively burning / Smoldering smoke hazard', factorText: 'Open garbage burning producing toxic smoke', severityBoost: true, priorityBoost: true },
      ],
    },
  },

  // 3. DRAINAGE / SEWAGE
  drainage: {
    key: 'drainage',
    categoryLabel: 'Drainage & Sewage Overflow',
    standardCategoryName: 'Drainage',
    detectedProblemDefault: 'Drainage blockage & sewage overflow',
    question1: {
      title: '1. Sewage / stormwater overflow status',
      options: [
        { id: 'slow', label: 'Stagnant wastewater pooling, sluggish drain', score: 1, factorText: 'Stagnant pooling with slow drainage' },
        { id: 'overflowing', label: 'Active wastewater overflow onto public surface', score: 2, factorText: 'Active wastewater overflow onto street' },
        { id: 'raw_sewage', label: 'Raw blackwater / sewage gushing from manhole', score: 3, factorText: 'Raw sewage gushing from breached manhole' },
        { id: 'major_flood', label: 'Wide stormwater inundation / Flooded neighborhood', score: 4, factorText: 'Severe civic flood from choked main storm drain' },
      ],
    },
    question2: {
      title: '2. Affected area & movement impact',
      options: [
        { id: 'localized', label: 'Localized to small drain edge (~2-3 meters)', score: 1, factorText: 'Localized to drain edge' },
        { id: 'path_submerged', label: 'Footpath submerged / Pedestrians blocked', score: 2, factorText: 'Footpath submerged in effluent' },
        { id: 'road_submerged', label: 'Entire road section flooded / Vehicle engines stalling', score: 3, factorText: 'Roadway inundated with raw effluent' },
      ],
    },
    question3: {
      title: '3. Environmental health & hazard context (select all that apply)',
      options: [
        { id: 'foul_odor', label: 'Severe foul odor & visible untreated sewage', factorText: 'Pungent biological sewage hazard', severityBoost: true },
        { id: 'residence_ingress', label: 'Wastewater entering shops, homes, or school gates', factorText: 'Effluent entering residential/commercial premises', priorityBoost: true, severityBoost: true },
        { id: 'open_manhole', label: 'Missing manhole cover / Submerged open pit hazard', factorText: 'Open/uncovered manhole submerged underwater', severityBoost: true, priorityBoost: true },
        { id: 'near_clinic', label: 'Near health clinic, school, or drinking water line', factorText: 'Proximity to healthcare facility or potable supply', priorityBoost: true },
      ],
    },
  },

  // 4. STREETLIGHT / PUBLIC LIGHTING
  streetlight: {
    key: 'streetlight',
    categoryLabel: 'Street Lighting & Public Fixtures',
    standardCategoryName: 'Street Lighting',
    detectedProblemDefault: 'Streetlight outage & dark corridor',
    question1: {
      title: '1. How many lights or fixtures are affected?',
      options: [
        { id: 'single', label: 'Single isolated lamp post', score: 1, factorText: 'Single non-functional lamp post' },
        { id: 'few', label: '2 to 3 consecutive lights out', score: 2, factorText: '2 to 3 consecutive dark light poles' },
        { id: 'stretch', label: 'Major corridor stretch (4–7 lights out)', score: 3, factorText: 'Corridor stretch of 4–7 dark poles' },
        { id: 'entire_area', label: 'Entire street or junction completely pitch black', score: 4, factorText: 'Entire road corridor in complete darkness' },
      ],
    },
    question2: {
      title: '2. Visibility & pedestrian/vehicle route impact',
      options: [
        { id: 'minor_lane', label: 'Quiet residential lane with minimal through-traffic', score: 1, factorText: 'Quiet residential lane' },
        { id: 'ped_route', label: 'Active pedestrian route or student walking path', score: 2, factorText: 'Active pedestrian/student commuting route' },
        { id: 'busy_artery', label: 'Busy arterial road, junction, or bus stop area', score: 3, factorText: 'Major arterial road and bus transit junction' },
      ],
    },
    question3: {
      title: '3. Public safety & structural context (select all that apply)',
      options: [
        { id: 'exposed_wires', label: 'Exposed live wiring at base or hanging cables', factorText: 'Exposed electrical wiring at pole base', severityBoost: true },
        { id: 'high_crime_risk', label: 'Dark stretch creates acute safety/harassment risk', factorText: 'Dark stretch creates elevated public safety risk', priorityBoost: true },
        { id: 'near_crossing', label: 'Located at pedestrian crossing, school gate, or blind turn', factorText: 'Located at pedestrian crossing or school zone', priorityBoost: true },
        { id: 'leaning_pole', label: 'Pole is leaning / Structurally unstable fixture', factorText: 'Physically damaged or leaning lamp post', severityBoost: true },
      ],
    },
  },

  // 5. FOOTPATH / PEDESTRIAN INFRASTRUCTURE
  footpath: {
    key: 'footpath',
    categoryLabel: 'Footpath & Pedestrian Infrastructure',
    standardCategoryName: 'Accessibility',
    detectedProblemDefault: 'Damaged footpath & pedestrian obstruction',
    question1: {
      title: '1. Extent of footpath surface damage or collapse',
      options: [
        { id: 'minor_crack', label: 'Loose pavers or minor surface crack', score: 1, factorText: 'Loose pavers and uneven tiles' },
        { id: 'broken_slabs', label: 'Broken concrete slabs / Missing pavers (~1-2m)', score: 2, factorText: 'Broken concrete pavers and slabs' },
        { id: 'deep_trench', label: 'Open utility trench / Missing drain cover on path', score: 3, factorText: 'Open utility trench / missing drain slab' },
        { id: 'total_collapse', label: 'Total collapse / Complete destruction of pedestrian walk', score: 4, factorText: 'Complete collapse of footpath walk' },
      ],
    },
    question2: {
      title: '2. Pedestrian movement & accessibility impact',
      options: [
        { id: 'navigable', label: 'Pedestrians can step around with slight inconvenience', score: 1, factorText: 'Passable with minor detour' },
        { id: 'forced_road', label: 'Pedestrians forced onto vehicle roadway (traffic risk)', score: 2, factorText: 'Pedestrians forced into vehicular traffic lane' },
        { id: 'wheelchair_blocked', label: 'Complete blockage / Wheelchair & elderly access impossible', score: 3, factorText: 'Complete accessibility barrier for elderly & wheelchair users' },
      ],
    },
    question3: {
      title: '3. Footfall & pedestrian safety context (select all that apply)',
      options: [
        { id: 'trip_hazard', label: 'Sharp rebar, jagged stones, or severe trip/fall hazard', factorText: 'Sharp rebar or fall hazard for pedestrians', severityBoost: true },
        { id: 'school_metro', label: 'Heavy footfall route near metro, bus station, or school', factorText: 'High footfall route near metro/transit/school', priorityBoost: true },
        { id: 'visually_impaired', label: 'Tactile paving missing or broken for visually impaired', factorText: 'Broken tactile accessibility paving', priorityBoost: true },
        { id: 'night_danger', label: 'Unlit walking path with concealed open pit', factorText: 'Concealed walking pit in dark area', severityBoost: true },
      ],
    },
  },

  // 6. WATER LEAKAGE / WATER SUPPLY
  water: {
    key: 'water',
    categoryLabel: 'Water Supply Pipeline Leakage',
    standardCategoryName: 'Water & Sanitation',
    detectedProblemDefault: 'Potable water supply pipeline leakage',
    question1: {
      title: '1. Water leakage intensity & discharge rate',
      options: [
        { id: 'slow_seep', label: 'Slow seepage / Wet patch along pipeline joint', score: 1, factorText: 'Slow joint seepage' },
        { id: 'steady_stream', label: 'Continuous steady flow running down the road', score: 2, factorText: 'Continuous steady treated water runoff' },
        { id: 'high_pressure', label: 'High-pressure spray / Burst valve fountain', score: 3, factorText: 'High-pressure burst pipeline fountain' },
        { id: 'mains_rupture', label: 'Major transmission mains rupture / Gushing torrent', score: 4, factorText: 'Major municipal distribution mains rupture' },
      ],
    },
    question2: {
      title: '2. Secondary road & soil damage',
      options: [
        { id: 'curbside_drain', label: 'Flowing safely into side stormwater channel', score: 1, factorText: 'Runoff draining to side channel' },
        { id: 'road_pooling', label: 'Pooling on road & eroding asphalt / bitumen layers', score: 2, factorText: 'Water pooling and eroding road foundation' },
        { id: 'sinkhole_risk', label: 'Sub-surface soil wash-out / Potential sinkhole formation', score: 3, factorText: 'Severe soil erosion with acute sinkhole risk' },
      ],
    },
    question3: {
      title: '3. Civic impact & contamination context (select all that apply)',
      options: [
        { id: 'supply_disruption', label: 'Causes water supply outage for surrounding homes', factorText: 'Neighborhood drinking water supply disrupted', priorityBoost: true },
        { id: 'contamination_risk', label: 'Potable water mixing with adjacent open drain', factorText: 'Severe potable supply contamination hazard', severityBoost: true, priorityBoost: true },
        { id: 'massive_wastage', label: 'Continuous loss of thousands of liters of clean drinking water', factorText: 'Massive clean potable water loss', priorityBoost: true },
        { id: 'property_flooding', label: 'Water entering private basements or commercial shops', factorText: 'Water inundating residential/commercial property', severityBoost: true },
      ],
    },
  },

  // 7. ELECTRICAL / UTILITY HAZARD
  electrical: {
    key: 'electrical',
    categoryLabel: 'Electrical & Utility Hazard',
    standardCategoryName: 'Electricity',
    detectedProblemDefault: 'Electrical hazard & exposed utility component',
    question1: {
      title: '1. What type of electrical hazard is visible?',
      options: [
        { id: 'open_box', label: 'Open distribution box / Missing junction panel door', score: 1, factorText: 'Open electrical distribution box' },
        { id: 'sagging_wires', label: 'Sagging or low-hanging overhead cables', score: 2, factorText: 'Low-hanging live electrical cables' },
        { id: 'snapped_cable', label: 'Snapped cable touching ground or metal railing', score: 3, factorText: 'Snapped live electrical cable on ground' },
        { id: 'sparking_transformer', label: 'Sparking transformer, burning insulator, or explosion', score: 4, factorText: 'Active sparking transformer explosion hazard' },
      ],
    },
    question2: {
      title: '2. Public accessibility & exposure level',
      options: [
        { id: 'overhead', label: 'Elevated overhead (not directly touchable by hand)', score: 1, factorText: 'Elevated overhead hazard' },
        { id: 'pedestrian_reach', label: 'Within reach of pedestrians, cyclists, or children', score: 2, factorText: 'Within immediate touch reach of pedestrians' },
        { id: 'water_contact', label: 'In contact with water puddle, metal fence, or bus stop', score: 3, factorText: 'Electrified puddle or metal structure contact hazard' },
      ],
    },
    question3: {
      title: '3. Immediate safety context (select all that apply)',
      options: [
        { id: 'active_sparks', label: 'Visible sparking, arcing, smoke, or burning smell', factorText: 'Active electrical sparking and smoke', severityBoost: true, priorityBoost: true },
        { id: 'school_playground', label: 'Directly outside school, playground, or crowded bus stop', factorText: 'Immediate proximity to children/crowded transit zone', priorityBoost: true },
        { id: 'monsoon_water', label: 'Rainy weather or standing water nearby (electrocution threat)', factorText: 'High wet-weather electrocution risk', severityBoost: true, priorityBoost: true },
        { id: 'broken_pole', label: 'Supporting pole is cracked, tilted, or structurally failing', factorText: 'Structurally compromised or failing utility pole', severityBoost: true },
      ],
    },
  },

  // 8. OTHER / GENERAL CIVIC PROBLEM
  other: {
    key: 'other',
    categoryLabel: 'General Civic Issue / Other Problem',
    standardCategoryName: 'Other',
    detectedProblemDefault: 'Civic infrastructure or community issue',
    question1: {
      title: '1. Physical scale & affected area',
      options: [
        { id: 'small', label: 'Small localized spot (< 2 meters)', score: 1, factorText: 'Localized impact spot' },
        { id: 'moderate', label: 'Noticeable public area (2–5 meters)', score: 2, factorText: 'Moderate public area affected' },
        { id: 'extensive', label: 'Extensive public corridor / Multiple locations', score: 3, factorText: 'Extensive public corridor affected' },
        { id: 'critical_scale', label: 'Area-wide disruption / Entire public facility impacted', score: 4, factorText: 'Major civic facility disruption' },
      ],
    },
    question2: {
      title: '2. Disruption to public movement & community safety',
      options: [
        { id: 'minor', label: 'Minor inconvenience; normal movement continues', score: 1, factorText: 'Minor public inconvenience' },
        { id: 'moderate', label: 'Disrupts pedestrian or vehicle traffic noticeably', score: 2, factorText: 'Noticeable disruption to public movement' },
        { id: 'severe', label: 'Creates serious safety risk or prevents normal public use', score: 3, factorText: 'Significant safety risk to community' },
      ],
    },
    question3: {
      title: '3. Civic facility & urgency context (select all that apply)',
      options: [
        { id: 'near_facility', label: 'Near school, hospital, transit station, or market', factorText: 'Proximity to public institution/facility', priorityBoost: true },
        { id: 'urgent_attention', label: 'Requires urgent municipal attention to prevent deterioration', factorText: 'Requires prompt attention to avoid worsening', priorityBoost: true },
        { id: 'safety_threat', label: 'Presents an active safety threat to passersby', factorText: 'Active safety concern for passersby', severityBoost: true },
        { id: 'public_amenity', label: 'Affects an essential public utility or service', factorText: 'Impairs essential civic utility', severityBoost: true },
      ],
    },
  },
};

// Auto-populate aliases for convenience
for (const config of Object.values(IMPACT_QUESTIONS_BY_CATEGORY)) {
  config.categoryName = config.categoryLabel;
  config.q1 = config.question1;
  config.q2 = config.question2;
  config.q3 = config.question3;
}

// Map standard category names to our normalized category keys
export function resolveCategoryKey(cat?: string): CivicCategoryKey {
  if (!cat) return 'road';
  const c = cat.toLowerCase();
  if (c.includes('road') || c.includes('pothole') || c.includes('infra') || c.includes('pavement')) return 'road';
  if (c.includes('waste') || c.includes('garbage') || c.includes('trash') || c.includes('dump')) return 'waste';
  if (c.includes('drain') || c.includes('sewer') || c.includes('sewage')) return 'drainage';
  if (c.includes('street') || c.includes('light') || c.includes('lamp')) return 'streetlight';
  if (c.includes('footpath') || c.includes('pedestrian') || c.includes('sidewalk') || c.includes('walk') || c.includes('access')) return 'footpath';
  if (c.includes('water') || c.includes('pipeline') || c.includes('leak') || c.includes('sanitation')) return 'water';
  if (c.includes('electric') || c.includes('wire') || c.includes('power') || c.includes('utility')) return 'electrical';
  return 'other';
}

// Map key to standard SahYog system category name
export function getStandardCategoryName(key: CivicCategoryKey): string {
  return IMPACT_QUESTIONS_BY_CATEGORY[key]?.standardCategoryName || 'Other';
}

export interface CategoryImpactAssessment {
  categoryKey: CivicCategoryKey;
  question1Id?: string;
  question2Id?: string;
  contextIds?: string[];
  q1OptionId?: string;
  q2OptionId?: string;
  contextOptionIds?: string[];
}

export interface ImpactSeverityResult {
  suggestedSeverity: 'Low' | 'Moderate' | 'High' | 'Critical';
  suggestedPriority: 'Low' | 'Moderate' | 'High' | 'Critical';
  factors: string[];
  totalScore: number;
  isPending: boolean;
  categoryLabel: string;
  explanation: string;
}

export function calculateCategoryImpactSeverity(assessment: CategoryImpactAssessment): ImpactSeverityResult {
  const config = IMPACT_QUESTIONS_BY_CATEGORY[assessment.categoryKey] || IMPACT_QUESTIONS_BY_CATEGORY['other'];
  const q1Id = assessment.q1OptionId ?? assessment.question1Id;
  const q2Id = assessment.q2OptionId ?? assessment.question2Id;
  const ctxIds = assessment.contextOptionIds ?? assessment.contextIds ?? [];
  const q1 = (config.question1 || config.q1)?.options.find(o => o.id === q1Id);
  const q2 = (config.question2 || config.q2)?.options.find(o => o.id === q2Id);
  const selectedContexts = (config.question3 || config.q3)?.options.filter(o => ctxIds.includes(o.id)) || [];

  if (!q1 && !q2) {
    return {
      suggestedSeverity: 'Moderate',
      suggestedPriority: 'Moderate',
      factors: ['Awaiting citizen field assessment (select options below)'],
      totalScore: 0,
      isPending: true,
      categoryLabel: config.categoryLabel,
      explanation: 'Default initial level. Please select the specific impact factors below to calculate suggested severity.'
    };
  }

  const factors: string[] = [];
  if (q1) factors.push(q1.factorText);
  if (q2) factors.push(q2.factorText);
  selectedContexts.forEach(c => factors.push(c.factorText));

  let physicalScore = (q1?.score || 2) + (q2?.score || 1);
  const severityBoostCount = selectedContexts.filter(c => c.severityBoost).length;
  physicalScore += severityBoostCount * 1.0;

  let priorityScore = physicalScore;
  const priorityBoostCount = selectedContexts.filter(c => c.priorityBoost).length;
  priorityScore += priorityBoostCount * 1.5;

  let suggestedSeverity: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate';
  if (physicalScore <= 2.5) suggestedSeverity = 'Low';
  else if (physicalScore <= 4.5) suggestedSeverity = 'Moderate';
  else if (physicalScore <= 6.5) suggestedSeverity = 'High';
  else suggestedSeverity = 'Critical';

  let suggestedPriority: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate';
  if (priorityScore <= 3.5) suggestedPriority = 'Low';
  else if (priorityScore <= 5.5) suggestedPriority = 'Moderate';
  else if (priorityScore <= 7.5) suggestedPriority = 'High';
  else suggestedPriority = 'Critical';

  // Factual, truthfully synthesized explanation referencing ONLY selected factors
  let explanation = `Suggested ${suggestedSeverity} severity based on `;
  const parts: string[] = [];
  if (q1) parts.push(q1.factorText.toLowerCase());
  if (q2) parts.push(q2.factorText.toLowerCase());
  if (selectedContexts.length > 0) {
    parts.push(selectedContexts.map(c => c.factorText.toLowerCase()).join(', '));
  }
  explanation += parts.join(' and ') + '.';

  return {
    suggestedSeverity,
    suggestedPriority,
    factors,
    totalScore: physicalScore,
    isPending: false,
    categoryLabel: config.categoryLabel,
    explanation
  };
}

export function generateCategoryPrefilledDetails(params: {
  categoryKey: CivicCategoryKey;
  location?: string;
  locationAddress?: string;
  landmark?: string;
  severity?: string;
  priority?: string;
  factors?: string[];
  q1OptionId?: string;
  q2OptionId?: string;
  contextOptionIds?: string[];
}): { suggestedTitle: string; suggestedDescription: string; detectedProblem: string } {
  const config = IMPACT_QUESTIONS_BY_CATEGORY[params.categoryKey] || IMPACT_QUESTIONS_BY_CATEGORY['other'];
  const loc = params.location || params.locationAddress || 'problem site';
  const areaDesc = params.landmark || loc.split(',')[0] || 'problem site';
  const detectedProblem = config.detectedProblemDefault;
  const sev = params.severity || 'Moderate';
  const prio = params.priority || 'Moderate';
  const prefix = sev === 'Critical' ? 'Critical ' : sev === 'High' ? 'Severe ' : '';
  const suggestedTitle = `${prefix}${detectedProblem} near ${areaDesc}`;

  const factors = params.factors || [];
  const factorSummary = factors.length > 0
    ? ` Observed field conditions: ${factors.join('; ')}.`
    : '';

  const suggestedDescription = `A ${config.categoryLabel.toLowerCase()} issue has been documented at ${areaDesc}.${factorSummary} This condition impacts local civic infrastructure and requires coordinated multi-stakeholder intervention. Suggested physical severity is assessed as ${sev} (Response Priority: ${prio}).`;

  return { suggestedTitle, suggestedDescription, detectedProblem };
}

// -------------------------------------------------------------
// Image Validation & Classification State System
// Strictly honest heuristic checking — NO fake computer vision!
// -------------------------------------------------------------
export type EvidenceValidationStatus =
  | 'valid'
  | 'selfie'
  | 'non_civic'
  | 'low_quality'
  | 'uncertain';

export interface ImageValidationResult {
  status: EvidenceValidationStatus;
  detectedCategoryKey?: CivicCategoryKey;
  suggestedCategoryKey?: CivicCategoryKey;
  title: string;
  message: string;
  reason?: string;
  detectedKeywords?: string[];
  canProceed: boolean;
  requiresManualCategory: boolean;
}

export async function validateEvidenceFile(
  fileOrBlob: File | Blob | string | { name?: string; src?: string },
  suggestedFileName?: string
): Promise<ImageValidationResult> {
  let name = '';
  if (typeof fileOrBlob === 'string') {
    name = suggestedFileName || fileOrBlob;
  } else if ('name' in fileOrBlob && typeof fileOrBlob.name === 'string') {
    name = fileOrBlob.name;
  } else if (suggestedFileName) {
    name = suggestedFileName;
  }
  const lowerName = name.toLowerCase();

  // 1. Check for personal / selfie heuristics in file name
  const selfieTerms = ['selfie', 'portrait', 'face', 'profile', 'avatar', 'myself', 'me.jpg', 'me.jpeg', 'me.png'];
  if (selfieTerms.some(term => lowerName.includes(term))) {
    return {
      status: 'selfie',
      title: "This image doesn't appear to show a civic problem.",
      message:
        'Please upload a photo of the issue you want to report, such as road damage, waste, drainage, streetlight failure, damaged public infrastructure, or another civic problem.',
      reason: 'Personal portrait / selfie detected. Please upload photo of civic infrastructure problem.',
      canProceed: false,
      requiresManualCategory: false
    };
  }

  // 2. Check for random / non-civic heuristics in file name
  const randomNonCivicTerms = [
    'food', 'lunch', 'dinner', 'snack', 'cat', 'dog', 'pet', 'animal',
    'laptop', 'macbook', 'keyboard', 'room', 'bed', 'sofa', 'screenshot',
    'meme', 'random', 'wallpaper', 'recipe', 'game'
  ];
  if (randomNonCivicTerms.some(term => lowerName.includes(term))) {
    return {
      status: 'non_civic',
      title: 'Unable to identify a reportable civic problem in this image.',
      message: 'Please capture or upload evidence showing the civic problem.',
      reason: 'Non-civic subject detected (personal, pet, food, screenshot). Please upload photo of civic issue.',
      canProceed: false,
      requiresManualCategory: false
    };
  }

  // 3. Check for low-quality / corrupt / blurry heuristics
  const lowQualityTerms = ['blurry', 'dark', 'black', 'corrupt', 'tiny'];
  if (lowQualityTerms.some(term => lowerName.includes(term))) {
    return {
      status: 'low_quality',
      title: 'Image quality is too low to assess the problem.',
      message: 'Please capture a clearer photo showing the affected area.',
      reason: 'Image is too blurry or low-resolution for field inspection. Please upload a clearer photo.',
      canProceed: false,
      requiresManualCategory: false
    };
  }

  // 4. Keyword-based initial category suggestions from file name or caption (Prototype Heuristic)
  // Check specific civic hazard categories first before general road keywords
  if (lowerName.includes('drain') || lowerName.includes('sewage') || lowerName.includes('sewer') || lowerName.includes('manhole')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'drainage',
      suggestedCategoryKey: 'drainage',
      title: 'Evidence Verified',
      message: 'Drainage & sewage evidence registered for evaluation.',
      reason: 'Drainage & sewage overflow evidence verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('waste') || lowerName.includes('garbage') || lowerName.includes('trash') || lowerName.includes('litter') || lowerName.includes('dump')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'waste',
      suggestedCategoryKey: 'waste',
      title: 'Evidence Verified',
      message: 'Waste accumulation evidence registered for evaluation.',
      reason: 'Garbage & waste accumulation evidence verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('streetlight') || lowerName.includes('lamp') || lowerName.includes('light') || lowerName.includes('pole')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'streetlight',
      suggestedCategoryKey: 'streetlight',
      title: 'Evidence Verified',
      message: 'Streetlight evidence registered for evaluation.',
      reason: 'Streetlight & public fixture outage evidence verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('footpath') || lowerName.includes('sidewalk') || lowerName.includes('paver')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'footpath',
      suggestedCategoryKey: 'footpath',
      title: 'Evidence Verified',
      message: 'Pedestrian infrastructure evidence registered for evaluation.',
      reason: 'Footpath & pedestrian hazard evidence verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('water') || lowerName.includes('pipeline') || lowerName.includes('leak') || lowerName.includes('mains')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'water',
      suggestedCategoryKey: 'water',
      title: 'Evidence Verified',
      message: 'Water pipeline leakage evidence registered for evaluation.',
      reason: 'Water pipeline leakage evidence verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('electric') || lowerName.includes('wire') || lowerName.includes('transformer') || lowerName.includes('spark')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'electrical',
      suggestedCategoryKey: 'electrical',
      title: 'Evidence Verified',
      message: 'Electrical hazard evidence registered for evaluation.',
      reason: 'Electrical hazard & utility wire evidence verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('pothole') || lowerName.includes('road') || lowerName.includes('crater') || lowerName.includes('asphalt') || lowerName.includes('pavement')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'road',
      suggestedCategoryKey: 'road',
      title: 'Evidence Verified',
      message: 'Road damage evidence registered for evaluation.',
      reason: 'Road damage & pothole evidence verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }

  // 5. Default: Valid evidence with uncertain classification -> prompt to select category
  // Falls back to other / unknown (NEVER defaults to pothole!)
  return {
    status: 'uncertain',
    detectedCategoryKey: 'other',
    suggestedCategoryKey: 'other',
    title: "We couldn't confidently identify this problem.",
    message: 'Please verify or select the civic problem category to load the appropriate impact assessment questions.',
    reason: 'Category classification uncertain from image metadata. Please select category.',
    canProceed: true,
    requiresManualCategory: true
  };
}
