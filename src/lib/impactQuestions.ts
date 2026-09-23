// Centralized Societal Challenge Domains & Impact Assessment Engine
// Government of Jharkhand | SIH 2026 (PS ID: SIH26043)
// Supports all 13 societal domains with domain-specific assessment, expertise extraction, and heuristic prioritization.

export type SocietalDomainKey =
  | 'education'
  | 'healthcare'
  | 'agriculture'
  | 'water'
  | 'sanitation'
  | 'environment'
  | 'energy'
  | 'urban_infra'
  | 'accessibility'
  | 'public_admin'
  | 'rural_livelihoods'
  | 'rural_dev'
  | 'other';

// Backward compatibility alias
export type CivicCategoryKey = SocietalDomainKey;

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

export interface DomainMeta {
  key: SocietalDomainKey;
  label: string;
  standardName: string;
  icon: string;
  description: string;
  subdomains: string[];
  defaultExpertise: string[];
}

export const SOCIETAL_DOMAINS: DomainMeta[] = [
  {
    key: 'education',
    label: 'Education & Digital Learning',
    standardName: 'Education',
    icon: '📚',
    description: 'School infrastructure, digital learning access, tribal language pedagogy, STEM resources.',
    subdomains: ['Digital Learning Access', 'Classroom Infrastructure', 'Tribal Pedagogy & Language', 'STEM & Vocational Labs'],
    defaultExpertise: ['Education Technology', 'Computer Science', 'Curriculum Design', 'Instructional Media']
  },
  {
    key: 'healthcare',
    label: 'Healthcare & Public Health',
    standardName: 'Healthcare',
    icon: '🏥',
    description: 'Rural healthcare accessibility, maternal health, diagnostic tele-clinics, medical supply cold chains.',
    subdomains: ['Rural Diagnostic Clinics', 'Telemedicine & Mobile Health', 'Maternal & Child Health', 'Medical Cold Chain'],
    defaultExpertise: ['Biomedical Engineering', 'Public Health Informatics', 'Telemedicine Systems', 'Data Analytics']
  },
  {
    key: 'agriculture',
    label: 'Agriculture & Micro-Irrigation',
    standardName: 'Agriculture',
    icon: '🌾',
    description: 'Smallholder crop productivity, soil health, drip/solar micro-irrigation, weather forecasting.',
    subdomains: ['Solar Micro-Irrigation', 'Soil Health Monitoring', 'Pest Surveillance & Early Warning', 'Post-Harvest Storage'],
    defaultExpertise: ['Agricultural Engineering', 'Agronomy', 'IoT & Soil Sensors', 'Solar Water Pumping']
  },
  {
    key: 'water',
    label: 'Water Resources & Quality',
    standardName: 'Water & Sanitation',
    icon: '💧',
    description: 'Drinking water quality, fluoride/arsenic removal, rainwater harvesting, watershed rejuvenation.',
    subdomains: ['Fluoride & Arsenic Filtration', 'Community Water Purity Telemetry', 'Rainwater Harvesting & Recharge', 'Pipeline Leakage & Distribution'],
    defaultExpertise: ['Water Resources Engineering', 'Environmental Engineering', 'IoT Water Telemetry', 'Chemical Filtration']
  },
  {
    key: 'sanitation',
    label: 'Sanitation & Solid Waste',
    standardName: 'Waste Management',
    icon: '♻️',
    description: 'Community sanitation units, segregated solid waste processing, plastic upcycling, fecal sludge management.',
    subdomains: ['Decentralized Waste Processing', 'Community Sanitation Maintenance', 'Plastic Upcycling', 'Organic Composting'],
    defaultExpertise: ['Environmental Science', 'Mechanical Engineering', 'Sanitation Technology', 'Logistics Optimization']
  },
  {
    key: 'environment',
    label: 'Environment & Mine Reclamation',
    standardName: 'Environment',
    icon: '🌲',
    description: 'Ecological restoration of abandoned open-cast coal mines, afforestation, air & water pollution monitoring.',
    subdomains: ['Open-Cast Coal Mine Reclamation', 'Soil Stabilization & Phytoremediation', 'Air & Industrial Emission Telemetry', 'Forest & Biodiversity Conservation'],
    defaultExpertise: ['Mining & Environmental Engineering', 'Biotechnology', 'Remote Sensing & GIS', 'Soil Chemistry']
  },
  {
    key: 'energy',
    label: 'Renewable Energy & Micro-Grids',
    standardName: 'Electricity',
    icon: '⚡',
    description: 'Solar decentralized micro-grids for off-grid hamlets, biomass power, clean energy storage for public health.',
    subdomains: ['Off-Grid Solar Microgrids', 'Biomass & Biogas Generation', 'Energy Storage for Clinics & Schools', 'Energy Efficiency in Cottage Industry'],
    defaultExpertise: ['Electrical Engineering', 'Power Electronics', 'Solar PV Systems', 'Energy Storage']
  },
  {
    key: 'urban_infra',
    label: 'Urban & Road Infrastructure',
    standardName: 'Roads & Infrastructure',
    icon: '🏗️',
    description: 'Resilient road networks, pothole repair cold-mix, traffic safety, drainage culverts, street lighting.',
    subdomains: ['Rapid Road & Pothole Repair', 'Stormwater Drainage & Culverts', 'Public Fixture & Street Lighting', 'Urban Mobility & Traffic Flow'],
    defaultExpertise: ['Civil Engineering', 'Transportation Engineering', 'Polymer Composite Materials', 'Urban Planning']
  },
  {
    key: 'accessibility',
    label: 'Accessibility & Assistive Tech',
    standardName: 'Accessibility',
    icon: '♿',
    description: 'Universal accessibility in public schools/offices, low-cost assistive devices, audio-tactile civic signage.',
    subdomains: ['Barrier-Free Public Facilities', 'Low-Cost Prosthetics & Wheelchairs', 'Tactile & Audio Navigational Aids', 'Sensory Assistive Learning Kits'],
    defaultExpertise: ['Biomedical & Assistive Design', 'Mechanical Engineering', 'Human-Computer Interaction', 'Special Education Tech']
  },
  {
    key: 'public_admin',
    label: 'Public Administration & Services',
    standardName: 'Public Administration',
    icon: '🏛️',
    description: 'Digital service delivery in tribal areas, grievance tracking transparency, citizen entitlement verification.',
    subdomains: ['Last-Mile Entitlement Verification', 'Multilingual Citizen Chatbots', 'Gram Panchayat Digital Workflows', 'Public Grievance Transparency'],
    defaultExpertise: ['Computer Science & Information Systems', 'Public Policy', 'Natural Language Processing (Indic)', 'UX Research']
  },
  {
    key: 'rural_livelihoods',
    label: 'Rural Livelihoods & Tribal Economy',
    standardName: 'Rural Livelihoods',
    icon: '🧺',
    description: 'Lac, honey & Minor Forest Produce (MFP) value addition, artisan handicraft market linkage, livestock tracking.',
    subdomains: ['Minor Forest Produce (Lac/Honey) Processing', 'Artisan E-Commerce & Market Linkage', 'Poultry & Goat Health Telemetry', 'Tribal Handloom Quality Standardization'],
    defaultExpertise: ['Food Process Engineering', 'Supply Chain Management', 'Mobile App Development', 'Rural Management']
  },
  {
    key: 'rural_dev',
    label: 'Rural Development & Connectivity',
    standardName: 'Rural Development',
    icon: '🏡',
    description: 'All-weather village approach paths, community water ponds, rural knowledge hubs, Panchayat infrastructure.',
    subdomains: ['Low-Cost Rural Bridge & Path Construction', 'Community Pond Rejuvenation', 'Solar Village Knowledge Centers', 'Gram Sabha Resource Mapping'],
    defaultExpertise: ['Rural Infrastructure Engineering', 'GIS & Remote Sensing', 'Water Harvesting', 'Community Development']
  },
  {
    key: 'other',
    label: 'Other Societal Challenge',
    standardName: 'Other',
    icon: '📋',
    description: 'Uncategorized or cross-cutting societal challenge requiring multidisciplinary university-industry innovation.',
    subdomains: ['Cross-Sectoral Innovation', 'General Community Need', 'Emergent Civic Challenge', 'Prototype Demonstration'],
    defaultExpertise: ['Interdisciplinary Engineering', 'Applied Data Science', 'Field Prototyping', 'Project Management']
  }
];

// Backward compatibility alias for UI category lists
export const CIVIC_CATEGORIES = SOCIETAL_DOMAINS;

export interface DomainQuestionConfig {
  key: SocietalDomainKey;
  categoryLabel: string;
  standardCategoryName: string;
  detectedProblemDefault: string;
  subdomains: string[];
  defaultExpertise: string[];
  question1: {
    title: string;
    options: ImpactOption[];
  };
  question2: {
    title: string;
    options: ImpactOption[];
  };
  question3: {
    title: string;
    options: ContextOption[];
  };
}

export const CHALLENGE_ASSESSMENT_BY_DOMAIN: Record<SocietalDomainKey, DomainQuestionConfig> = {
  education: {
    key: 'education',
    categoryLabel: 'Education & Digital Learning',
    standardCategoryName: 'Education',
    detectedProblemDefault: 'Educational Resource Gap or Learning Disruption',
    subdomains: ['Digital Learning Access', 'Classroom Infrastructure', 'Tribal Pedagogy & Language', 'STEM & Vocational Labs'],
    defaultExpertise: ['Education Technology', 'Computer Science', 'Curriculum Design', 'Instructional Media'],
    question1: {
      title: 'How many students or schools are directly affected?',
      options: [
        { id: 'single_school', label: 'Single rural school / Anganwadi (<150 students)', score: 1.0, factorText: 'Single rural school impact' },
        { id: 'cluster_schools', label: 'School cluster / Gram Panchayat (150 – 600 students)', score: 2.0, factorText: 'Gram Panchayat school cluster affected' },
        { id: 'block_level', label: 'Entire Block / Multiple Panchayats (600 – 2,500 students)', score: 3.0, factorText: 'Block-level educational barrier' },
        { id: 'district_wide', label: 'District-wide systemic bottleneck (>2,500 students)', score: 4.0, factorText: 'District-wide education infrastructure deficit' }
      ]
    },
    question2: {
      title: 'What is the nature of the learning or infrastructure gap?',
      options: [
        { id: 'content_deficit', label: 'Lack of local/tribal language content or learning kits', score: 1.5, factorText: 'Lack of multilingual learning kits' },
        { id: 'digital_divide', label: 'No digital devices, offline tablets, or smart classroom access', score: 2.5, factorText: 'Severe digital education divide' },
        { id: 'structural_safety', label: 'Dilapidated classrooms, no electricity, or unsafe building', score: 3.5, factorText: 'Unsafe structural classroom conditions' }
      ]
    },
    question3: {
      title: 'Specific Vulnerability & Contextual Factors',
      options: [
        { id: 'first_gen_learners', label: 'Predominantly first-generation tribal learners', factorText: 'Serves first-generation tribal learners', priorityBoost: true },
        { id: 'board_exam_risk', label: 'Direct risk of student dropouts or board exam failure', factorText: 'Elevated student dropout hazard', priorityBoost: true, severityBoost: true },
        { id: 'no_grid_power', label: 'Zero electrical grid connectivity at facility', factorText: 'Off-grid school requiring solar power', severityBoost: true },
        { id: 'girls_retention', label: 'Impacts adolescent girl student retention & hygiene', factorText: 'Critical factor for girls education retention', priorityBoost: true }
      ]
    }
  },

  healthcare: {
    key: 'healthcare',
    categoryLabel: 'Healthcare & Public Health',
    standardCategoryName: 'Healthcare',
    detectedProblemDefault: 'Rural Healthcare Access or Diagnostic Deficit',
    subdomains: ['Rural Diagnostic Clinics', 'Telemedicine & Mobile Health', 'Maternal & Child Health', 'Medical Cold Chain'],
    defaultExpertise: ['Biomedical Engineering', 'Public Health Informatics', 'Telemedicine Systems', 'Data Analytics'],
    question1: {
      title: 'What is the population and distance to the nearest primary health center?',
      options: [
        { id: 'isolated_hamlet', label: 'Remote hamlet (>15 km through difficult terrain)', score: 3.5, factorText: 'Isolated hamlet with severe health transit barrier' },
        { id: 'panchayat_center', label: 'Gram Panchayat area (5 – 15 km away, poor transport)', score: 2.5, factorText: 'Panchayat population with transport constraints' },
        { id: 'sub_center', label: 'Sub-center exists but lacks diagnostic kits & staff', score: 2.0, factorText: 'Sub-center diagnostic equipment deficit' },
        { id: 'peri_urban', label: 'Nearby community hospital but overcrowded/rationed', score: 1.5, factorText: 'Overburdened health facility' }
      ]
    },
    question2: {
      title: 'What critical medical or diagnostic service is missing?',
      options: [
        { id: 'routine_screening', label: 'Basic vitals, anemia & diabetes screening kits', score: 1.5, factorText: 'Lack of basic screening and early diagnostics' },
        { id: 'maternal_antenatal', label: 'Antenatal ultrasound, fetal monitoring & emergency care', score: 3.0, factorText: 'Maternal health and emergency obstetric gap' },
        { id: 'cold_chain_failure', label: 'Vaccine / antivenom cold chain storage breakdown', score: 3.5, factorText: 'Vaccine & antivenom cold storage failure' }
      ]
    },
    question3: {
      title: 'Vulnerable Groups & Epidemic Risks',
      options: [
        { id: 'snakebite_malaria', label: 'High endemic zone for malaria, sickle cell, or snakebites', factorText: 'Endemic malaria and snakebite territory', priorityBoost: true, severityBoost: true },
        { id: 'infant_malnutrition', label: 'Severe acute malnutrition among children under 5', factorText: 'High prevalence of childhood malnutrition', priorityBoost: true },
        { id: 'monsoon_cutoff', label: 'Village becomes completely cut off during monsoon rains', factorText: 'Monsoon geographical isolation hazard', priorityBoost: true },
        { id: 'elderly_chronic', label: 'High elderly population with unmanaged chronic illnesses', factorText: 'Elderly population without local clinical support' }
      ]
    }
  },

  agriculture: {
    key: 'agriculture',
    categoryLabel: 'Agriculture & Micro-Irrigation',
    standardCategoryName: 'Agriculture',
    detectedProblemDefault: 'Smallholder Irrigation or Crop Yield Bottleneck',
    subdomains: ['Solar Micro-Irrigation', 'Soil Health Monitoring', 'Pest Surveillance & Early Warning', 'Post-Harvest Storage'],
    defaultExpertise: ['Agricultural Engineering', 'Agronomy', 'IoT & Soil Sensors', 'Solar Water Pumping'],
    question1: {
      title: 'How many farming families and cultivated acres are affected?',
      options: [
        { id: 'small_cluster', label: 'Small farmer cluster (10 – 30 families, <25 acres)', score: 1.5, factorText: 'Smallholder farmer cluster impact' },
        { id: 'village_cultivators', label: 'Entire village agricultural land (30 – 150 families, 25–150 acres)', score: 2.5, factorText: 'Village-wide cultivation constraint' },
        { id: 'panchayat_basin', label: 'Multi-village catchment basin (150 – 500 families)', score: 3.5, factorText: 'Multi-village agricultural livelihood threat' },
        { id: 'command_area', label: 'Major watershed / command area (>500 farming households)', score: 4.0, factorText: 'Large-scale command area agrarian crisis' }
      ]
    },
    question2: {
      title: 'What is the primary technical or resource constraint?',
      options: [
        { id: 'dry_season_water', label: 'Zero irrigation during Rabi/summer dry season', score: 3.0, factorText: 'Dry season irrigation unavailability' },
        { id: 'soil_acidity_pest', label: 'Soil degradation, severe acidity, or recurring pest outbreaks', score: 2.5, factorText: 'Soil acidity and uncontrolled pest infestation' },
        { id: 'post_harvest_spoilage', label: 'No cold storage or processing leading to distress sales', score: 2.0, factorText: 'High post-harvest perishability and distress sales' }
      ]
    },
    question3: {
      title: 'Seasonal Vulnerability & Livelihood Factors',
      options: [
        { id: 'tribal_smallholders', label: 'Predominantly marginal tribal farmers (<1 acre holdings)', factorText: 'Affects marginal tribal smallholders', priorityBoost: true },
        { id: 'immediate_sowing_risk', label: 'Imminent sowing/harvest window (crop failure within 3 weeks)', factorText: 'Critical seasonal crop calendar deadline', priorityBoost: true, severityBoost: true },
        { id: 'groundwater_depleted', label: 'Drastic groundwater table depletion (>150 ft)', factorText: 'Severe water table depletion', severityBoost: true },
        { id: 'renewable_potential', label: 'Perennial stream nearby suited for solar lift irrigation', factorText: 'High feasibility for solar micro-lift irrigation' }
      ]
    }
  },

  water: {
    key: 'water',
    categoryLabel: 'Water Resources & Quality',
    standardCategoryName: 'Water & Sanitation',
    detectedProblemDefault: 'Rural Drinking Water Contamination or Supply Scarcity',
    subdomains: ['Fluoride & Arsenic Filtration', 'Community Water Purity Telemetry', 'Rainwater Harvesting & Recharge', 'Pipeline Leakage & Distribution'],
    defaultExpertise: ['Water Resources Engineering', 'Environmental Engineering', 'IoT Water Telemetry', 'Chemical Filtration'],
    question1: {
      title: 'What is the scale of population relying on this water source?',
      options: [
        { id: 'tole_cluster', label: 'Single tola / street cluster (50 – 200 residents)', score: 1.5, factorText: 'Localized tola drinking water crisis' },
        { id: 'revenue_village', label: 'Complete revenue village (200 – 1,000 residents)', score: 2.5, factorText: 'Village-level water access shortage' },
        { id: 'multi_village', label: 'Panchayat hub & neighboring hamlets (1,000 – 4,000 residents)', score: 3.5, factorText: 'Panchayat-level potable water emergency' },
        { id: 'subdivision_wide', label: 'Major habitation / block center (>4,000 residents)', score: 4.0, factorText: 'Subdivision-scale water security hazard' }
      ]
    },
    question2: {
      title: 'What contamination or physical breakdown is present?',
      options: [
        { id: 'chemical_toxins', label: 'Fluoride, arsenic, or heavy metal contamination', score: 3.5, factorText: 'Severe fluoride/arsenic groundwater contamination' },
        { id: 'bacterial_turbid', label: 'Bacterial contamination, foul odor, or red soil turbidity', score: 2.5, factorText: 'High turbidity and bacterial pathogen presence' },
        { id: 'mechanical_fracture', label: 'Pipeline fracture, dried borewell, or broken motor pump', score: 2.0, factorText: 'Broken solar pump or fractured delivery mains' }
      ]
    },
    question3: {
      title: 'Health Risks & Community Context',
      options: [
        { id: 'fluorosis_symptoms', label: 'Children and adults showing visible signs of skeletal/dental fluorosis', factorText: 'Visible fluorosis symptoms documented in community', priorityBoost: true, severityBoost: true },
        { id: 'waterborne_outbreak', label: 'Recent local outbreak of diarrhea, jaundice, or cholera', factorText: 'Active waterborne disease transmission risk', priorityBoost: true, severityBoost: true },
        { id: 'distance_fetching', label: 'Women walking >2 km daily to fetch drinking water', factorText: 'Severe gendered distance penalty for water collection', priorityBoost: true },
        { id: 'school_anganwadi_source', label: 'Primary water source for Anganwadi center or school', factorText: 'Directly impacts child nourishment center', priorityBoost: true }
      ]
    }
  },

  sanitation: {
    key: 'sanitation',
    categoryLabel: 'Sanitation & Solid Waste',
    standardCategoryName: 'Waste Management',
    detectedProblemDefault: 'Community Waste Accumulation or Sanitation Facility Breakdown',
    subdomains: ['Decentralized Waste Processing', 'Community Sanitation Maintenance', 'Plastic Upcycling', 'Organic Composting'],
    defaultExpertise: ['Environmental Science', 'Mechanical Engineering', 'Sanitation Technology', 'Logistics Optimization'],
    question1: {
      title: 'What is the volume and spread of the waste/sanitation issue?',
      options: [
        { id: 'single_point', label: 'Single overflowing garbage point / choked community toilet', score: 1.5, factorText: 'Isolated waste accumulation or latrine block' },
        { id: 'market_strip', label: 'Commercial weekly Haat / public market stretch', score: 2.5, factorText: 'Commercial Haat waste overflow' },
        { id: 'neighborhood_choke', label: 'Large unauthorized dump obstructing drainage across neighborhood', score: 3.5, factorText: 'Large dump choking stormwater drainage' },
        { id: 'township_dump', label: 'Unmanaged municipal dumping ground affecting water bodies', score: 4.0, factorText: 'Major unscientific dumping ground contaminating basin' }
      ]
    },
    question2: {
      title: 'What immediate environmental or health risk is observed?',
      options: [
        { id: 'open_burning', label: 'Toxic open burning of mixed plastic and medical waste', score: 3.5, factorText: 'Toxic open burning emitting carcinogenic smoke' },
        { id: 'leachate_run', label: 'Foul black leachate leaking into drains and handpumps', score: 3.0, factorText: 'Leachate runoff into nearby groundwater' },
        { id: 'pest_stagnation', label: 'Stagnant wastewater breeding mosquitoes and flies', score: 2.0, factorText: 'Stagnant sewage vector breeding ground' }
      ]
    },
    question3: {
      title: 'Environmental Sensitivities',
      options: [
        { id: 'near_food_market', label: 'Located directly adjacent to food stalls or vegetable Haat', factorText: 'Direct proximity to open food market', priorityBoost: true },
        { id: 'monsoon_choke', label: 'Causes residential lane submergence during heavy rains', factorText: 'Severe monsoon drainage choke hazard', priorityBoost: true },
        { id: 'stray_animals', label: 'Scavenging by cattle and stray dogs spreading plastic', factorText: 'Animal ingestion and plastic dispersal risk' },
        { id: 'hospital_waste', label: 'Suspected mixed biomedical waste discarded in open', factorText: 'Hazardous biomedical waste exposure', priorityBoost: true, severityBoost: true }
      ]
    }
  },

  environment: {
    key: 'environment',
    categoryLabel: 'Environment & Mine Reclamation',
    standardCategoryName: 'Environment',
    detectedProblemDefault: 'Open-Cast Mine Degradation or Ecological Imbalance',
    subdomains: ['Open-Cast Coal Mine Reclamation', 'Soil Stabilization & Phytoremediation', 'Air & Industrial Emission Telemetry', 'Forest & Biodiversity Conservation'],
    defaultExpertise: ['Mining & Environmental Engineering', 'Biotechnology', 'Remote Sensing & GIS', 'Soil Chemistry'],
    question1: {
      title: 'What is the geographic scale of land degradation or pollution?',
      options: [
        { id: 'local_spoil_dump', label: 'Localized overburden spoil dump (<5 hectares)', score: 1.5, factorText: 'Localized overburden slope instability' },
        { id: 'medium_mine_pit', label: 'Abandoned mining pit & degraded watershed (5 – 25 hectares)', score: 2.5, factorText: 'Medium-scale abandoned mine pit degradation' },
        { id: 'regional_coal_belt', label: 'Extensive coalfield industrial belt (25 – 100 hectares)', score: 3.5, factorText: 'Extensive mining belt environmental stress' },
        { id: 'river_basin_degrade', label: 'Damodar / Subarnarekha river basin contamination corridor', score: 4.0, factorText: 'Critical river basin industrial contamination' }
      ]
    },
    question2: {
      title: 'What is the active ecological threat?',
      options: [
        { id: 'subsurface_coal_fire', label: 'Sub-surface coal seam fires producing toxic sulfur fumes', score: 4.0, factorText: 'Sub-surface coal fires and toxic gas venting' },
        { id: 'acid_mine_drainage', label: 'Acid mine drainage contaminating agricultural topsoil', score: 3.0, factorText: 'Acid mine drainage poisoning arable land' },
        { id: 'dust_particulate', label: 'Heavy coal particulate dust settling on homes and crops', score: 2.0, factorText: 'Chronic fugitive coal dust particulate pollution' }
      ]
    },
    question3: {
      title: 'Community Impact & Land Reclamation Opportunity',
      options: [
        { id: 'resettlement_colonies', label: 'Directly impacts tribal resettlement colonies and bastis', factorText: 'Adjacent to vulnerable tribal settlements', priorityBoost: true },
        { id: 'phytoremediation_suited', label: 'Site suitable for fast-growing vetiver/bamboo bio-remediation', factorText: 'High potential for phytoremediation & bamboo bio-shield' },
        { id: 'slope_landslide_risk', label: 'Steep overburden slope prone to landslides during monsoon', factorText: 'Immediate slope collapse and landslide hazard', priorityBoost: true, severityBoost: true },
        { id: 'water_table_drying', label: 'Surrounding village wells dried up due to deep quarry seepage', factorText: 'Hydrological depletion of surrounding village aquifers', severityBoost: true }
      ]
    }
  },

  energy: {
    key: 'energy',
    categoryLabel: 'Renewable Energy & Micro-Grids',
    standardCategoryName: 'Electricity',
    detectedProblemDefault: 'Rural Off-Grid Power Deficit or Clean Energy Transition',
    subdomains: ['Off-Grid Solar Microgrids', 'Biomass & Biogas Generation', 'Energy Storage for Clinics & Schools', 'Energy Efficiency in Cottage Industry'],
    defaultExpertise: ['Electrical Engineering', 'Power Electronics', 'Solar PV Systems', 'Energy Storage'],
    question1: {
      title: 'How many households or critical facilities lack reliable power?',
      options: [
        { id: 'single_facility', label: 'Essential community facility (Health sub-center / Anganwadi)', score: 2.0, factorText: 'Crucial health/nutrition facility off-grid' },
        { id: 'hamlet_cluster', label: 'Isolated tribal tola / hamlet (20 – 60 households)', score: 2.5, factorText: 'Off-grid tribal tola without lighting' },
        { id: 'panchayat_erratic', label: 'Entire Gram Panchayat suffering 18+ hour daily load-shedding', score: 3.5, factorText: 'Chronic load-shedding paralyzing village economy' },
        { id: 'forest_enclave', label: 'Forest core village with zero grid transmission feasibility', score: 4.0, factorText: 'Grid-infeasible forest habitation needing micro-grid' }
      ]
    },
    question2: {
      title: 'What critical operation is crippled by the power shortage?',
      options: [
        { id: 'vaccine_oxygen', label: 'Vaccine refrigerators, diagnostic devices, and maternal care', score: 3.5, factorText: 'Critical medical refrigeration and emergency power failure' },
        { id: 'irrigation_pumping', label: 'Daytime agricultural pumping causing reliance on diesel', score: 2.5, factorText: 'High diesel expense for agricultural pumping' },
        { id: 'student_study_safety', label: 'Night study impossible, kerosene lamp respiratory hazards', score: 2.0, factorText: 'Kerosene smoke hazards and dark study conditions' }
      ]
    },
    question3: {
      title: 'Clean Energy & Local Resource Factors',
      options: [
        { id: 'solar_insolation', label: 'Ample open land with high solar insolation (>300 sunny days)', factorText: 'Ideal solar irradiance for community micro-grid' },
        { id: 'biomass_availability', label: 'Abundant cattle dung / agricultural residues for biogas plant', factorText: 'High feedstock potential for decentralized biogas' },
        { id: 'micro_hydro_stream', label: 'Hill stream with continuous flow suitable for pico-hydro', factorText: 'Perennial hill stream viable for pico-hydro turbine' },
        { id: 'wild_animal_night', label: 'Elephant/wildlife movement zone requiring perimeter solar lighting', factorText: 'Elephant corridor requiring solar perimeter safety lights', priorityBoost: true }
      ]
    }
  },

  urban_infra: {
    key: 'urban_infra',
    categoryLabel: 'Urban & Road Infrastructure',
    standardCategoryName: 'Roads & Infrastructure',
    detectedProblemDefault: 'Critical Road Damage, Culvert Fracture, or Infrastructure Disruption',
    subdomains: ['Rapid Road & Pothole Repair', 'Stormwater Drainage & Culverts', 'Public Fixture & Street Lighting', 'Urban Mobility & Traffic Flow'],
    defaultExpertise: ['Civil Engineering', 'Transportation Engineering', 'Polymer Composite Materials', 'Urban Planning'],
    question1: {
      title: 'What is the traffic scale and physical extent of the infrastructure damage?',
      options: [
        { id: 'arterial_highway', label: 'District arterial road / state highway connecting multiple towns', score: 4.0, factorText: 'Major inter-district arterial corridor bottleneck' },
        { id: 'link_road', label: 'Village-to-market approach road / busy transit feeder', score: 3.0, factorText: 'Vital rural-to-market feeder road disruption' },
        { id: 'internal_colony', label: 'Residential colony main road / school approach', score: 2.0, factorText: 'Residential colony and school approach disruption' },
        { id: 'localized_patch', label: 'Isolated crater cluster (<15 meters stretch)', score: 1.0, factorText: 'Localized road surface damage' }
      ]
    },
    question2: {
      title: 'What is the severity of structural failure and risk?',
      options: [
        { id: 'culvert_collapse', label: 'Bridge/culvert structural collapse or deep road breach', score: 3.5, factorText: 'Culvert structural fracture and vehicular breach' },
        { id: 'deep_craters_water', label: 'Deep potholes (>15 cm) submerged under muddy monsoon water', score: 2.5, factorText: 'Deep submerged craters causing vehicle overturns' },
        { id: 'bitumen_stripping', label: 'Bitumen erosion, gravel scatter, and severe tire slip', score: 1.5, factorText: 'Surface bitumen loss and two-wheeler skid hazard' }
      ]
    },
    question3: {
      title: 'Safety Hazards & Contextual Multipliers',
      options: [
        { id: 'school_hospital_route', label: 'Primary ambulance and school bus transit route', factorText: 'Emergency ambulance and school transit route', priorityBoost: true, severityBoost: true },
        { id: 'accident_prone_turn', label: 'Located on blind curve or steep downhill gradient', factorText: 'High-risk blind turn collision hazard', priorityBoost: true },
        { id: 'dark_no_lighting', label: 'Completely unlit at night with deep drainage drop-off', factorText: 'Unlit road with unbarricaded drainage drop', priorityBoost: true },
        { id: 'cold_patch_feasible', label: 'Demands fast-curing polymer cold-mix for zero daytime blockage', factorText: 'Ideal for polymer cold-mix composite intervention' }
      ]
    }
  },

  accessibility: {
    key: 'accessibility',
    categoryLabel: 'Accessibility & Assistive Tech',
    standardCategoryName: 'Accessibility',
    detectedProblemDefault: 'Public Accessibility Barrier or Assistive Tech Deficit',
    subdomains: ['Barrier-Free Public Facilities', 'Low-Cost Prosthetics & Wheelchairs', 'Tactile & Audio Navigational Aids', 'Sensory Assistive Learning Kits'],
    defaultExpertise: ['Biomedical & Assistive Design', 'Mechanical Engineering', 'Human-Computer Interaction', 'Special Education Tech'],
    question1: {
      title: 'What public institution or community space is inaccessible?',
      options: [
        { id: 'hospital_collectorate', label: 'District Hospital / Collectorate / Block Administrative Office', score: 3.5, factorText: 'Major civic administration & hospital inaccessible' },
        { id: 'schools_colleges', label: 'Government high schools / Higher education campuses', score: 3.0, factorText: 'Educational campus access barriers for disabled youth' },
        { id: 'transit_bus_train', label: 'Bus terminal / railway station / pedestrian crossing', score: 2.5, factorText: 'Public transport hub mobility barrier' },
        { id: 'local_panchayat', label: 'Gram Panchayat Bhawan / Community center', score: 1.5, factorText: 'Local Panchayat Bhawan ramp deficit' }
      ]
    },
    question2: {
      title: 'What is the primary physical or assistive barrier?',
      options: [
        { id: 'no_ramps_steps_only', label: 'Steep multi-floor stairs with zero ramps or lifts', score: 3.0, factorText: 'Stair-only access completely barring wheelchair users' },
        { id: 'no_tactile_signage', label: 'Zero tactile flooring or audio indicators for visually impaired', score: 2.0, factorText: 'Absence of tactile guidance and braille/audio signage' },
        { id: 'prosthetics_shortage', label: 'Community members lack affordable durable prosthetics/wheelchairs', score: 2.5, factorText: 'Lack of rugged all-terrain assistive mobility hardware' }
      ]
    },
    question3: {
      title: 'Beneficiary Population Factors',
      options: [
        { id: 'disabled_students', label: 'Directly causes disabled students to discontinue formal education', factorText: 'Direct trigger for disabled student dropouts', priorityBoost: true, severityBoost: true },
        { id: 'senior_citizens', label: 'Heavy daily senior citizen footfall for pensions & medication', factorText: 'Prevents senior citizen access to social pensions', priorityBoost: true },
        { id: 'all_terrain_need', label: 'Requires rugged, unpaved terrain mobility solutions', factorText: 'Demands ruggedized all-terrain chassis engineering' },
        { id: 'low_cost_local', label: 'Solution must be repairable using locally sourced parts', factorText: 'Demands low-cost open-source mechanical fabrication' }
      ]
    }
  },

  public_admin: {
    key: 'public_admin',
    categoryLabel: 'Public Administration & Services',
    standardCategoryName: 'Public Administration',
    detectedProblemDefault: 'Public Service Delivery Bottleneck or Grievance Transparency Gap',
    subdomains: ['Last-Mile Entitlement Verification', 'Multilingual Citizen Chatbots', 'Gram Panchayat Digital Workflows', 'Public Grievance Transparency'],
    defaultExpertise: ['Computer Science & Information Systems', 'Public Policy', 'Natural Language Processing (Indic)', 'UX Research'],
    question1: {
      title: 'What citizen segment is affected by the service bottleneck?',
      options: [
        { id: 'district_entitlement', label: 'District-wide beneficiaries of welfare schemes (Ration/PDS/Pension)', score: 3.5, factorText: 'District-scale welfare delivery friction' },
        { id: 'block_services', label: 'Block-level caste/income/land record issuance', score: 2.5, factorText: 'Block-level administrative record delay' },
        { id: 'panchayat_register', label: 'Gram Panchayat level birth/death/MGNREGA job card processing', score: 2.0, factorText: 'Panchayat-level civic entitlement lag' },
        { id: 'localized_cell', label: 'Single department citizen inquiry center', score: 1.0, factorText: 'Departmental counter delay' }
      ]
    },
    question2: {
      title: 'What is the root administrative or technical constraint?',
      options: [
        { id: 'connectivity_biometric', label: 'Biometric POS failure due to poor cellular connectivity at ration shops', score: 3.5, factorText: 'Biometric POS failure denying food grain entitlements' },
        { id: 'language_barrier', label: 'Forms in complex bureaucratic terms, no Santhali/Ho/Kurukh guidance', score: 2.5, factorText: 'Language barrier in tribal dialect administrative access' },
        { id: 'opaque_tracking', label: 'Citizens have no digital way to know why applications are rejected', score: 2.0, factorText: 'Opaque status tracking and grievance silence' }
      ]
    },
    question3: {
      title: 'Social Vulnerability Context',
      options: [
        { id: 'elderly_pensioners', label: 'Elderly widows and disabled pensioners travelling >20 km repeatedly', factorText: 'Severe physical toll on vulnerable pensioners', priorityBoost: true, severityBoost: true },
        { id: 'food_security_risk', label: 'Denial of subsidized food grains causing household food insecurity', factorText: 'Imminent household food security vulnerability', priorityBoost: true, severityBoost: true },
        { id: 'offline_sync_needed', label: 'Must operate in complete offline mode with store-and-forward sync', factorText: 'Demands offline-first store-and-forward architecture' },
        { id: 'voice_interface', label: 'High non-literate citizen percentage requiring voice-based UI', factorText: 'Requires vernacular voice-based interactive interface' }
      ]
    }
  },

  rural_livelihoods: {
    key: 'rural_livelihoods',
    categoryLabel: 'Rural Livelihoods & Tribal Economy',
    standardCategoryName: 'Rural Livelihoods',
    detectedProblemDefault: 'Minor Forest Produce (MFP) or Artisan Value-Chain Bottleneck',
    subdomains: ['Minor Forest Produce (Lac/Honey) Processing', 'Artisan E-Commerce & Market Linkage', 'Poultry & Goat Health Telemetry', 'Tribal Handloom Quality Standardization'],
    defaultExpertise: ['Food Process Engineering', 'Supply Chain Management', 'Mobile App Development', 'Rural Management'],
    question1: {
      title: 'How many tribal producers or artisan households are impacted?',
      options: [
        { id: 'large_cluster', label: 'Large traditional cluster (>250 artisan/forager families)', score: 3.5, factorText: 'Large tribal artisan cluster livelihood constraint' },
        { id: 'village_producers', label: 'Village SHG federation (50 – 250 producers)', score: 2.5, factorText: 'Village SHG livelihood value-chain barrier' },
        { id: 'small_shg', label: 'Single Self-Help Group (15 – 50 women)', score: 1.5, factorText: 'SHG cooperative production hurdle' },
        { id: 'individual_craft', label: 'Specialized master artisans (<15 practitioners)', score: 1.0, factorText: 'Endangered traditional craft skill preservation' }
      ]
    },
    question2: {
      title: 'Where does value loss occur in the economic chain?',
      options: [
        { id: 'raw_distress_sale', label: 'Middlemen exploit lack of primary processing equipment (Lac/Tasar/Honey)', score: 3.0, factorText: 'Severe middleman extraction due to zero primary processing' },
        { id: 'storage_damage', label: 'Fungus/infestation during monsoon storage destroying inventory', score: 2.5, factorText: 'High storage loss and moisture spoilage' },
        { id: 'market_visibility', label: 'No direct access to urban institutional buyers or fair price certification', score: 2.0, factorText: 'Lack of fair trade traceability and direct buyer linkage' }
      ]
    },
    question3: {
      title: 'Tribal Welfare & Sustainability Factors',
      options: [
        { id: 'women_primary_earners', label: 'Over 80% of producers are tribal women and forest dwellers', factorText: 'Primary livelihood source for tribal women SHGs', priorityBoost: true },
        { id: 'gi_tag_heritage', label: 'Registered Geographical Indication (e.g. Sohrai-Khovar / Lac craft)', factorText: 'Heritage craft with Geographical Indication (GI) importance' },
        { id: 'solar_machinery_need', label: 'Requires solar-powered peeling/crushing machines suited for off-grid tolas', factorText: 'Demands decentralized solar-powered processing hardware' },
        { id: 'seasonal_flush', label: 'Urgent intervention needed before impending annual forest flush harvest', factorText: 'Imminent harvest flush with high price volatility', priorityBoost: true }
      ]
    }
  },

  rural_dev: {
    key: 'rural_dev',
    categoryLabel: 'Rural Development & Connectivity',
    standardCategoryName: 'Rural Development',
    detectedProblemDefault: 'Village Connectivity, Community Water Body, or Infrastructure Gap',
    subdomains: ['Low-Cost Rural Bridge & Path Construction', 'Community Pond Rejuvenation', 'Solar Village Knowledge Centers', 'Gram Sabha Resource Mapping'],
    defaultExpertise: ['Rural Infrastructure Engineering', 'GIS & Remote Sensing', 'Water Harvesting', 'Community Development'],
    question1: {
      title: 'What is the scale of village community affected?',
      options: [
        { id: 'panchayat_hub', label: 'Multiple revenue villages connected through this point (>1,500 people)', score: 3.5, factorText: 'Multi-village connectivity lifeline affected' },
        { id: 'single_village', label: 'Single revenue village (400 – 1,500 residents)', score: 2.5, factorText: 'Village-wide community infrastructure gap' },
        { id: 'isolated_tola', label: 'Forested tola with difficult approach road (100 – 400 residents)', score: 2.0, factorText: 'Forested tola transit isolation' },
        { id: 'neighborhood_pond', label: 'Localized community pond / public well', score: 1.0, factorText: 'Localized community water body deficit' }
      ]
    },
    question2: {
      title: 'What is the primary community infrastructure hurdle?',
      options: [
        { id: 'river_stream_crossing', label: 'Unbridged stream crossing cutting off access during monsoon floods', score: 3.5, factorText: 'Unbridged river crossing drowning risk and monsoon isolation' },
        { id: 'silted_water_body', label: 'Silted traditional pond unable to recharge groundwater and livestock', score: 2.5, factorText: 'Extensively silted community pond starving livestock and water table' },
        { id: 'no_community_hub', label: 'No shared building for Gram Sabha, adult training, or digital services', score: 1.5, factorText: 'Absence of community multipurpose knowledge center' }
      ]
    },
    question3: {
      title: 'Contextual Multipliers',
      options: [
        { id: 'emergency_hospital_cutoff', label: 'Cutoff prevents pregnant women and patients reaching medical care', factorText: 'Blocks life-saving emergency medical transport', priorityBoost: true, severityBoost: true },
        { id: 'school_crossing_danger', label: 'Children walk across rushing waist-deep stream to reach school', factorText: 'Dangerous stream crossing for school children', priorityBoost: true, severityBoost: true },
        { id: 'community_labor_ready', label: 'Local Gram Sabha and youth ready to contribute Shramdaan / manual labor', factorText: 'High community mobilization & Shramdaan readiness' },
        { id: 'bamboo_local_materials', label: 'Locally available timber/stone/bamboo suited for bio-engineering', factorText: 'Abundant local raw materials for green construction' }
      ]
    }
  },

  other: {
    key: 'other',
    categoryLabel: 'Other Societal Challenge',
    standardCategoryName: 'Other',
    detectedProblemDefault: 'Community Societal Challenge',
    subdomains: ['Cross-Sectoral Innovation', 'General Community Need', 'Emergent Civic Challenge', 'Prototype Demonstration'],
    defaultExpertise: ['Interdisciplinary Engineering', 'Applied Data Science', 'Field Prototyping', 'Project Management'],
    question1: {
      title: 'What is the scale of affected community / geographic extent?',
      options: [
        { id: 'district_scale', label: 'Regional / District-wide systemic societal challenge', score: 4.0, factorText: 'District-wide societal impact' },
        { id: 'block_panchayat', label: 'Block / Gram Panchayat level community issue (hundreds of residents)', score: 3.0, factorText: 'Block-level community reach' },
        { id: 'neighborhood', label: 'Neighborhood or specific village cluster (50 – 200 residents)', score: 2.0, factorText: 'Neighborhood-scale community challenge' },
        { id: 'isolated_case', label: 'Localized single-point challenge (<50 individuals)', score: 1.0, factorText: 'Localized community need' }
      ]
    },
    question2: {
      title: 'What is the urgency and potential impact of intervention?',
      options: [
        { id: 'high_urgency', label: 'Urgent intervention needed to prevent irreversible harm or loss of life', score: 3.5, factorText: 'Critical urgency to prevent irreversible community harm' },
        { id: 'moderate_impact', label: 'Substantial improvement in quality of life, income, or health', score: 2.5, factorText: 'High potential for measurable socio-economic improvement' },
        { id: 'gradual_improvement', label: 'Routine optimization of civic public infrastructure', score: 1.5, factorText: 'Steady public infrastructure improvement' }
      ]
    },
    question3: {
      title: 'Collaboration & Innovation Potential',
      options: [
        { id: 'student_faculty_fit', label: 'Highly suitable for academic Capstone / multidisciplinary student innovation', factorText: 'High suitability for university engineering research' },
        { id: 'industry_csr_ready', label: 'Potential for corporate CSR grant or industrial co-development', factorText: 'Potential alignment with industry CSR funding' },
        { id: 'marginalized_group', label: 'Focuses on marginalized, tribal, or differently-abled population', factorText: 'Directly benefits historically marginalized community', priorityBoost: true },
        { id: 'replicable_model', label: 'Solution can be replicated across all 24 districts of Jharkhand', factorText: 'High state-wide replicability potential', priorityBoost: true }
      ]
    }
  }
};

// Aliases for backward compatibility
export const IMPACT_QUESTIONS_BY_CATEGORY = CHALLENGE_ASSESSMENT_BY_DOMAIN;

// Helper to resolve any input string to a valid SocietalDomainKey
export function resolveDomainKey(domainOrCat?: string): SocietalDomainKey {
  if (!domainOrCat) return 'other';
  const c = domainOrCat.toLowerCase();
  if (c.includes('edu') || c.includes('school') || c.includes('learn') || c.includes('class')) return 'education';
  if (c.includes('health') || c.includes('medic') || c.includes('clinic') || c.includes('hosp') || c.includes('doctor')) return 'healthcare';
  if (c.includes('agri') || c.includes('farm') || c.includes('crop') || c.includes('irrig') || c.includes('soil')) return 'agriculture';
  if (c.includes('water') || c.includes('drinking') || c.includes('fluoride') || c.includes('arsenic') || c.includes('pond')) return 'water';
  if (c.includes('waste') || c.includes('sanitat') || c.includes('garbage') || c.includes('trash') || c.includes('toilet') || c.includes('drain')) return 'sanitation';
  if (c.includes('env') || c.includes('mine') || c.includes('coal') || c.includes('forest') || c.includes('reclam') || c.includes('pollut')) return 'environment';
  if (c.includes('energy') || c.includes('solar') || c.includes('power') || c.includes('electr') || c.includes('grid')) return 'energy';
  if (c.includes('road') || c.includes('infra') || c.includes('pothole') || c.includes('culvert') || c.includes('street') || c.includes('traffic')) return 'urban_infra';
  if (c.includes('access') || c.includes('disab') || c.includes('wheelchair') || c.includes('ramp') || c.includes('blind')) return 'accessibility';
  if (c.includes('admin') || c.includes('public serv') || c.includes('pension') || c.includes('ration') || c.includes('pds')) return 'public_admin';
  if (c.includes('livelihood') || c.includes('tribal') || c.includes('lac') || c.includes('artisan') || c.includes('craft') || c.includes('handicraft') || c.includes('shg')) return 'rural_livelihoods';
  if (c.includes('rural dev') || c.includes('village') || c.includes('panchayat') || c.includes('bridge') || c.includes('path')) return 'rural_dev';
  return 'other';
}

export const resolveCategoryKey = resolveDomainKey;

export function getStandardDomainName(key: SocietalDomainKey): string {
  return CHALLENGE_ASSESSMENT_BY_DOMAIN[key]?.standardCategoryName || 'Other';
}

export const getStandardCategoryName = getStandardDomainName;

// -------------------------------------------------------------
// Required Expertise Extraction Engine
// Deterministic, transparent prototype heuristic extraction
// -------------------------------------------------------------
export function extractRequiredExpertise(domainKey: SocietalDomainKey, titleOrText: string = '', descText: string = ''): string[] {
  const domainConfig = CHALLENGE_ASSESSMENT_BY_DOMAIN[domainKey] || CHALLENGE_ASSESSMENT_BY_DOMAIN['other'];
  const base = [...domainConfig.defaultExpertise];
  const lower = `${titleOrText} ${descText}`.toLowerCase();

  const additionalSkills: string[] = [];

  // Technology & Engineering triggers
  if (lower.includes('iot') || lower.includes('sensor') || lower.includes('telemetry') || lower.includes('monitor')) {
    additionalSkills.push('IoT & Embedded Systems');
  }
  if (lower.includes('solar') || lower.includes('photovoltaic') || lower.includes('clean energy')) {
    additionalSkills.push('Solar PV & Power Electronics');
  }
  if (lower.includes('mobile') || lower.includes('app') || lower.includes('software') || lower.includes('digital') || lower.includes('portal')) {
    additionalSkills.push('Mobile & Web Software Development');
  }
  if (lower.includes('ai') || lower.includes('data') || lower.includes('analytics') || lower.includes('predict')) {
    additionalSkills.push('Applied Data Science & Machine Learning');
  }
  if (lower.includes('material') || lower.includes('composite') || lower.includes('asphalt') || lower.includes('polymer')) {
    additionalSkills.push('Materials Science & Composites');
  }
  if (lower.includes('water') || lower.includes('filter') || lower.includes('arsenic') || lower.includes('fluoride')) {
    additionalSkills.push('Water Treatment & Chemical Engineering');
  }
  if (lower.includes('tribal') || lower.includes('community') || lower.includes('shg') || lower.includes('social')) {
    additionalSkills.push('Community Action & Rural Management');
  }
  if (lower.includes('gis') || lower.includes('map') || lower.includes('satellite') || lower.includes('remote sensing')) {
    additionalSkills.push('GIS & Spatial Mapping');
  }

  // Combine and deduplicate
  const combined = Array.from(new Set([...base, ...additionalSkills]));
  return combined.slice(0, 6);
}

// -------------------------------------------------------------
// Dynamic Impact & Priority Calculation
// -------------------------------------------------------------
export interface DomainImpactAssessment {
  categoryKey?: SocietalDomainKey;
  domainKey?: SocietalDomainKey;
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

export function calculateDomainImpactSeverity(assessment: DomainImpactAssessment): ImpactSeverityResult {
  const dKey = assessment.domainKey || assessment.categoryKey || 'other';
  const config = CHALLENGE_ASSESSMENT_BY_DOMAIN[dKey] || CHALLENGE_ASSESSMENT_BY_DOMAIN['other'];
  const q1Id = assessment.q1OptionId ?? assessment.question1Id;
  const q2Id = assessment.q2OptionId ?? assessment.question2Id;
  const ctxIds = assessment.contextOptionIds ?? assessment.contextIds ?? [];

  const q1 = config.question1.options.find(o => o.id === q1Id);
  const q2 = config.question2.options.find(o => o.id === q2Id);
  const selectedContexts = config.question3.options.filter(o => ctxIds.includes(o.id));

  if (!q1 && !q2) {
    return {
      suggestedSeverity: 'Moderate',
      suggestedPriority: 'Moderate',
      factors: ['Awaiting community impact assessment factors'],
      totalScore: 0,
      isPending: true,
      categoryLabel: config.categoryLabel,
      explanation: 'Default initial level. Please select the specific impact factors below to evaluate challenge priority.'
    };
  }

  const factors: string[] = [];
  if (q1) factors.push(q1.factorText);
  if (q2) factors.push(q2.factorText);
  selectedContexts.forEach(c => factors.push(c.factorText));

  let physicalScore = (q1?.score || 2.0) + (q2?.score || 1.5);
  const severityBoostCount = selectedContexts.filter(c => c.severityBoost).length;
  physicalScore += severityBoostCount * 1.0;

  let priorityScore = physicalScore;
  const priorityBoostCount = selectedContexts.filter(c => c.priorityBoost).length;
  priorityScore += priorityBoostCount * 1.5;

  let suggestedSeverity: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate';
  if (physicalScore <= 2.8) suggestedSeverity = 'Low';
  else if (physicalScore <= 4.8) suggestedSeverity = 'Moderate';
  else if (physicalScore <= 6.8) suggestedSeverity = 'High';
  else suggestedSeverity = 'Critical';

  let suggestedPriority: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate';
  if (priorityScore <= 3.5) suggestedPriority = 'Low';
  else if (priorityScore <= 5.5) suggestedPriority = 'Moderate';
  else if (priorityScore <= 7.5) suggestedPriority = 'High';
  else suggestedPriority = 'Critical';

  // Factual synthesized explanation referencing ONLY selected factors
  let explanation = `Suggested ${suggestedPriority} priority based on `;
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

// Backward compatibility alias
export const calculateCategoryImpactSeverity = calculateDomainImpactSeverity;

// -------------------------------------------------------------
// Prefilled Details Generator
// -------------------------------------------------------------
export function generateDomainPrefilledDetails(params: {
  domainKey?: SocietalDomainKey;
  categoryKey?: SocietalDomainKey;
  district?: string;
  block?: string;
  location?: string;
  locationAddress?: string;
  landmark?: string;
  severity?: string;
  priority?: string;
  factors?: string[];
  q1OptionId?: string;
  q2OptionId?: string;
  contextOptionIds?: string[];
}): { suggestedTitle: string; suggestedDescription: string; detectedProblem: string; expectedOutcome: string } {
  const key = params.domainKey || params.categoryKey || 'other';
  const config = CHALLENGE_ASSESSMENT_BY_DOMAIN[key] || CHALLENGE_ASSESSMENT_BY_DOMAIN['other'];

  const district = params.district || 'Ranchi';
  const block = params.block ? `${params.block} Block, ` : '';
  const areaDesc = `${block}${district}, Jharkhand`;
  const detectedProblem = config.detectedProblemDefault;

  const prio = params.priority || 'Moderate';
  const prefix = prio === 'Critical' ? 'High-Priority ' : prio === 'High' ? 'Strategic ' : '';
  const suggestedTitle = `${prefix}${detectedProblem} in ${areaDesc}`;

  const factors = params.factors || [];
  const factorSummary = factors.length > 0
    ? ` Observed field conditions: ${factors.join('; ')}.`
    : '';

  const suggestedDescription = `A societal challenge within ${config.categoryLabel} has been identified in ${areaDesc}.${factorSummary} This challenge requires multidisciplinary HEI research formulation and industry pilot co-development under the Government of Jharkhand innovation ecosystem.`;

  const expectedOutcome = `Deploy a scalable, locally manufactured university-industry solution that directly addresses ${config.categoryLabel.toLowerCase()} in ${district}, ensuring measurable social impact and community adoption.`;

  return { suggestedTitle, suggestedDescription, detectedProblem, expectedOutcome };
}

// Backward compatibility alias
export const generateCategoryPrefilledDetails = generateDomainPrefilledDetails;

// -------------------------------------------------------------
// Evidence Validation System (Honest Heuristic Checking)
// Rejects selfies, food/pets, blurry images; maps keywords to domains
// -------------------------------------------------------------
export type EvidenceValidationStatus =
  | 'valid'
  | 'selfie'
  | 'non_civic'
  | 'low_quality'
  | 'uncertain';

export interface ImageValidationResult {
  status: EvidenceValidationStatus;
  detectedCategoryKey?: SocietalDomainKey;
  suggestedCategoryKey?: SocietalDomainKey;
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
      title: "This image doesn't appear to document a societal challenge.",
      message: 'Please upload field documentation of the challenge (e.g. water source, crop issue, school facility, healthcare need, road infrastructure, or environmental site).',
      reason: 'Personal portrait / selfie detected. Please upload field documentation of the societal challenge.',
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
      title: 'Unable to identify a societal challenge in this image.',
      message: 'Please capture or upload evidence showing the real-world challenge you wish to address.',
      reason: 'Non-civic / personal subject detected. Please upload documentation of the societal challenge.',
      canProceed: false,
      requiresManualCategory: false
    };
  }

  // 3. Check for low-quality / corrupt / blurry heuristics
  const lowQualityTerms = ['blurry', 'dark', 'black', 'corrupt', 'tiny'];
  if (lowQualityTerms.some(term => lowerName.includes(term))) {
    return {
      status: 'low_quality',
      title: 'Image quality is too low for technical assessment.',
      message: 'Please upload a clearer photograph or field document for research evaluation.',
      reason: 'Image is too blurry or low-resolution for institutional review. Please upload clearer evidence.',
      canProceed: false,
      requiresManualCategory: false
    };
  }

  // 4. Keyword-based initial domain suggestions from file name or caption (Prototype Heuristic)
  if (lowerName.includes('edu') || lowerName.includes('school') || lowerName.includes('class') || lowerName.includes('student')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'education',
      suggestedCategoryKey: 'education',
      title: 'Evidence Verified (Education)',
      message: 'Educational infrastructure / learning gap evidence registered for evaluation.',
      reason: 'Education & learning documentation verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('health') || lowerName.includes('clinic') || lowerName.includes('medic') || lowerName.includes('doctor')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'healthcare',
      suggestedCategoryKey: 'healthcare',
      title: 'Evidence Verified (Healthcare)',
      message: 'Healthcare facility or diagnostic gap evidence registered.',
      reason: 'Healthcare access documentation verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('agri') || lowerName.includes('crop') || lowerName.includes('farm') || lowerName.includes('soil')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'agriculture',
      suggestedCategoryKey: 'agriculture',
      title: 'Evidence Verified (Agriculture)',
      message: 'Agricultural irrigation or crop health evidence registered.',
      reason: 'Agriculture & smallholder farming evidence verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('water') || lowerName.includes('fluoride') || lowerName.includes('arsenic') || lowerName.includes('pipe') || lowerName.includes('borewell')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'water',
      suggestedCategoryKey: 'water',
      title: 'Evidence Verified (Water Resources)',
      message: 'Drinking water quality or supply shortage evidence registered.',
      reason: 'Water resources documentation verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('waste') || lowerName.includes('garbage') || lowerName.includes('drain') || lowerName.includes('sanitat') || lowerName.includes('sewage')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'sanitation',
      suggestedCategoryKey: 'sanitation',
      title: 'Evidence Verified (Sanitation)',
      message: 'Sanitation or solid waste accumulation evidence registered.',
      reason: 'Sanitation & waste documentation verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('mine') || lowerName.includes('coal') || lowerName.includes('forest') || lowerName.includes('env') || lowerName.includes('pollut')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'environment',
      suggestedCategoryKey: 'environment',
      title: 'Evidence Verified (Environment)',
      message: 'Environmental degradation or mine reclamation evidence registered.',
      reason: 'Environmental documentation verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('solar') || lowerName.includes('energy') || lowerName.includes('power') || lowerName.includes('electric') || lowerName.includes('light')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'energy',
      suggestedCategoryKey: 'energy',
      title: 'Evidence Verified (Energy)',
      message: 'Rural energy access or renewable micro-grid evidence registered.',
      reason: 'Energy infrastructure documentation verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('pothole') || lowerName.includes('road') || lowerName.includes('culvert') || lowerName.includes('bridge') || lowerName.includes('asphalt')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'urban_infra',
      suggestedCategoryKey: 'urban_infra',
      title: 'Evidence Verified (Infrastructure)',
      message: 'Road damage or culvert infrastructure evidence registered.',
      reason: 'Civil infrastructure damage verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('access') || lowerName.includes('wheelchair') || lowerName.includes('ramp') || lowerName.includes('disabled')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'accessibility',
      suggestedCategoryKey: 'accessibility',
      title: 'Evidence Verified (Accessibility)',
      message: 'Public accessibility barrier evidence registered.',
      reason: 'Accessibility barrier verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }
  if (lowerName.includes('lac') || lowerName.includes('tribal') || lowerName.includes('artisan') || lowerName.includes('craft') || lowerName.includes('livelihood')) {
    return {
      status: 'valid',
      detectedCategoryKey: 'rural_livelihoods',
      suggestedCategoryKey: 'rural_livelihoods',
      title: 'Evidence Verified (Rural Livelihoods)',
      message: 'Tribal livelihood or Minor Forest Produce evidence registered.',
      reason: 'Tribal rural livelihood documentation verified.',
      canProceed: true,
      requiresManualCategory: false
    };
  }

  // 5. Default: Valid evidence with uncertain classification -> prompt to select domain
  // Falls back to other / unknown (NEVER defaults to pothole!)
  return {
    status: 'uncertain',
    detectedCategoryKey: 'other',
    suggestedCategoryKey: 'other',
    title: "Category could not be confidently determined.",
    message: 'Please select the societal challenge domain to load appropriate impact assessment questions and extract required expertise.',
    reason: 'Domain classification uncertain from image metadata. Please select domain.',
    canProceed: true,
    requiresManualCategory: true
  };
}
