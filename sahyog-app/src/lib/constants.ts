import type { Problem, Solution, OrgMatch } from './types';

export const CATEGORIES = [
  'Waste Management','Roads & Infrastructure','Water & Sanitation','Electricity',
  'Public Transport','Healthcare','Education','Environment','Public Safety',
  'Agriculture','Accessibility','Pollution','Drainage','Street Lighting','Other'
];

export const CATEGORY_COLOR: Record<string, string> = {
  'Waste Management':'#178A56','Roads & Infrastructure':'#B5750B','Water & Sanitation':'#14548F',
  'Electricity':'#6A4CA0','Public Transport':'#0C7C8C','Healthcare':'#B3261E','Education':'#8A5A2B',
  'Environment':'#2E8B57','Public Safety':'#A83232','Agriculture':'#5B8C2A','Accessibility':'#4A6FA5',
  'Pollution':'#6B6B6B','Drainage':'#1E6FA8','Street Lighting':'#C08A1E','Other':'#556070'
};

export const SUBCATEGORY: Record<string, string> = {
  'Waste Management':'Garbage Overflow','Roads & Infrastructure':'Road Damage',
  'Water & Sanitation':'Water Leakage','Electricity':'Power Outage',
  'Public Transport':'Service Gap','Healthcare':'Facility Issue',
  'Education':'Infrastructure Gap','Environment':'Ecological Concern',
  'Public Safety':'Safety Hazard','Agriculture':'Crop/Field Issue',
  'Accessibility':'Access Barrier','Pollution':'Emission Concern',
  'Drainage':'Drainage Blockage','Street Lighting':'Fixture Outage','Other':'General'
};

export const AUTHORITY: Record<string, string> = {
  'Waste Management':'Municipal Waste Management Department',
  'Roads & Infrastructure':'Public Works Department',
  'Water & Sanitation':'Water Supply & Sewerage Board',
  'Electricity':'State Electricity Board',
  'Public Transport':'Regional Transport Authority',
  'Healthcare':'District Health Department',
  'Education':'Department of Education',
  'Environment':'State Pollution Control Board',
  'Public Safety':'Local Police & Civic Authority',
  'Agriculture':'Department of Agriculture',
  'Accessibility':'Urban Accessibility Cell',
  'Pollution':'State Pollution Control Board',
  'Drainage':'Municipal Drainage Division',
  'Street Lighting':'Municipal Electrical Wing',
  'Other':'General Administration'
};

export const AUTH_REASON: Record<string, string> = {
  'Waste Management':'This department is responsible for waste collection and sanitation services in the selected area.',
  'Roads & Infrastructure':'This department is responsible for road maintenance and public infrastructure in the selected area.',
  'Water & Sanitation':'This board is responsible for water supply and sewerage systems in the selected area.',
  'Drainage':'This division is responsible for stormwater and drainage systems in the selected area.'
};

export const RECOMMENDED_ACTION: Record<string, string> = {
  'Waste Management':'Field verification and waste collection assessment.',
  'Roads & Infrastructure':'Site inspection and repair cost estimation.',
  'Water & Sanitation':'Leak inspection and pipeline assessment.',
  'Drainage':'Drainage survey and blockage clearance.'
};

export const KEYWORDS: Record<string, string[]> = {
  'Waste Management':['garbage','trash','waste','dump','litter','overflow'],
  'Roads & Infrastructure':['road','pothole','pavement','bridge','crack'],
  'Water & Sanitation':['water','leak','sewage','sanitation','pipe'],
  'Electricity':['power','electric','transformer','wire','outage'],
  'Public Transport':['bus','transport','auto','station','rickshaw'],
  'Healthcare':['hospital','clinic','medicine','healthcare','doctor'],
  'Education':['school','college','classroom','teacher','education'],
  'Environment':['tree','forest','pollution','air','environment'],
  'Public Safety':['unsafe','crime','accident','safety','danger'],
  'Agriculture':['crop','farmer','irrigation','field','agriculture'],
  'Accessibility':['wheelchair','ramp','accessibility','disabled'],
  'Pollution':['smoke','pollution','smog','fumes','industrial'],
  'Drainage':['drain','flood','waterlogged','overflow','drainage'],
  'Street Lighting':['streetlight','light','lamp','dark','bulb']
};

export const ORG_POOL: Record<string, Omit<OrgMatch,'score'>[]> = {
  'Roads & Infrastructure': [
    {
      name: 'Greater Hyderabad Municipal Corporation (GHMC) / PWD Wing',
      type: 'Government',
      roleInProblem: 'Statutory Authority & Final Validation',
      expertise: 'Urban road maintenance & statutory municipal oversight',
      location: 'Rajendranagar Circle Office, Hyderabad',
      resources: 'Heavy road repair machinery, civic inspection team, municipal budget',
      projects: 'Municipal road network oversight & statutory maintenance mandate (DEMO DATA)',
      reasons: ['Statutory jurisdiction over Himayat Sagar arterial roads', 'Mandated authority for civic infrastructure approval'],
      factors: { domain: 38, jurisdiction: 28, expertise: 18, capacity: 10 }
    },
    {
      name: 'LIET Sustainable Infrastructure & Materials Lab',
      type: 'University',
      roleInProblem: 'Research & Low-Cost Materials Formulation',
      expertise: 'Polymer-modified cold asphalt & fast-curing composite patch formulations',
      location: "Lord's Institute of Engineering & Technology, Hyderabad",
      resources: 'Materials testing lab, student technical squad, core testing apparatus',
      projects: 'Polymer cold-mix research & pavement durability testing capability (DEMO DATA)',
      reasons: ['Immediate campus proximity to problem site', 'Specialized cold-mix fast-curing asphalt research'],
      factors: { domain: 36, jurisdiction: 26, expertise: 17, capacity: 8 }
    },
    {
      name: 'Deccan InfraTech Road Solutions Ltd.',
      type: 'Industry',
      roleInProblem: 'Material Supply & Rapid Mechanized Deployment',
      expertise: 'Rapid pothole compaction technology & industrial cold-mix supply',
      location: 'Kattedan Industrial Area, Hyderabad',
      resources: 'Compactor trucks, rapid thermal patchers, field workforce',
      projects: 'Industrial asphalt production & mechanized road compaction fleet (DEMO DATA)',
      reasons: ['Local manufacturing of rapid cold-mix composite', 'Quick-response field deployment crew within 8km'],
      factors: { domain: 34, jurisdiction: 24, expertise: 16, capacity: 8 }
    },
    {
      name: 'SafeRoads Community Safety Action Foundation',
      type: 'NGO',
      roleInProblem: 'Citizen Awareness & On-Ground Safety Liaison',
      expertise: 'Pedestrian safety audits, volunteer coordination & road marking',
      location: 'Mehdipatnam, Hyderabad',
      resources: 'Community volunteer network, reflective safety signage gear',
      projects: 'Pedestrian safety audits & community volunteer liaison (DEMO DATA)',
      reasons: ['Active civic volunteer presence in South Hyderabad', 'Liaison capability for citizen verification surveys'],
      factors: { domain: 30, jurisdiction: 25, expertise: 14, capacity: 7 }
    }
  ],
  'Waste Management': [
    {
      name: 'Municipal Solid Waste Management Directorate',
      type: 'Government',
      roleInProblem: 'Statutory Civic Sanitation & Zoning',
      expertise: 'Scheduled route collection, dumping oversight, municipal zoning',
      location: 'City Zone Office',
      resources: 'Compactor vehicles, sanitation crew, disposal permits',
      projects: 'Zonal sanitation planning & scheduled route collection oversight (DEMO DATA)',
      reasons: ['Direct civic mandate for zone sanitation', 'Authority for waste disposal routing'],
      factors: { domain: 38, jurisdiction: 28, expertise: 18, capacity: 10 }
    },
    {
      name: 'GreenTech Environmental Engineering Lab',
      type: 'University',
      roleInProblem: 'Smart IoT Fill-Level Sensing & Optimization',
      expertise: 'Waste volume estimation, IoT sensor prototypes, composting science',
      location: 'City Institute of Technology',
      resources: 'IoT lab, ultrasonic sensor nodes, student data team',
      projects: 'IoT fill-level telemetry & organic composting science (DEMO DATA)',
      reasons: ['Smart bin telemetry research', 'Prior localized waste optimization models'],
      factors: { domain: 35, jurisdiction: 26, expertise: 18, capacity: 8 }
    },
    {
      name: 'ClearCity Recycling & Resource Recovery',
      type: 'Industry',
      roleInProblem: 'Secondary Processing & Rapid Collection Fleet',
      expertise: 'Mechanized waste segregation & material recycling',
      location: 'Industrial Estate, Hyderabad',
      resources: 'Segregation units, secondary collection vans',
      projects: 'Mechanized waste sorting & secondary resource recovery capability (DEMO DATA)',
      reasons: ['Private recycling capacity', 'Available on-demand secondary logistics'],
      factors: { domain: 33, jurisdiction: 25, expertise: 16, capacity: 8 }
    },
    {
      name: 'Swachh Ward Citizen Volunteer Network',
      type: 'NGO',
      roleInProblem: 'Door-to-Door Citizen Segregation Awareness',
      expertise: 'Community mobilization & source-segregation workshops',
      location: 'Zone 4 Civic Center',
      resources: '50+ community volunteers, bilingual educational material',
      projects: 'Grassroots community mobilization & segregation liaison (DEMO DATA)',
      reasons: ['Grassroots presence in residential sector', 'Assistance in ground verification'],
      factors: { domain: 30, jurisdiction: 26, expertise: 13, capacity: 7 }
    }
  ],
  'Water & Sanitation': [
    {
      name: 'Hyderabad Metropolitan Water Supply & Sewerage Board (HMWSSB)',
      type: 'Government',
      roleInProblem: 'Statutory Pipeline Authority',
      expertise: 'Municipal mains supply lines & sewerage infrastructure',
      location: 'Central Water Board Office',
      resources: 'Pipeline repair teams, emergency isolation valves',
      projects: 'Statutory municipal pipeline authority & valve isolation custody (DEMO DATA)',
      reasons: ['Statutory custody of distribution pipelines', 'Mandated authority for supply shutdowns'],
      factors: { domain: 38, jurisdiction: 28, expertise: 18, capacity: 10 }
    },
    {
      name: 'AquaTech Water Engineering Research Center',
      type: 'University',
      roleInProblem: 'Acoustic Leak Detection & Pressure Modeling',
      expertise: 'Hydraulic modeling, acoustic leak detection algorithms',
      location: 'Institute of Engineering & Tech',
      resources: 'Acoustic leak loggers, flow simulation software',
      projects: 'Acoustic leak detection algorithms & pressure surge modeling (DEMO DATA)',
      reasons: ['Specialized non-invasive pipeline assessment', 'Student research support'],
      factors: { domain: 36, jurisdiction: 25, expertise: 18, capacity: 8 }
    },
    {
      name: 'HydroFix Industrial Piping & Valving',
      type: 'Industry',
      roleInProblem: 'Trenchless Repair & Composite Sleeving',
      expertise: 'Trenchless slip-lining & rapid composite pipe clamping',
      location: 'Cherlapally Industrial Area',
      resources: 'Trenchless boring units, composite sleeves',
      projects: 'Trenchless slip-lining & composite pipe clamping capability (DEMO DATA)',
      reasons: ['No-dig repair capabilities avoiding road excavation', 'Quick deployment response'],
      factors: { domain: 34, jurisdiction: 24, expertise: 16, capacity: 8 }
    }
  ],
  'default': [
    {
      name: 'District Civic Administrative Authority',
      type: 'Government',
      roleInProblem: 'Statutory Verification & Oversight',
      expertise: 'Zonal civic administration & inter-departmental routing',
      location: 'District Administration Complex',
      resources: 'Field inspection officers, municipal liaison staff',
      projects: 'Zonal administrative routing & multi-departmental coordination (DEMO DATA)',
      reasons: ['General statutory responsibility for civic infrastructure'],
      factors: { domain: 36, jurisdiction: 26, expertise: 16, capacity: 10 }
    },
    {
      name: 'Urban Innovation & Applied Engineering Cell',
      type: 'University',
      roleInProblem: 'Technical Assessment & Design Prototype',
      expertise: 'Applied societal engineering & low-cost solution prototyping',
      location: 'City Engineering College',
      resources: 'Prototyping makerspace, faculty advisory panel',
      projects: 'Low-cost societal engineering prototyping & makerspace research (DEMO DATA)',
      reasons: ['Interdisciplinary engineering student project capability'],
      factors: { domain: 34, jurisdiction: 25, expertise: 16, capacity: 8 }
    },
    {
      name: 'Local Engineering & Contracting Partner',
      type: 'Industry',
      roleInProblem: 'Field Procurement & Execution',
      expertise: 'Turnkey civic civil and electrical execution',
      location: 'Regional Hub',
      resources: 'Equipment crews, field workforce',
      projects: 'Turnkey civic electrical & civil field execution crew (DEMO DATA)',
      reasons: ['On-ground deployment capability in municipal jurisdiction'],
      factors: { domain: 32, jurisdiction: 24, expertise: 15, capacity: 8 }
    }
  ]
};

export const STAGES = [
  'Reported',
  'Verified',
  'Matched',
  'Collaborating',
  'Solution Proposed',
  'Approved',
  'In Deployment',
  'Resolved',
  'Citizen Verified'
];

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const DEMO_LOCATION = {
  address: "Lord's Institute of Engineering & Technology, Himayat Sagar Road, Hyderabad, Telangana 500091",
  lat: 17.3486,
  lng: 78.3683,
  landmark: "Near College Main Gate, Himayat Sagar Junction"
};

export const DEMO_METRICS = [
  { value: '8', label: 'Structured Demo Cases', sub: 'Multi-category test suite' },
  { value: '5', label: 'Stakeholder Roles', sub: 'Citizen · Govt · Univ · Industry · NGO' },
  { value: '4', label: 'Solver Sectors', sub: 'Multi-stakeholder collaboration' },
  { value: 'Verified', label: 'Closed-Loop Workflow', sub: 'Citizen sign-off before case closure' }
];

function makeId(n: number) { return 'SY-2026-' + String(n).padStart(5,'0'); }

function sampleSvg(label: string, sub: string): string {
  const esc = (v: string) => String(v||'').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]??c));
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><rect width="100%" height="100%" fill="#eef3f8"/><rect x="25" y="25" width="850" height="510" rx="16" fill="#d9e5f2" stroke="#b4c7dc" stroke-width="2"/><circle cx="450" cy="240" r="70" fill="#14548f" opacity=".12"/><path d="M420 240 L445 265 L485 215" stroke="#178a56" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="450" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="28" fill="#14548f">${esc(label)}</text><text x="450" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#52647c">${esc(sub)}</text><rect x="340" y="425" width="220" height="34" rx="17" fill="#14548f"/><text x="450" y="448" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#ffffff">SIH 2026 DEMO EVIDENCE</text></svg>`
  );
}

export const INITIAL_PROBLEMS: Problem[] = [
  {
    id: 'SY-2026-00101',
    title: 'Severe Road Damage & Potholes at College Main Entrance',
    desc: 'Deep surface depressions and broken bitumen have formed right outside the college main entrance gate along Himayat Sagar arterial road. Potholes cause severe skidding risks for students on two-wheelers, pedestrian stumbling, and massive waterlogging during rains.',
    category: 'Roads & Infrastructure',
    location: "Lord's Institute of Engg & Tech, Himayat Sagar, Hyderabad",
    affected: '~450 daily students & commuters (Demo Context)',
    severity: 'High',
    stage: 4, // Solution Proposed
    date: 'Today',
    landmark: 'Near LIET Main Campus Gate, Himayat Sagar',
    datetime: '2026-09-21T09:30',
    lat: 17.3486,
    lng: 78.3683,
    mapX: 48,
    mapY: 42,
    photos: [
      { src: '/demo/pothole_before.jpg', isVideo: false, name: 'college_gate_pothole_evidence.jpg' }
    ],
    solutions: [
      {
        id: 'SOL-LIET-01',
        title: 'Rapid Polymer Cold-Mix Patching with Engineered Base Stabilization',
        org: 'LIET Sustainable Infrastructure & Materials Lab (with Deccan InfraTech)',
        status: 'Under Review',
        desc: 'Fast-curing cold composite asphalt patching developed by university researchers, utilizing crumb rubber modified binder for high monsoon water resistance. Deccan InfraTech provides mechanized compaction equipment for rapid 4-hour night deployment without blocking daytime traffic.',
        tech: 'Polymer Cold-Mix Composite + Mechanized Vibratory Compaction',
        cost: '₹42,000 (Research subsidized)',
        time: '3 working days',
        impact: '~450 daily commuters, zero college entrance traffic disruptions'
      }
    ],
    verification: null
  },
  {
    id: makeId(120),
    title: 'Damaged road & cracked culvert, Sector 9 crossing',
    desc: 'Deep depressions and broken culvert masonry near Sector 9 crossing after heavy rains, causing traffic bottlenecks and vehicle underbody damage.',
    category: 'Roads & Infrastructure',
    location: 'Sector 9 Crossing, Pune',
    affected: 420,
    severity: 'High',
    stage: 2, // Matched & Assigned
    date: '4 Sept 2026',
    mapX: 55,
    mapY: 22,
    photos: [],
    solutions: [],
    verification: null
  },
  {
    id: makeId(121),
    title: 'Water supply mains leakage near bus stand',
    desc: 'Treated water pipeline connection has fractured near platform 3, releasing continuous water runoff and eroding the concrete pedestrian footpath.',
    category: 'Water & Sanitation',
    location: 'Majestic Bus Terminal, Bengaluru',
    affected: 260,
    severity: 'Medium',
    stage: 3,
    date: '5 Sept 2026',
    mapX: 42,
    mapY: 58,
    photos: [],
    solutions: [
      {
        id: 'S1',
        title: 'Composite pipe sleeving & pressure-relief valve install',
        org: 'AquaTech Water Engineering Research Center',
        status: 'Proposed',
        desc: 'Non-invasive composite patch sleeving with automated pressure-relief valve to prevent structural pressure surges.',
        tech: 'Composite pipe patching',
        cost: '₹85,000',
        time: '2 weeks',
        impact: '260+ daily commuters'
      }
    ],
    verification: null
  },
  {
    id: makeId(122),
    title: 'Stormwater drainage overflow during rainfall',
    desc: 'The primary stormwater drain channel overflows into residential boundary walls every time rainfall exceeds 20mm/hr due to sediment accumulation.',
    category: 'Drainage',
    location: 'Velachery Zone, Chennai',
    affected: 610,
    severity: 'High',
    stage: 4, // Approved
    date: '1 Sept 2026',
    mapX: 70,
    mapY: 44,
    photos: [],
    solutions: [
      {
        id: 'S2',
        title: 'Pre-cast concrete culvert widening & hydraulic desilting',
        org: 'Municipal Drainage Division',
        status: 'Approved',
        desc: 'Widen hydraulic channel cross-section with high-strength precast box culverts and automated silt trap mesh.',
        tech: 'Mechanical desilting + precast box culverts',
        cost: '₹4,20,000',
        time: '4 weeks',
        impact: '610+ neighborhood residents'
      }
    ],
    verification: null
  },
  {
    id: makeId(123),
    title: 'Sanitation facility repair & maintenance schedule',
    desc: 'The community public sanitation facility has broken fixtures, low water pressure, and lack of regular maintenance oversight.',
    category: 'Healthcare',
    location: 'Old City Ward, Hyderabad',
    affected: 90,
    severity: 'Low',
    stage: 5, // In Deployment
    date: '29 Aug 2026',
    mapX: 33,
    mapY: 66,
    photos: [],
    solutions: [
      {
        id: 'S3',
        title: 'Water-efficient fixture overhaul & community maintenance schedule',
        org: 'District Health & Sanitation Department',
        status: 'In Deployment',
        desc: 'Installation of vandal-resistant push taps, dual-flush cisterns, and a digital attendance log for daily cleaning shifts.',
        tech: 'Water-efficient fixtures + digital inspection log',
        cost: '₹18,000',
        time: '1 week',
        impact: '90+ neighborhood residents'
      }
    ],
    verification: null
  },
  {
    id: makeId(124),
    title: 'Overflowing municipal garbage near residential lane',
    desc: 'Solid municipal waste accumulated along boundary lane for 6 consecutive days, leading to odor, stray animal disturbance, and blocked walkway.',
    category: 'Waste Management',
    location: 'Banjara Hills Sector 4, Hyderabad',
    affected: 250,
    severity: 'High',
    stage: 7, // Citizen Verified
    date: '27 Aug 2026',
    mapX: 60,
    mapY: 70,
    photos: [],
    solutions: [
      {
        id: 'S4',
        title: 'Dual-compartment smart bins & scheduled morning route rerouting',
        org: 'ClearCity Recycling & Resource Recovery',
        status: 'Completed',
        desc: 'Added automated morning compactor stop, established source-segregation bins with neighborhood volunteer monitoring.',
        tech: 'Route optimization & dual segregation bins',
        cost: '₹1,10,000',
        time: '3 weeks',
        impact: '250+ residents'
      }
    ],
    verification: {
      resolved: true,
      comment: 'Citizen on-ground sign-off: Waste cleared on schedule every morning. No overflow observed for 2 weeks. Problem closed successfully.'
    }
  },
  {
    id: makeId(119),
    title: 'Broken street lighting on market transit corridor',
    desc: 'Six sequential LED street luminaires have ceased functioning along the secondary market approach road, creating severe night safety concerns.',
    category: 'Street Lighting',
    location: 'Charminar Market Road, Hyderabad',
    affected: 180,
    severity: 'Medium',
    stage: 1, // Verified
    date: '3 Sept 2026',
    mapX: 28,
    mapY: 34,
    photos: [],
    solutions: [],
    verification: null
  },
  {
    id: 'SY-2026-00106',
    title: 'Hazardous pedestrian crossing without signal or speed breaker',
    desc: 'School students and elderly residents face speeding vehicular traffic at an uncontrolled junction without pedestrian refuge island or rumble strips.',
    category: 'Public Safety',
    location: 'Mehdipatnam Junction, Hyderabad',
    severity: 'Critical',
    stage: 4, // Approved
    affected: 700,
    mapX: 72,
    mapY: 58,
    date: 'Yesterday',
    photos: [{ src: sampleSvg('Public Safety', 'Pedestrian Crossing Hazard (Demo Evidence)'), isVideo: false }],
    solutions: [
      {
        id: 'S5',
        title: 'Solar-powered flashing pedestrian beacons & high-friction thermoplastic rumble strips',
        org: 'SafeRoads Community Safety Action Foundation',
        status: 'Approved',
        desc: 'Installation of solar warning blinkers, reflective pedestrian bollards, and high-visibility zebra markings with student crossing guards.',
        tech: 'Solar LED Blinkers + Thermoplastic markings',
        cost: '₹65,000',
        time: '10 days',
        impact: '700+ daily pedestrians'
      }
    ],
    verification: null
  }
];

export const INITIAL_NOTIFICATIONS = [
  { text: 'Flagship Problem SY-2026-00101 (LIET Campus Gate Potholes) is ready for SIH demonstration.', unread: true },
  { text: 'LIET Sustainable Infrastructure Lab submitted a solution for SY-2026-00101.', unread: true },
  { text: 'Municipal Drainage Division solution for SY-2026-00122 was approved by Civic Authority.', unread: true },
  { text: 'SY-2026-00124 (Banjara Hills Waste) completed citizen on-ground verification.', unread: false }
];

export const WORKFLOW_STEPS = [
  'Capture Photo',
  'Location & Duplicates',
  'Impact & Severity',
  'Prefilled Details',
  'Review & Submit'
];

export const ROAD_AFFECTED_OPTIONS = [
  { id: 'small', label: 'Small section (< 1 meter)', score: 1, text: 'Small road section affected' },
  { id: 'part_lane', label: 'Part of a traffic lane (1–2 meters)', score: 2, text: 'Partial traffic lane affected' },
  { id: 'most_lane', label: 'Most of a traffic lane (2–3 meters)', score: 3, text: 'Major portion of traffic lane obstructed' },
  { id: 'multi_lane', label: 'Multiple lanes / Entire roadway (> 3 meters)', score: 4, text: 'Multiple lanes severely obstructed' },
] as const;

export const TRAFFIC_IMPACT_OPTIONS = [
  { id: 'none', label: 'No significant disruption (vehicles pass freely)', score: 1, text: 'Normal vehicle flow maintained' },
  { id: 'minor', label: 'Slight traffic slowdown / Swerving required', score: 2, text: 'Vehicles required to swerve; minor slowdown' },
  { id: 'severe', label: 'Severe congestion / Two-wheeler risk / Lane blockage', score: 3, text: 'Severe congestion with elevated two-wheeler skid hazard' },
] as const;

export const CONTEXT_PROXIMITY_OPTIONS = [
  { id: 'school_hospital', label: 'Near school, college or hospital zone', factor: 'Proximity to educational/healthcare facility', priorityBoost: true },
  { id: 'transit_stop', label: 'Near public bus stop or transit junction', factor: 'Public transit & bus stop proximity', priorityBoost: true },
  { id: 'pedestrian', label: 'Pedestrian-heavy market or zebra crossing', factor: 'High pedestrian footfall exposure', priorityBoost: true },
  { id: 'waterlogged', label: 'Standing water / Submerged hazard', factor: 'Standing water conceals road crater depth', severityBoost: true },
] as const;

export interface ImpactAssessment {
  roadAffectedId: string;
  trafficImpactId: string;
  contextProximityIds: string[];
}

export function calculateImpactSeverity(assessment: ImpactAssessment): {
  suggestedSeverity: 'Low' | 'Medium' | 'High' | 'Critical';
  suggestedPriority: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: string[];
  totalScore: number;
  isPending: boolean;
} {
  const road = ROAD_AFFECTED_OPTIONS.find(r => r.id === assessment.roadAffectedId);
  const traffic = TRAFFIC_IMPACT_OPTIONS.find(t => t.id === assessment.trafficImpactId);
  const selectedContexts = CONTEXT_PROXIMITY_OPTIONS.filter(c => assessment.contextProximityIds?.includes(c.id));

  if (!road && !traffic) {
    return {
      suggestedSeverity: 'Medium',
      suggestedPriority: 'Medium',
      factors: ['Awaiting citizen field impact assessment (select options below)'],
      totalScore: 0,
      isPending: true
    };
  }

  const factors: string[] = [];
  if (road) factors.push(road.text);
  if (traffic) factors.push(traffic.text);
  selectedContexts.forEach(c => factors.push(c.factor));

  let physicalScore = (road?.score || 2) + (traffic?.score || 1);
  if (assessment.contextProximityIds?.includes('waterlogged')) {
    physicalScore += 1;
  }

  let priorityScore = physicalScore;
  const priorityBoostCount = selectedContexts.filter(c => 'priorityBoost' in c && (c as any).priorityBoost).length;
  priorityScore += priorityBoostCount * 1.5;

  let suggestedSeverity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
  if (physicalScore <= 2) suggestedSeverity = 'Low';
  else if (physicalScore <= 4) suggestedSeverity = 'Medium';
  else if (physicalScore <= 6) suggestedSeverity = 'High';
  else suggestedSeverity = 'Critical';

  let suggestedPriority: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
  if (priorityScore <= 3) suggestedPriority = 'Low';
  else if (priorityScore <= 5) suggestedPriority = 'Medium';
  else if (priorityScore <= 7.5) suggestedPriority = 'High';
  else suggestedPriority = 'Critical';

  return {
    suggestedSeverity,
    suggestedPriority,
    factors,
    totalScore: physicalScore,
    isPending: false
  };
}

export function generatePrefilledDetails(params: {
  category: string;
  detectedProblem: string;
  location: string;
  landmark?: string;
  severity: string;
  priority: string;
  factors: string[];
}): { suggestedTitle: string; suggestedDescription: string } {
  const areaDesc = params.landmark || params.location.split(',')[0] || 'problem site';
  const problemName = params.detectedProblem || (params.category === 'Roads & Infrastructure' ? 'Pothole & road surface damage' : params.category);

  const suggestedTitle = `${params.severity === 'Critical' || params.severity === 'High' ? 'Severe ' : ''}${problemName} near ${areaDesc}`;

  const factorSummary = params.factors.length > 0
    ? ` Visible field conditions indicate: ${params.factors.join('; ')}.`
    : '';

  const suggestedDescription = `A ${problemName.toLowerCase()} has been documented near ${areaDesc}.${factorSummary} This condition poses an immediate disruption to civic transit and requires inter-agency coordination for prompt structural remediation. Suggested physical severity is assessed as ${params.severity} (Priority: ${params.priority}).`;

  return { suggestedTitle, suggestedDescription };
}

