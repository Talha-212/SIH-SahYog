import type { Problem, Solution, OrgMatch, MultidisciplinaryTeam, ProjectMilestone, IndustryPartnership, ImpactMetric } from './types';
import {
  SOCIETAL_DOMAINS,
  CHALLENGE_ASSESSMENT_BY_DOMAIN,
  resolveDomainKey,
  getStandardDomainName,
  calculateDomainImpactSeverity,
  generateDomainPrefilledDetails,
  validateEvidenceFile,
  extractRequiredExpertise,
  CIVIC_CATEGORIES,
  IMPACT_QUESTIONS_BY_CATEGORY,
  resolveCategoryKey,
  getStandardCategoryName,
  calculateCategoryImpactSeverity,
  generateCategoryPrefilledDetails,
  type SocietalDomainKey,
  type CivicCategoryKey,
  type DomainQuestionConfig,
  type ImpactOption,
  type ContextOption,
  type DomainImpactAssessment,
  type ImpactSeverityResult,
  type EvidenceValidationStatus,
  type ImageValidationResult
} from './impactQuestions';

// -------------------------------------------------------------------
// 13 Societal Challenge Domains for Government of Jharkhand (SIH26043)
// -------------------------------------------------------------------
export const CATEGORIES = [
  'Education',
  'Healthcare',
  'Agriculture',
  'Water & Sanitation',
  'Waste Management',
  'Environment',
  'Electricity',
  'Roads & Infrastructure',
  'Accessibility',
  'Public Administration',
  'Rural Livelihoods',
  'Rural Development',
  'Other'
];

export const CATEGORY_COLOR: Record<string, string> = {
  'Education': '#14548F',
  'Healthcare': '#B3261E',
  'Agriculture': '#2E8B57',
  'Water & Sanitation': '#0C7C8C',
  'Waste Management': '#178A56',
  'Environment': '#3B7A57',
  'Electricity': '#C08A1E',
  'Roads & Infrastructure': '#B5750B',
  'Accessibility': '#6A4CA0',
  'Public Administration': '#4A6FA5',
  'Rural Livelihoods': '#D97706',
  'Rural Development': '#5B8C2A',
  'Other': '#556070'
};

export const SUBCATEGORY: Record<string, string> = {
  'Education': 'Digital Learning & Classroom Infrastructure',
  'Healthcare': 'Rural Diagnostics & Maternal Telemedicine',
  'Agriculture': 'Solar Micro-Irrigation & Crop Yield',
  'Water & Sanitation': 'Arsenic/Fluoride Filtration & Potable Water',
  'Waste Management': 'Decentralized Waste Processing & Composting',
  'Environment': 'Coal Mine Overburden Eco-Restoration',
  'Electricity': 'Rural Decentralized Solar Micro-Grids',
  'Roads & Infrastructure': 'All-Weather Road & Culvert Stabilization',
  'Accessibility': 'Universal Barrier-Free Public Access',
  'Public Administration': 'Last-Mile Entitlement Verification',
  'Rural Livelihoods': 'Minor Forest Produce (Lac/Honey) Value Chain',
  'Rural Development': 'Village Connectivity & Community Water Bodies',
  'Other': 'General Societal Innovation Challenge'
};

// Departmental coordinating authorities in Government of Jharkhand
export const AUTHORITY: Record<string, string> = {
  'Education': 'Department of Higher & Technical Education / School Education, Govt. of Jharkhand',
  'Healthcare': 'Department of Health, Medical Education & Family Welfare, Govt. of Jharkhand',
  'Agriculture': 'Department of Agriculture, Animal Husbandry & Co-operative, Govt. of Jharkhand',
  'Water & Sanitation': 'Department of Drinking Water & Sanitation, Govt. of Jharkhand',
  'Waste Management': 'Urban Development & Housing Department, Govt. of Jharkhand',
  'Environment': 'Department of Forest, Environment & Climate Change, Govt. of Jharkhand',
  'Electricity': 'Department of Energy / JREDA, Govt. of Jharkhand',
  'Roads & Infrastructure': 'Road Construction Department / Rural Works Department, Govt. of Jharkhand',
  'Accessibility': 'Department of Women, Child Development & Social Security, Govt. of Jharkhand',
  'Public Administration': 'Department of Personnel, Administrative Reforms & Rajbhasha, Govt. of Jharkhand',
  'Rural Livelihoods': 'Jharkhand State Livelihood Promotion Society (JSLPS), Govt. of Jharkhand',
  'Rural Development': 'Department of Rural Development / Panchayati Raj, Govt. of Jharkhand',
  'Other': 'Jharkhand State Innovation Council, Govt. of Jharkhand'
};

export const AUTH_REASON: Record<string, string> = {
  'Education': 'Coordinates HEI research linkages and digital classroom deployment across government schools in Jharkhand.',
  'Healthcare': 'Oversees rural telemedicine networks, sub-center diagnostics, and medical supply chain infrastructure.',
  'Agriculture': 'Mandates micro-irrigation subsidies, tribal farmer cluster support, and crop disease surveillance.',
  'Water & Sanitation': 'Responsible for fluoride/arsenic mitigation, Jal Jeevan Mission rural piped supply, and water quality testing.',
  'Environment': 'Oversees industrial emissions, mine overburden reclamation guidelines, and forest biodiversity conservation in Jharkhand.',
  'Rural Livelihoods': 'Promotes tribal minor forest produce (MFP) cooperatives, Palash brand retail linkages, and women SHGs.'
};

export const RECOMMENDED_ACTION: Record<string, string> = {
  'Education': 'HEI multidisciplinary student-faculty assignment and localized digital learning kit formulation.',
  'Healthcare': 'Point-of-care diagnostic prototype testing and telemedicine tele-clinic mobile pilot.',
  'Agriculture': 'Solar micro-irrigation site survey and soil sensor cluster deployment.',
  'Water & Sanitation': 'Groundwater chemical assay and community adsorption filtration pilot.',
  'Environment': 'Overburden soil stability testing and indigenous bamboo phytoremediation shield.',
  'Rural Livelihoods': 'Primary solar processing unit setup and direct fair-price digital marketplace linkage.'
};

// -------------------------------------------------------------------
// 24 Districts of Jharkhand (Official Administrative Geography)
// -------------------------------------------------------------------
export const JHARKHAND_DISTRICTS = [
  'Ranchi',
  'Dhanbad',
  'East Singhbhum',
  'Bokaro',
  'Hazaribagh',
  'Deoghar',
  'Gumla',
  'Dumka',
  'Ramgarh',
  'Palamu',
  'West Singhbhum',
  'Giridih',
  'Khunti',
  'Simdega',
  'Garhwa',
  'Chatra',
  'Koderma',
  'Jamtara',
  'Godda',
  'Sahibganj',
  'Pakur',
  'Saraikela Kharsawan',
  'Latehar',
  'Lohardaga'
];

export const KEYWORDS: Record<string, string[]> = {
  'Education': ['school', 'college', 'student', 'classroom', 'digital', 'learning', 'teacher', 'tablet', 'santhali', 'ho', 'tribal language', 'stem', 'lab', 'pedagogy'],
  'Healthcare': ['health', 'hospital', 'clinic', 'medicine', 'doctor', 'telemedicine', 'maternal', 'infant', 'malnutrition', 'diagnostic', 'anemia', 'cold chain', 'vaccine', 'snakebite', 'malaria'],
  'Agriculture': ['crop', 'farmer', 'irrigation', 'field', 'agriculture', 'drip', 'solar pump', 'soil', 'paddy', 'acidity', 'pest', 'vegetable', 'harvest', 'fertilizer', 'kanke'],
  'Water & Sanitation': ['water', 'drinking water', 'fluoride', 'arsenic', 'pipeline', 'borewell', 'handpump', 'contamination', 'potable', 'filter', 'purification', 'pond', 'well'],
  'Waste Management': ['waste', 'garbage', 'trash', 'dump', 'plastic', 'compost', 'sanitation', 'latrine', 'toilet', 'drain', 'drainage', 'sewage', 'recycling', 'overburden'],
  'Environment': ['mine', 'mining', 'coal', 'overburden', 'reclamation', 'phytoremediation', 'forest', 'tree', 'pollution', 'emission', 'air quality', 'soil degradation', 'damodar', 'subarnarekha'],
  'Electricity': ['power', 'solar', 'energy', 'electricity', 'microgrid', 'off-grid', 'biomass', 'load shedding', 'transformer', 'battery', 'storage', 'renewable'],
  'Roads & Infrastructure': ['road', 'bridge', 'culvert', 'pothole', 'bitumen', 'asphalt', 'pavement', 'connectivity', 'transit', 'monsoon washout', 'traffic', 'cold-mix'],
  'Accessibility': ['wheelchair', 'ramp', 'disabled', 'accessibility', 'tactile', 'blind', 'braille', 'assistive', 'prosthetic', 'special education'],
  'Public Administration': ['pds', 'ration', 'pension', 'biometric', 'pos', 'grievance', 'entitlement', 'panchayat', 'gram sabha', 'certificate', 'administrative'],
  'Rural Livelihoods': ['lac', 'minor forest produce', 'mfp', 'honey', 'artisan', 'handicraft', 'tribal', 'tasar', 'silk', 'handloom', 'shg', 'palash', 'livelihood'],
  'Rural Development': ['village', 'panchayat bhawan', 'pond', 'check dam', 'approach road', 'knowledge hub', 'community hall', 'shramdaan', 'tribal welfare'],
  'Other': ['societal', 'community', 'innovation', 'multidisciplinary', 'prototype', 'pilot']
};

// -------------------------------------------------------------------
// Higher Education Institutions (HEIs) & Industry Partners in Jharkhand
// -------------------------------------------------------------------
export const ORG_POOL: Record<string, Omit<OrgMatch, 'score'>[]> = {
  'Agriculture': [
    {
      name: 'Birsa Agricultural University (BAU) - Dept. of Agricultural Engineering',
      type: 'University',
      roleInProblem: 'Academic Lead & Low-Cost Solar Micro-Irrigation Formulation',
      expertise: 'Solar-powered micro-irrigation, indigenous crop agronomy, soil chemistry telemetry',
      location: 'Kanke, Ranchi, Jharkhand',
      resources: 'Central Research Farm, Agritech Prototyping Workshop, Soil Testing Lab',
      projects: 'Solar lift irrigation pilots & tribal smallholder crop optimization (DEMO DATA)',
      reasons: ['Premier agricultural university in Jharkhand', 'Extensive KVK network across all 24 districts'],
      factors: { domain: 40, jurisdiction: 30, expertise: 20, capacity: 10 }
    },
    {
      name: 'Tata Steel Foundation - Rural Livelihoods & Agritech Division',
      type: 'Industry',
      roleInProblem: 'Field Deployment Partner, Prototyping & CSR Grant Support',
      expertise: 'Smallholder farmer cluster mobilization, cold storage, equipment fabrication',
      location: 'Jamshedpur & West Bokaro, Jharkhand',
      resources: 'Fabrication workshop, CSR field teams, solar pumping units',
      projects: 'Thousand Ponds agricultural initiative & solar lift irrigation scaling (DEMO DATA)',
      reasons: ['Major industrial CSR footprint in Jharkhand', 'Proven village-level irrigation deployment capability'],
      factors: { domain: 36, jurisdiction: 28, expertise: 18, capacity: 9 }
    },
    {
      name: 'Dept. of Agriculture & Sugarcane Dev., Govt. of Jharkhand',
      type: 'Government',
      roleInProblem: 'Statutory Scheme Integration & Subsidy Authorization',
      expertise: 'State agricultural policy, PM-KUSUM solar pump subsidy coordination',
      location: 'Krishi Bhawan, Ranchi, Jharkhand',
      resources: 'District Agriculture Officers (DAOs), subsidy allocation, official certification',
      projects: 'Jharkhand Krishi Rin Mafi & Micro-Irrigation Mission oversight (DEMO DATA)',
      reasons: ['Statutory nodal authority for agricultural schemes in Jharkhand'],
      factors: { domain: 38, jurisdiction: 30, expertise: 16, capacity: 9 }
    },
    {
      name: 'Jharkhand State Livelihood Promotion Society (JSLPS) / Mahila Kisan',
      type: 'NGO',
      roleInProblem: 'Community Mobilization & Farmer Group Ownership',
      expertise: 'Women farmer Self-Help Groups (Mahila Kisan Sashaktikaran Pariyojana)',
      location: 'Hehal, Ranchi, Jharkhand',
      resources: 'Network of 200,000+ women SHG members across Jharkhand villages',
      projects: 'Palash agri-product value addition & community water sharing (DEMO DATA)',
      reasons: ['Deep grassroots presence in tribal farming villages'],
      factors: { domain: 34, jurisdiction: 28, expertise: 16, capacity: 8 }
    }
  ],

  'Water & Sanitation': [
    {
      name: 'IIT (ISM) Dhanbad - Centre for Water Resource Management',
      type: 'University',
      roleInProblem: 'Adsorption Filtration Research & IoT Telemetry Architecture',
      expertise: 'Arsenic/fluoride adsorption filtration, groundwater hydrogeology, IoT sensor nodes',
      location: 'Dhanbad, Jharkhand',
      resources: 'Water Quality Analytical Lab, Embedded IoT Makerspace, Pilot Test Skid',
      projects: 'Graphene-oxide and activated alumina fluoride filtration prototypes (DEMO DATA)',
      reasons: ['Institute of National Importance in Jharkhand', 'Specialized hydrogeological & sensor research'],
      factors: { domain: 40, jurisdiction: 30, expertise: 20, capacity: 10 }
    },
    {
      name: 'Tata Steel Utilities & Infrastructure Services (Tata Steel UISL)',
      type: 'Industry',
      roleInProblem: 'Modular Skid Fabrication & Scaled Field Engineering',
      expertise: 'Potable water supply skid manufacturing, membrane maintenance, automated chlorination',
      location: 'Jamshedpur, Jharkhand',
      resources: 'Precision water engineering workshops, supply pipeline inventory',
      projects: 'Industrial water treatment & urban water security skids (DEMO DATA)',
      reasons: ['World-class water engineering facilities within Jharkhand'],
      factors: { domain: 37, jurisdiction: 28, expertise: 19, capacity: 9 }
    },
    {
      name: 'Dept. of Drinking Water & Sanitation (DWSD), Govt. of Jharkhand',
      type: 'Government',
      roleInProblem: 'Jal Jeevan Mission Integration & Public Health Validation',
      expertise: 'State drinking water network oversight, laboratory water quality certification',
      location: 'Dhurwa, Ranchi, Jharkhand',
      resources: 'District water testing laboratories, mobile testing vans, departmental permits',
      projects: 'Jal Jeevan Mission rural piped water supply monitoring (DEMO DATA)',
      reasons: ['Statutory custody of public drinking water infrastructure in Jharkhand'],
      factors: { domain: 39, jurisdiction: 30, expertise: 17, capacity: 9 }
    }
  ],

  'Education': [
    {
      name: 'BIT Mesra - Department of Computer Science & Engineering',
      type: 'University',
      roleInProblem: 'Offline-First Multilingual EdTech & Vernacular Voice AI Engine',
      expertise: 'Indic NLP, offline digital learning platforms, tribal language pedagogical software',
      location: 'Mesra, Ranchi, Jharkhand',
      resources: 'AI & Data Engineering Labs, Student Innovation Squad, Cloud/Edge Compute Cluster',
      projects: 'Santhali and Ho interactive digital literacy mobile applications (DEMO DATA)',
      reasons: ['Premier technical university in Jharkhand with deep local computer science research'],
      factors: { domain: 40, jurisdiction: 30, expertise: 20, capacity: 9 }
    },
    {
      name: 'Jharkhand Information Technology Consortium (JITC / Startups)',
      type: 'Industry',
      roleInProblem: 'Ruggedized Tablet Hardware Provision & Edge Caching Hubs',
      expertise: 'Low-cost solar-powered classroom micro-servers, ruggedized tablets, offline syncing',
      location: 'Namkum Industrial Area, Ranchi, Jharkhand',
      resources: 'Hardware assembly lines, regional school support engineers',
      projects: 'Smart Gram Panchayat digital kiosk hardware rollouts (DEMO DATA)',
      reasons: ['Local IT hardware supply and warranty support in Jharkhand'],
      factors: { domain: 35, jurisdiction: 28, expertise: 18, capacity: 8 }
    },
    {
      name: 'Dept. of School Education & Literacy, Govt. of Jharkhand',
      type: 'Government',
      roleInProblem: 'Curriculum Alignment, School Permissions & Institutional Pilot Rollout',
      expertise: 'State curriculum compliance (JCERT), Kasturba Gandhi Balika Vidyalaya integration',
      location: 'MDI Building, Dhurwa, Ranchi, Jharkhand',
      resources: 'State Council of Educational Research & Training, District Education Officers (DEOs)',
      projects: 'DigiSATH & ICT Lab school program governance (DEMO DATA)',
      reasons: ['Statutory governing body for government schools across all 24 districts'],
      factors: { domain: 38, jurisdiction: 30, expertise: 17, capacity: 9 }
    }
  ],

  'Healthcare': [
    {
      name: 'AIIMS Deoghar / RIMS Health Innovation Cell',
      type: 'University',
      roleInProblem: 'Clinical Protocol Design, Diagnostic Testing & Tele-Clinic Guidance',
      expertise: 'Point-of-care diagnostics, sickle cell screening, maternal health telemedicine protocols',
      location: 'Deoghar & Ranchi, Jharkhand',
      resources: 'Super-specialty medical research labs, telemedicine tele-consultation hub',
      projects: 'Tribal sickle cell anemia telemetry & mobile antenatal screening pilots (DEMO DATA)',
      reasons: ['Premier apex medical research institutions in Jharkhand'],
      factors: { domain: 40, jurisdiction: 30, expertise: 20, capacity: 10 }
    },
    {
      name: 'Jharkhand MedTech & Diagnostic Systems Pvt. Ltd.',
      type: 'Industry',
      roleInProblem: 'Portable Medical Device Fabrication & Solar Cold Chain Logistics',
      expertise: 'Solar direct-drive vaccine refrigerators, ruggedized diagnostic kits, IoT temperature telemetry',
      location: 'Tupudana Industrial Estate, Ranchi, Jharkhand',
      resources: 'Medical device manufacturing clean-rooms, cold-chain transport fleet',
      projects: 'Last-mile solar immunization coolers for hilly forest habitations (DEMO DATA)',
      reasons: ['Specialized medical hardware manufacturing within Jharkhand'],
      factors: { domain: 36, jurisdiction: 28, expertise: 18, capacity: 8 }
    },
    {
      name: 'Dept. of Health, Medical Education & Family Welfare, Govt. of Jharkhand',
      type: 'Government',
      roleInProblem: 'Statutory Health Clearance, ANM/ASHA Integration & PHC Deployment',
      expertise: 'National Health Mission (NHM) Jharkhand integration, clinical ethical clearance',
      location: 'Namkum, Ranchi, Jharkhand',
      resources: 'Network of 3,800+ Health & Wellness Sub-Centers, Chief Medical Officers',
      projects: 'Tele-Okhli and mobile health clinic oversight across tribal districts (DEMO DATA)',
      reasons: ['Statutory authority for public health delivery in Jharkhand'],
      factors: { domain: 39, jurisdiction: 30, expertise: 17, capacity: 9 }
    }
  ],

  'Environment': [
    {
      name: 'IIT (ISM) Dhanbad - Department of Environmental Engineering & Mining',
      type: 'University',
      roleInProblem: 'Mine Overburden Phytoremediation & Sub-Surface Fire Modeling',
      expertise: 'Acid mine drainage neutralization, overburden slope stabilization, soil bio-engineering',
      location: 'Dhanbad, Jharkhand',
      resources: 'Mining Environment Simulation Lab, Soil Geochemistry Lab, Drone Survey Squad',
      projects: 'Jharia coalfield sub-surface thermal mapping & botanical overburden capping (DEMO DATA)',
      reasons: ['World-renowned authority on coalfield environmental engineering'],
      factors: { domain: 40, jurisdiction: 30, expertise: 20, capacity: 10 }
    },
    {
      name: 'Bharat Coking Coal Limited (BCCL) / SAIL Bokaro Eco-Cell',
      type: 'Industry',
      roleInProblem: 'Site Access, Earthmoving Machinery & CSR Reclamation Co-Funding',
      expertise: 'Heavy earthmoving for slope grading, fly-ash stabilization, industrial nursery access',
      location: 'Koyla Bhawan, Dhanbad, Jharkhand',
      resources: 'Heavy earthmovers, native species nurseries, mine reclamation budget',
      projects: 'Eco-parks & mine void water harvesting conversions in Dhanbad and Bokaro (DEMO DATA)',
      reasons: ['Major public sector mining enterprise with statutory reclamation mandate'],
      factors: { domain: 37, jurisdiction: 29, expertise: 18, capacity: 9 }
    },
    {
      name: 'Jharkhand State Pollution Control Board (JSPCB)',
      type: 'Government',
      roleInProblem: 'Regulatory Monitoring, Air/Water Quality Baseline & Formal Clearances',
      expertise: 'Continuous ambient air quality monitoring (CAAQMS), environmental compliance',
      location: 'TA Division Building, HEC, Dhurwa, Ranchi, Jharkhand',
      resources: 'Regional environmental monitoring stations, statutory compliance powers',
      projects: 'Damodar river basin industrial pollution oversight (DEMO DATA)',
      reasons: ['Statutory regulatory agency for environmental protection in Jharkhand'],
      factors: { domain: 39, jurisdiction: 30, expertise: 17, capacity: 9 }
    }
  ],

  'Rural Livelihoods': [
    {
      name: 'ICAR - National Institute of Secondary Agriculture (NISA, formerly IINRG)',
      type: 'University',
      roleInProblem: 'Lac & Natural Resin Value-Addition Engineering & Processing Tech',
      expertise: 'Natural gum & resin processing machines, broodlac quality enhancement, value addition',
      location: 'Namkum, Ranchi, Jharkhand',
      resources: 'Pilot Lac Processing Plant, Quality Certification Lab, Tribal Training Centre',
      projects: 'Decentralized solar-powered lac scraping and primary processing units (DEMO DATA)',
      reasons: ['National premier institute located in Ranchi dedicated to lac and resin technology'],
      factors: { domain: 40, jurisdiction: 30, expertise: 20, capacity: 10 }
    },
    {
      name: 'Jharkhand State Livelihood Promotion Society (JSLPS) - Palash Brand',
      type: 'Industry',
      roleInProblem: 'Packaging Standardization, Quality Certification & Retail Market Linkage',
      expertise: 'Palash brand retail aggregation, honey/lac packaging, export buyer linkage',
      location: 'Ranchi, Jharkhand',
      resources: 'Palash retail mart network, FPO producer company aggregation hubs',
      projects: 'Palash retail honey and tamarind processing cluster scale-up (DEMO DATA)',
      reasons: ['State nodal enterprise for rural tribal producer marketing'],
      factors: { domain: 38, jurisdiction: 30, expertise: 18, capacity: 9 }
    },
    {
      name: 'TRIFED Regional Office, Govt. of India / Tribal Welfare Dept.',
      type: 'Government',
      roleInProblem: 'Minimum Support Price (MSP) Assurance & Van Dhan Vikas Kendra Linkage',
      expertise: 'Van Dhan Vikas Kendra funding, Minor Forest Produce procurement regulations',
      location: 'Kanke Road, Ranchi, Jharkhand',
      resources: 'Van Dhan Kendras across 24 districts, revolving tribal procurement funds',
      projects: 'MSP for Minor Forest Produce procurement implementation (DEMO DATA)',
      reasons: ['Statutory nodal agency for tribal forest produce welfare'],
      factors: { domain: 37, jurisdiction: 28, expertise: 17, capacity: 8 }
    }
  ],

  'Roads & Infrastructure': [
    {
      name: 'BIT Mesra - Department of Civil Engineering (Highway Materials Lab)',
      type: 'University',
      roleInProblem: 'Crumb Rubber & Polymer Cold-Mix Asphalt Formulation for Monsoon Climate',
      expertise: 'Polymer modified bitumen, fly-ash stabilized road bases, rapid cold-patch technology',
      location: 'Mesra, Ranchi, Jharkhand',
      resources: 'Marshall Stability testing rigs, asphalt binder lab, student field squad',
      projects: 'High-durability cold-mix formulation for heavy mining transit routes (DEMO DATA)',
      reasons: ['Pioneering research in polymer cold-mix road remediation in Jharkhand'],
      factors: { domain: 40, jurisdiction: 30, expertise: 20, capacity: 9 }
    },
    {
      name: 'Jharkhand Highway Infrastructure & Paving Solutions Ltd.',
      type: 'Industry',
      roleInProblem: 'Mechanized Compaction Fleet & Industrial Cold-Mix Supply',
      expertise: 'Mechanized thermal spray patching, rapid night deployment, quarry aggregates',
      location: 'Adityapur Industrial Area, Jamshedpur, Jharkhand',
      resources: 'Vibratory compactors, asphalt mixing plants, trained road repair crews',
      projects: 'Rapid arterial road patch repairs on NH-33 and state highways (DEMO DATA)',
      reasons: ['Local mechanized road fleet capable of rapid deployment within Jharkhand'],
      factors: { domain: 36, jurisdiction: 28, expertise: 18, capacity: 8 }
    },
    {
      name: 'Road Construction Department (RCD), Govt. of Jharkhand',
      type: 'Government',
      roleInProblem: 'Statutory Right-of-Way Approvals & Engineering Oversight',
      expertise: 'State highway network maintenance, statutory municipal road permits',
      location: 'Project Building, Dhurwa, Ranchi, Jharkhand',
      resources: 'Executive Engineers (EEs), state road budget, formal inspection authority',
      projects: 'State highway quality assurance and road safety audits (DEMO DATA)',
      reasons: ['Statutory authority for road infrastructure in Jharkhand'],
      factors: { domain: 39, jurisdiction: 30, expertise: 17, capacity: 9 }
    }
  ],

  'default': [
    {
      name: 'Jharkhand State Innovation Council & University Consortium',
      type: 'University',
      roleInProblem: 'Interdisciplinary Research Lead & Solution Prototyping',
      expertise: 'Applied societal engineering, rapid prototyping, multidisciplinary innovation',
      location: 'Ranchi, Jharkhand',
      resources: 'State Central Makerspace, Interdisciplinary faculty review panel',
      projects: 'State societal challenge prototypes & hackathon innovations (DEMO DATA)',
      reasons: ['Official innovation consortium representing Jharkhand universities'],
      factors: { domain: 38, jurisdiction: 30, expertise: 18, capacity: 9 }
    },
    {
      name: 'Jharkhand Chamber of Commerce & Industry (FJCCI) Innovation Cell',
      type: 'Industry',
      roleInProblem: 'Industry Mentorship, Prototyping Facilities & MSME Fabrication',
      expertise: 'Commercial fabrication, industrial prototyping, supply chain linkages',
      location: 'Chamber Bhawan, Ranchi, Jharkhand',
      resources: 'Network of 3,000+ local MSMEs, equipment workshops, seed funding access',
      projects: 'MSME technology adoption & societal pilot sponsorships (DEMO DATA)',
      reasons: ['Apex industry association in Jharkhand'],
      factors: { domain: 35, jurisdiction: 28, expertise: 17, capacity: 8 }
    },
    {
      name: 'Planning & Development Department, Govt. of Jharkhand',
      type: 'Government',
      roleInProblem: 'Ecosystem Coordination & District Planning Approval',
      expertise: 'District planning committee approvals, departmental fund convergence',
      location: 'Project Building, Ranchi, Jharkhand',
      resources: 'District Planning Officers, inter-departmental convergence authority',
      projects: 'State innovation strategy and sustainable development monitoring (DEMO DATA)',
      reasons: ['Principal coordinating authority for societal development in Jharkhand'],
      factors: { domain: 39, jurisdiction: 30, expertise: 16, capacity: 9 }
    }
  ]
};

// -------------------------------------------------------------------
// 9-Stage Societal Innovation Project Lifecycle
// -------------------------------------------------------------------
export const STAGES = [
  'Challenge Submitted',
  'AI Evaluated',
  'HEI Matched',
  'Team Formed',
  'Proposal Submitted',
  'Industry Partnered',
  'Prototype & Testing',
  'Pilot Deployed',
  'Impact Validated'
];

export const WORKFLOW_STEPS = [
  '1. Evidence & Supporting Documentation',
  '2. Location in Jharkhand',
  '3. Domain-Aware Impact Assessment',
  '4. Required Expertise & Challenge Details',
  '5. Final Review & Submit'
];

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const DEMO_LOCATION = {
  address: "Birsa Agricultural University Campus, Kanke, Ranchi, Jharkhand 834006",
  lat: 23.4357,
  lng: 85.3183,
  landmark: "Kanke Road, Near Central Research Farm",
  state: "Jharkhand",
  district: "Ranchi"
};

export const DEMO_METRICS = [
  { value: '13', label: 'Societal Challenge Domains', sub: 'Education · Health · Agri · Water · Mining...' },
  { value: '24', label: 'Jharkhand Districts Covered', sub: 'Ranchi · Dhanbad · Gumla · Dumka · Bokaro...' },
  { value: 'HEI+Industry', label: 'Innovation Collaboration', sub: 'Multidisciplinary student + faculty teams' },
  { value: 'Measurable', label: 'Social Impact Lifecycle', sub: 'From community challenge to field pilot' }
];

function makeId(n: number) { return 'JH-2026-' + String(n).padStart(5, '0'); }

// -------------------------------------------------------------------
// Rich Realistic Jharkhand Societal Challenges Initial Dataset
// Demonstrates the complete problem-to-impact lifecycle
// -------------------------------------------------------------------
export const INITIAL_PROBLEMS: Problem[] = [
  {
    id: 'JH-2026-00101',
    title: 'Solar Micro-Irrigation & Soil Telemetry for Smallholder Farmers in Kanke Valley',
    desc: 'Marginal tribal farmers cultivating vegetable plots in the Kanke and Pithoria agricultural basin face severe water shortages during the dry winter and summer months (November to May). Reliance on expensive diesel pump rentals severely cuts into household income. A community-level solar micro-lift irrigation system paired with low-cost soil moisture telemetry is needed to enable two additional crop cycles and double seasonal farm revenue.',
    category: 'Agriculture',
    domain: 'agriculture',
    subdomain: 'Solar Micro-Irrigation',
    location: 'Pithoria Valley, Kanke Block, Ranchi, Jharkhand',
    state: 'Jharkhand',
    district: 'Ranchi',
    block: 'Kanke',
    affected: '~450 tribal farming families (Demo Context)',
    affected_population: 450,
    expected_outcome: 'Deploy a decentralized 5HP solar micro-lift irrigation unit with automated soil telemetry to irrigate 85 acres of vegetable land across 450 farming families.',
    severity: 'High',
    stage: 7, // Pilot Deployed
    date: 'Today',
    landmark: 'Near Kanke Dam feeder canal and Pithoria vegetable market',
    datetime: '2026-09-22T10:30',
    lat: 23.4357,
    lng: 85.3183,
    mapX: 48,
    mapY: 42,
    photos: [
      { src: '/demo/pothole_before.jpg', isVideo: false, name: 'kanke_irrigation_field_evidence.jpg' }
    ],
    required_expertise: [
      'Agricultural Engineering',
      'Solar PV & Power Electronics',
      'IoT & Soil Sensors',
      'Agronomy & Water Management',
      'Community Action & Rural Management'
    ],
    project_team: {
      faculty_mentor: 'Dr. Rameshwar Oraon, Dept. of Agricultural Engineering, BAU Kanke',
      faculty_dept: 'Agricultural Engineering & Soil Sciences',
      student_members: [
        { name: 'Anjali Munda', dept: 'Agricultural Engineering', role: 'Team Lead & Drip Layout' },
        { name: 'Vikram Soren', dept: 'Electrical & Electronics', role: 'Solar Pump Telemetry' },
        { name: 'Pooja Kumari', dept: 'Computer Science', role: 'Farmer Dashboard & SMS Alerts' }
      ],
      external_advisor: 'Er. Sandeep Verma, Tata Steel Foundation Agritech Lead'
    },
    milestones: [
      { id: 'M1', title: 'Hydrogeological & Solar Insolation Survey', desc: 'Detailed topographical contour mapping of 85 acres and insolation check at canal intake.', due: 'Completed', status: 'Completed', deliverables: 'Contour Survey Report & Intake Design' },
      { id: 'M2', title: 'Solar PV Array & DC Pump Integration', desc: 'Procurement of 5HP DC surface pump and fabrication of 6kW tracking solar panel mount.', due: 'Completed', status: 'Completed', deliverables: 'Installed Solar Pumping Skid' },
      { id: 'M3', title: 'Underground HDPE Mainline & Drip Network', desc: 'Laying 1,800 meters of pressurized HDPE sub-main pipelines across 450 individual farmer plots.', due: 'Completed', status: 'Completed', deliverables: 'Functional Pressurized Drip Distribution' },
      { id: 'M4', title: 'IoT Soil Moisture Sensor Deployment', desc: 'Installation of 8 LoRaWAN-connected soil moisture probe nodes triggering automated valve opening.', due: '2026-10-15', status: 'In Progress', deliverables: 'Live Telemetry to BAU Server & SMS Gateway' },
      { id: 'M5', title: 'Community Water Sharing Protocol & Handover', desc: 'Formation of Pani Panchayat user committee and digital water accounting handbook.', due: '2026-11-01', status: 'Pending', deliverables: 'Registered Pani Panchayat Cooperative' }
    ],
    industry_partnerships: [
      {
        org_name: 'Tata Steel Foundation Agritech Division',
        org_type: 'Industry',
        support_type: 'Funding',
        status: 'Active',
        contribution: 'CSR grant of ₹3,50,000 for high-efficiency solar panels and HDPE piping material.'
      },
      {
        org_name: 'KisanVikas Agri-Electronics Startup (Ranchi)',
        org_type: 'Startup',
        support_type: 'Prototyping',
        status: 'Active',
        contribution: 'Providing low-cost capacitive soil moisture telemetry nodes at subsidized cost.'
      }
    ],
    impact_metrics: [
      { metric: 'Cultivated Crop Cycles per Year', before: '1 (Kharif only)', after: '3 (Kharif + Rabi + Zaid)', unit: 'cycles/year', beneficiaries: 450, validation_status: 'Validated' },
      { metric: 'Average Monthly Farm Household Income', before: '₹4,200', after: '₹9,800', unit: 'INR/month', beneficiaries: 450, validation_status: 'Validated' },
      { metric: 'Diesel Fuel Costs Avoided', before: '₹14,500/season', after: '₹0 (Solar powered)', unit: 'INR/season/farmer', beneficiaries: 450, validation_status: 'Validated' }
    ],
    solutions: [
      {
        id: 'SOL-BAU-01',
        title: 'Decentralized Solar-Powered Micro-Lift Irrigation Skid with LoRaWAN Soil Telemetry',
        org: 'Birsa Agricultural University (BAU) with Tata Steel Foundation',
        status: 'In Deployment',
        desc: 'A robust 5HP solar-powered micro-lift system utilizing high-efficiency DC brush-less surface pumps, taking water from perennial stream check-dams and distributing via buried HDPE network with LoRaWAN soil moisture probes to prevent water wastage.',
        tech: '6kW Solar PV Array + 5HP BLDC Solar Pump + LoRaWAN Soil Moisture Sensors + HDPE Drip Network',
        cost: '₹4,85,000 (Subsidized by Academic Research & Tata Steel CSR)',
        time: '6 weeks rollout',
        impact: '~450 tribal farming families, 85 cultivated acres, 110% increase in net vegetable yields',
        faculty_mentor: 'Dr. Rameshwar Oraon (BAU Kanke)',
        student_team: 'Anjali Munda, Vikram Soren, Pooja Kumari',
        prototype_plan: 'Lab validation of pump curves and moisture probe calibration at BAU Central Farm.',
        pilot_plan: 'Phase 1 pilot on 30 acres in Pithoria cluster; Phase 2 extension across all 85 acres.',
        social_impact: 'Eliminates distress out-migration of farm youth to cities during the non-monsoon dry season.'
      }
    ],
    verification: null
  },
  {
    id: makeId(102),
    title: 'Low-Cost Fluoride & Arsenic Adsorption Water Filtration Skid in Gumla Rural Hamlets',
    desc: 'Over 12 tribal villages in Raidih and Chainpur blocks of Gumla district rely on deep groundwater handpumps with excessive fluoride levels (2.8 to 4.2 mg/L, exceeding WHO safety limit of 1.5 mg/L). School children and elders exhibit severe dental and skeletal fluorosis. Commercial RO filters waste 60% of water and fail without electricity. A gravity-fed, low-cost adsorbent filtration skid using locally formulated activated alumina/bauxite composite is urgently needed.',
    category: 'Water & Sanitation',
    domain: 'water',
    subdomain: 'Fluoride & Arsenic Filtration',
    location: 'Raidih Block, Gumla District, Jharkhand',
    state: 'Jharkhand',
    district: 'Gumla',
    block: 'Raidih',
    affected: '~1,200 rural residents and 380 school children',
    affected_population: 1200,
    expected_outcome: 'Install 4 community-scale zero-electricity gravity adsorption filter skids reducing fluoride concentrations below 1.0 mg/L with simple local backwash maintenance.',
    severity: 'Critical',
    stage: 4, // Solution Proposed
    date: '4 Sept 2026',
    mapX: 38,
    mapY: 52,
    lat: 23.0436,
    lng: 84.5412,
    photos: [],
    required_expertise: [
      'Water Resources Engineering',
      'Environmental Chemistry',
      'Materials Science & Composites',
      'Public Health Informatics'
    ],
    solutions: [
      {
        id: 'SOL-ISM-02',
        title: 'Zero-Electricity Activated Bauxite Composite Fluoride Adsorption Skid',
        org: 'IIT (ISM) Dhanbad with Dept. of Drinking Water & Sanitation',
        status: 'Proposed',
        desc: 'A gravity-fed double-column filtration system packed with thermally activated regional bauxite and nano-hydroxyapatite composite granules. Delivers 500 liters/hour of safe drinking water (<0.8 mg/L fluoride) with zero electrical power requirement.',
        tech: 'Thermally Activated Regional Bauxite Adsorption Matrix + Gravity Hydrostatic Head',
        cost: '₹1,25,000 per community unit',
        time: '4 weeks installation',
        impact: '1,200+ villagers in Raidih block with guaranteed safe drinking water meeting BIS 10500 standards.'
      }
    ],
    verification: null
  },
  {
    id: makeId(103),
    title: 'Offline Multilingual Digital Learning & Tribal Language (Ho / Santhali) Kits',
    desc: 'Government primary schools in remote forested blocks of West Singhbhum have poor or non-existent cellular internet connectivity. Over 85% of early grade students speak Ho or Santhali at home and struggle with standard Hindi-only textbooks, contributing to high early grade dropouts. An offline-first digital learning tablet preloaded with bilingual audio-visual story modules, phonics, and gamified numeracy is required.',
    category: 'Education',
    domain: 'education',
    subdomain: 'Tribal Pedagogy & Language',
    location: 'Chaibasa Rural & Goilkera, West Singhbhum, Jharkhand',
    state: 'Jharkhand',
    district: 'West Singhbhum',
    block: 'Goilkera',
    affected: '~720 tribal primary students across 6 school clusters',
    affected_population: 720,
    expected_outcome: 'Deploy 60 ruggedized offline solar-charged tablets with dual-language Ho-Hindi audio-visual modules to improve Grade 1-5 foundational literacy by 40%.',
    severity: 'High',
    stage: 2, // HEI Matched
    date: '5 Sept 2026',
    mapX: 52,
    mapY: 65,
    lat: 22.5539,
    lng: 85.8083,
    photos: [],
    required_expertise: [
      'Education Technology',
      'Computer Science & Offline Sync',
      'Tribal Linguistics (Ho / Santhali)',
      'Human-Computer Interaction'
    ],
    solutions: [],
    verification: null
  },
  {
    id: makeId(104),
    title: 'Botanical Overburden Stabilization & Phytoremediation of Abandoned Coal Mine Pits',
    desc: 'Extensive overburden dumps and abandoned open-cast coal mining voids near Jharia and Katras cause continuous fugitive coal dust pollution, toxic acid mine drainage into local water channels, and landslide hazards for adjacent bastis during the monsoon. Traditional civil retaining walls frequently crack. A botanical bio-engineering solution using deep-rooting vetiver grass, native bamboo, and nitrogen-fixing legumes is required.',
    category: 'Environment',
    domain: 'environment',
    subdomain: 'Open-Cast Coal Mine Reclamation',
    location: 'Katras Coalfield Belt, Dhanbad, Jharkhand',
    state: 'Jharkhand',
    district: 'Dhanbad',
    block: 'Baghmara',
    affected: '~3,400 residents in surrounding mining settlements',
    affected_population: 3400,
    expected_outcome: 'Stabilize 15 hectares of steep overburden slopes using vetiver bio-shielding, reducing airborne coal dust particulates by 65% and preventing seasonal landslides.',
    severity: 'Critical',
    stage: 5, // Approved by BCCL & Dept of Forest
    date: '1 Sept 2026',
    mapX: 68,
    mapY: 38,
    lat: 23.7957,
    lng: 86.4304,
    photos: [],
    required_expertise: [
      'Mining Environmental Engineering',
      'Soil Phytoremediation',
      'Remote Sensing & Drone Photogrammetry',
      'Ecological Restoration'
    ],
    solutions: [
      {
        id: 'SOL-ISM-ENV-01',
        title: 'Vetiver-Bamboo Bio-Shielding with Fly-Ash Geopolymer Topsoil Stabilization',
        org: 'IIT (ISM) Dhanbad with Bharat Coking Coal Limited (BCCL)',
        status: 'Approved',
        desc: 'Multi-tiered vegetative stabilization planting Chrysopogon zizanioides (vetiver grass) with high-tensile coir geotextiles and neutralized fly-ash topsoil amendment to arrest gully erosion and neutralize acid runoff.',
        tech: 'Coir Geotextile Mesh + Vetiver Hydro-Seeding + Alkaline Fly-Ash Neutralization',
        cost: '₹6,40,000 (Funded by BCCL CSR)',
        time: '8 weeks planting and monitoring',
        impact: 'Stabilizes 15 hectares of mine slopes, protecting 3,400 settlement residents from landslide hazards.'
      }
    ],
    verification: null
  },
  {
    id: makeId(105),
    title: 'Solar Direct-Drive Cold Chain & Mobile Diagnostic Tele-Clinic in Santhal Parganas',
    desc: 'Sub-health centers in hilly, forested tribal hamlets of Dumka district suffer frequent 20+ hour power blackouts, causing critical vaccine and antivenom spoilage. Pregnant women travel over 25 km on unpaved roads for basic hemoglobin and ultrasound screening. A solar direct-drive vaccine cooler coupled with a portable telemedicine screening kit is needed to enable monthly village-level tele-clinics with specialists.',
    category: 'Healthcare',
    domain: 'healthcare',
    subdomain: 'Rural Diagnostic Clinics',
    location: 'Shikaripara Block, Dumka District, Jharkhand',
    state: 'Jharkhand',
    district: 'Dumka',
    block: 'Shikaripara',
    affected: '~2,100 villagers across 8 forested tolas',
    affected_population: 2100,
    expected_outcome: 'Deploy 2 solar direct-drive medical refrigeration units and 1 portable diagnostic backpack serving 8 remote tolas with weekly tele-consultations.',
    severity: 'High',
    stage: 6, // In Prototype & Testing
    date: '29 Aug 2026',
    mapX: 72,
    mapY: 28,
    lat: 24.2678,
    lng: 87.2494,
    photos: [],
    required_expertise: [
      'Biomedical Engineering',
      'Solar PV & Power Electronics',
      'Telemedicine Systems',
      'Public Health Informatics'
    ],
    solutions: [
      {
        id: 'SOL-AIIMS-01',
        title: 'Solar Direct-Drive Tele-Health Backpack with AIIMS Tele-Consultation Link',
        org: 'AIIMS Deoghar with Tupudana MedTech Hardware',
        status: 'In Deployment',
        desc: 'Phase-change material solar direct-drive vaccine storage (holds 2-8°C for 72 hours without battery) combined with a ruggedized portable digital diagnostic pack (ECG, fetal Doppler, hemoglobinometer) connected to AIIMS specialists via low-bandwidth satellite/cellular link.',
        tech: 'Solar Direct-Drive PCM Refrigeration + Low-Bandwidth Store-and-Forward Telemedicine',
        cost: '₹2,90,000 per health cluster',
        time: '3 weeks deployment',
        impact: '2,100 tribal villagers with guaranteed vaccine potency and on-demand maternal health diagnostic consults.'
      }
    ],
    verification: null
  },
  {
    id: makeId(106),
    title: 'Minor Forest Produce (Lac & Honey) Primary Processing & Digital Fair-Price Traceability',
    desc: 'Tribal forest gatherers in Khunti district harvest high-grade Rangeeni and Kusmi lac along with wild forest honey. Due to the lack of decentralized primary scraping, washing, and moisture extraction facilities in villages, foragers are forced to make distress sales to middlemen at 30-40% below fair market value. A decentralized solar-powered scraping machine and digital QR-code traceability system is needed.',
    category: 'Rural Livelihoods',
    domain: 'rural_livelihoods',
    subdomain: 'Minor Forest Produce (Lac/Honey) Processing',
    location: 'Murhu & Torpa Blocks, Khunti District, Jharkhand',
    state: 'Jharkhand',
    district: 'Khunti',
    block: 'Murhu',
    affected: '~600 tribal lac forager and artisan households',
    affected_population: 600,
    expected_outcome: 'Establish 2 solar-powered primary lac processing kiosks operated by women SHGs, increasing producer earnings by 45% through Palash brand direct linkage.',
    severity: 'Moderate',
    stage: 3, // Multidisciplinary Team Formed
    date: '18 Aug 2026',
    mapX: 45,
    mapY: 48,
    lat: 22.9734,
    lng: 85.2796,
    photos: [],
    required_expertise: [
      'Food Process Engineering',
      'Mechanical Prototyping',
      'Mobile & Web Software Development',
      'Supply Chain Management'
    ],
    solutions: [],
    verification: null
  },
  {
    id: makeId(107),
    title: 'Rapid Polymer Cold-Mix Asphalt Patching for Monsoon-Damaged Heavy Mining Corridors',
    desc: 'Heavy mining trucks and monsoon flash runoff create deep surface craters and bitumen stripping along the industrial freight corridor connecting Adityapur and Chaibasa. Deep potholes cause frequent vehicular axle fractures, severe traffic snarls, and motorcycle skidding accidents. Conventional hot-mix asphalt plants are shut down during the 4-month monsoon period. A water-resistant polymer cold-mix composite is required for rapid night repairs.',
    category: 'Roads & Infrastructure',
    domain: 'urban_infra',
    subdomain: 'Rapid Road & Pothole Repair',
    location: 'Adityapur Industrial Corridor, East Singhbhum, Jharkhand',
    state: 'Jharkhand',
    district: 'East Singhbhum',
    block: 'Golmuri cum Jugsalai',
    affected: '~8,500 daily freight trucks and two-wheeler commuters',
    affected_population: 8500,
    expected_outcome: 'Deploy fast-curing polymer cold-mix composite patching on 4.5 km of damaged industrial freight corridor without daytime road closures.',
    severity: 'High',
    stage: 8, // Impact Validated
    date: '10 Aug 2026',
    mapX: 58,
    mapY: 62,
    lat: 22.7845,
    lng: 86.1722,
    photos: [
      { src: '/demo/pothole_before.jpg', isVideo: false, name: 'adityapur_corridor_before.jpg' }
    ],
    required_expertise: [
      'Civil Engineering & Highways',
      'Polymer Composite Materials',
      'Mechanized Compaction Logistics'
    ],
    solutions: [
      {
        id: 'SOL-BIT-CIVIL-01',
        title: 'Water-Activated Fast-Curing Polymer Cold Asphalt with Crumb Rubber Binder',
        org: 'BIT Mesra Civil Engineering Lab with Jharkhand Highway Paving Ltd.',
        status: 'Completed',
        desc: 'Advanced ambient-temperature cold-patch formulation incorporating crumb rubber from recycled truck tires and moisture-cured polyurethane resin. Can be laid directly into wet potholes and compacts under ambient traffic in 30 minutes.',
        tech: 'Crumb Rubber Modified Polyurethane Cold-Mix Bitumen + Mechanized Vibratory Compactor',
        cost: '₹1,80,000 for 4.5 km critical corridor repair',
        time: '3 consecutive night shifts',
        impact: 'Eliminated freight transit bottlenecks and zero recorded skid accidents over 90 days of heavy monsoon testing.'
      }
    ],
    verification: {
      resolved: true,
      comment: 'Citizen & transporter field inspection verified on 18 Sept 2026. All deep craters filled with smooth polymer asphalt, stable under heavy multi-axle coal and steel transport.',
      evidence_ref: '/demo/pothole_after.jpg',
      timestamp: '2026-09-18T14:30:00Z',
      verified_by: 'Transporters Association & Local Civic Volunteers'
    }
  },
  {
    id: makeId(108),
    title: 'Universal Tactile Flooring & Audio-Guided Accessibility in District High Schools',
    desc: 'Government high schools and Kasturba Gandhi Balika Vidyalayas across Hazaribagh have zero tactile pathways, audio announcements, or barrier-free ramps for students with visual and locomotor impairments. Visually impaired students rely on peer assistance to navigate between classrooms, sanitation blocks, and dining halls. An open-source, low-cost tactile guide tile system paired with solar Bluetooth beacon audio prompts is needed.',
    category: 'Accessibility',
    domain: 'accessibility',
    subdomain: 'Tactile & Audio Navigational Aids',
    location: 'Ichak & Sadar Blocks, Hazaribagh, Jharkhand',
    state: 'Jharkhand',
    district: 'Hazaribagh',
    block: 'Ichak',
    affected: '~140 differently-abled students across 4 residential schools',
    affected_population: 140,
    expected_outcome: 'Install modular recycled-plastic tactile paving and Bluetooth audio beacons across 4 school campuses to enable safe, independent navigation for all students.',
    severity: 'Moderate',
    stage: 4, // Solution Proposed
    date: '25 Aug 2026',
    mapX: 48,
    mapY: 34,
    lat: 23.9937,
    lng: 85.3643,
    photos: [],
    required_expertise: [
      'Biomedical & Assistive Design',
      'Recycled Polymer Fabrication',
      'Bluetooth BLE Beacon Firmware',
      'Special Education UX'
    ],
    solutions: [
      {
        id: 'SOL-LIET-ACC-01',
        title: 'Recycled Plastic Tactile Pavers with Low-Power BLE Audio Navigational Beacons',
        org: 'LIET Sustainable Tech Squad with Hazaribagh Special Education Cell',
        status: 'Proposed',
        desc: 'Durable interlocking tactile paving blocks molded from locally shredded municipal waste plastic, integrated with solar-powered Bluetooth Low Energy (BLE) audio beacons that announce location prompts in Hindi and Santhali on low-cost pocket receivers or smartphones.',
        tech: 'Recycled HDPE Molded Tactile Tiles + Solar BLE Micro-Beacons + Vernacular Audio Prompts',
        cost: '₹75,000 per school campus',
        time: '2 weeks installation',
        impact: 'Full independent navigational mobility for 140+ visually and mobility-impaired students.'
      }
    ],
    verification: null
  }
];

export const INITIAL_NOTIFICATIONS = [
  { text: 'Government of Jharkhand: Welcome to the SahYog Societal Innovation Collaboration Portal.', unread: true, time: 'Just now' },
  { text: 'New Societal Challenge submitted in Gumla: Arsenic & Fluoride Water Filtration in Rural Hamlets.', unread: true, time: '10 min ago' },
  { text: 'BIT Mesra & Tata Steel Foundation proposed solution for Kanke Valley Solar Micro-Irrigation.', unread: false, time: '1 hour ago' },
  { text: 'Adityapur Freight Corridor polymer cold-mix patch verified and closed after 90 days of monsoon validation.', unread: false, time: 'Yesterday' }
];

// Re-export centralized societal domain engine
export {
  SOCIETAL_DOMAINS,
  CHALLENGE_ASSESSMENT_BY_DOMAIN,
  resolveDomainKey,
  getStandardDomainName,
  calculateDomainImpactSeverity,
  generateDomainPrefilledDetails,
  validateEvidenceFile,
  extractRequiredExpertise,
  // Backward compatibility exports
  CIVIC_CATEGORIES,
  IMPACT_QUESTIONS_BY_CATEGORY,
  resolveCategoryKey,
  getStandardCategoryName,
  calculateCategoryImpactSeverity,
  generateCategoryPrefilledDetails
};

export type {
  SocietalDomainKey,
  DomainQuestionConfig,
  ImpactOption,
  ContextOption,
  DomainImpactAssessment,
  ImpactSeverityResult,
  EvidenceValidationStatus,
  ImageValidationResult,
  // Backward compatibility types
  CivicCategoryKey
};
