'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSahYog } from '@/store/useSahYog';
import {
  CATEGORIES,
  WORKFLOW_STEPS,
  STAGES,
  GOOGLE_MAPS_API_KEY,
  DEMO_LOCATION,
  SUBCATEGORY,
  AUTHORITY,
  JHARKHAND_DISTRICTS
} from '@/lib/constants';
import {
  CHALLENGE_ASSESSMENT_BY_DOMAIN,
  calculateDomainImpactSeverity,
  generateDomainPrefilledDetails,
  validateEvidenceFile,
  resolveDomainKey,
  getStandardDomainName,
  SOCIETAL_DOMAINS,
  extractRequiredExpertise,
  type SocietalDomainKey,
  type ImageValidationResult
} from '@/lib/impactQuestions';
import { classify } from '@/lib/classifier';
import type { Photo, LocationSource, Problem } from '@/lib/types';
import { toast } from '@/components/ToastStack';
import exifr from 'exifr';

declare global {
  interface Window {
    google: any;
    initSahYogGoogleMap?: () => void;
    wfLocationConfirmed?: boolean;
  }
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function ReportWorkflowModal() {
  const { state, dispatch, submitProblem } = useSahYog();
  const { wfOpen, problems } = state;

  // 5-Stage Guided Workflow
  // Step 1: Capture / Upload Field Evidence
  // Step 2: Location in Jharkhand (District, Block, Coordinates) & Duplicate Detection
  // Step 3: Domain-Aware Impact Assessment
  // Step 4: Required Expertise Extraction & Challenge Details
  // Step 5: Final Review & Submit to Jharkhand HEI Pipeline
  const [step, setStep] = useState(1);

  // Evidence state
  const [files, setFiles] = useState<Photo[]>([]);
  const [validationResult, setValidationResult] = useState<ImageValidationResult | null>(null);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Domain state (13 Societal Innovation Domains)
  const [selectedDomainKey, setSelectedDomainKey] = useState<SocietalDomainKey>('other');
  const [isChangingDomain, setIsChangingDomain] = useState(false);

  // Location state (Jharkhand focused)
  const [stateName] = useState('Jharkhand');
  const [district, setDistrict] = useState<string>('Ranchi');
  const [block, setBlock] = useState<string>('');
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  const [locationSource, setLocationSource] = useState<LocationSource | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState('');
  const [exifFound, setExifFound] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [mapStatus, setMapStatus] = useState('');
  const [mapStatusType, setMapStatusType] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [landmark, setLandmark] = useState('');

  // Domain-Aware Impact Assessment state
  const [q1OptionId, setQ1OptionId] = useState<string>('');
  const [q2OptionId, setQ2OptionId] = useState<string>('');
  const [contextOptionIds, setContextOptionIds] = useState<string[]>([]);
  const [customSeverity, setCustomSeverity] = useState<string>('');
  const [isCustomizingSeverity, setIsCustomizingSeverity] = useState(false);

  // Challenge Details & Multidisciplinary Extraction state
  const [detectedProblem, setDetectedProblem] = useState('Water Quality & Purification Deficit');
  const [category, setCategory] = useState('Water Resource Management');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [affectedPopulation, setAffectedPopulation] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [requiredExpertise, setRequiredExpertise] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [contact, setContact] = useState('');
  const [aiResult, setAiResult] = useState<Record<string, string> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Submission state
  const [createdId, setCreatedId] = useState('');
  const [createdCat, setCreatedCat] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const wfMapRef = useRef<any>(null);
  const wfMarkerRef = useRef<any>(null);
  const wfGeocoderRef = useRef<any>(null);

  // Dynamic impact calculation using selected domain config
  const impactResult = useMemo(() => {
    return calculateDomainImpactSeverity({
      domainKey: selectedDomainKey,
      q1OptionId,
      q2OptionId,
      contextOptionIds
    });
  }, [selectedDomainKey, q1OptionId, q2OptionId, contextOptionIds]);

  const activeSeverity = isCustomizingSeverity && customSeverity ? customSeverity : impactResult.suggestedSeverity;
  const activePriority = impactResult.suggestedPriority;

  // Domain change handler
  function handleDomainChange(newKey: SocietalDomainKey) {
    setSelectedDomainKey(newKey);
    const standardName = getStandardDomainName(newKey);
    setCategory(standardName);
    const cfg = CHALLENGE_ASSESSMENT_BY_DOMAIN[newKey];
    if (cfg) {
      setDetectedProblem(cfg.categoryLabel || cfg.detectedProblemDefault);
    }
    setQ1OptionId('');
    setQ2OptionId('');
    setContextOptionIds([]);
    setCustomSeverity('');
    setIsCustomizingSeverity(false);
    
    // Auto-update multidisciplinary expertise based on new domain
    const extracted = extractRequiredExpertise(newKey, title, desc);
    setRequiredExpertise(extracted);

    toast(`Switched to domain: ${standardName}`, 'info');
  }

  // Duplicate / Similar Challenge Detection in same district or <10km proximity
  const duplicateNotice = useMemo(() => {
    if (!problems || problems.length === 0) return null;
    const currentLat = Number(lat);
    const currentLng = Number(lng);

    // 1. Proximity match if GPS is known (<2km)
    if (currentLat && currentLng) {
      for (const p of problems) {
        if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
          const d = getDistanceMeters(currentLat, currentLng, p.latitude, p.longitude);
          if (d <= 2500) {
            return {
              problem: p,
              reason: `Existing challenge located ~${Math.round(d)} meters away in ${p.district || p.location}`,
              isSameDomain: p.domain === category || p.category === category
            };
          }
        }
      }
    }

    // 2. District & Domain match
    if (district) {
      const match = problems.find(p => 
        (p.district?.toLowerCase() === district.toLowerCase()) && 
        (p.domain === category || p.category === category)
      );
      if (match) {
        return {
          problem: match,
          reason: `Active ${category} challenge already recorded in ${district} District: "${match.title}"`,
          isSameDomain: true
        };
      }
    }

    return null;
  }, [lat, lng, district, category, problems]);

  // Reset state on modal open
  useEffect(() => {
    if (wfOpen) {
      setStep(1);
      setFiles([]);
      setIsCameraActive(false);
      setCameraError('');
      setLocationConfirmed(false);
      setLat('');
      setLng('');
      setAddress('');
      setDistrict('Ranchi');
      setBlock('');
      setMapStatus('');
      setMapStatusType('');
      setLocationSource(null);
      setLocationAccuracy('');
      setExifFound(false);
      setIsDetectingGps(false);
      setAiResult(null);
      setTitle('');
      setDesc('');
      setSelectedDomainKey('other');
      setIsChangingDomain(false);
      setCategory('Other');
      setDetectedProblem('Unclassified Societal Challenge');
      setValidationResult(null);
      setIsValidatingImage(false);
      setLandmark('');
      setContact('');
      setLocationSearch('');
      setIsSubmitting(false);
      setSubmitError(null);
      setQ1OptionId('');
      setQ2OptionId('');
      setContextOptionIds([]);
      setCustomSeverity('');
      setIsCustomizingSeverity(false);
      setIsEditingTitle(false);
      setIsEditingDesc(false);
      setAffectedPopulation('');
      setExpectedOutcome('');
      setRequiredExpertise(['Environmental Engineering', 'Chemical Engineering', 'Community Medicine', 'Rural Development']);
    }
    return () => {
      stopCamera();
    };
  }, [wfOpen]);

  // Camera cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Map init on Step 2
  useEffect(() => {
    if (step !== 2 || !wfOpen) return;
    const tryInit = () => {
      if (window.google?.maps && mapRef.current && !wfMapRef.current) initMap();
      else if (!window.google && GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') loadMapsScript();
      else {
        setMapStatus('Interactive map view ready. Select point or choose Jharkhand district from the dropdown.');
        setMapStatusType('info');
      }
    };
    setTimeout(tryInit, 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, wfOpen]);

  // Auto-fill suggestions on step 4
  useEffect(() => {
    if (step === 4) {
      const locStr = `${block ? block + ', ' : ''}${district}, Jharkhand`;
      const { suggestedTitle, suggestedDescription, expectedOutcome: generatedOutcome } = generateDomainPrefilledDetails({
        domainKey: selectedDomainKey,
        q1OptionId,
        q2OptionId,
        contextOptionIds,
        locationAddress: address || locStr,
        landmark,
        district
      });

      if (!title) setTitle(suggestedTitle);
      if (!desc) setDesc(suggestedDescription);
      if (!expectedOutcome) setExpectedOutcome(generatedOutcome);

      // Auto-extract required expertise
      const extracted = extractRequiredExpertise(selectedDomainKey, suggestedTitle, suggestedDescription);
      setRequiredExpertise(extracted);

      const q1Label = CHALLENGE_ASSESSMENT_BY_DOMAIN[selectedDomainKey]?.question1.options.find(o => o.id === q1OptionId)?.label;
      if (!affectedPopulation && q1Label) {
        setAffectedPopulation(q1Label);
      }

      runAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleRegenerateDetails() {
    const locStr = `${block ? block + ', ' : ''}${district}, Jharkhand`;
    const { suggestedTitle, suggestedDescription, expectedOutcome: generatedOutcome } = generateDomainPrefilledDetails({
      domainKey: selectedDomainKey,
      q1OptionId,
      q2OptionId,
      contextOptionIds,
      locationAddress: address || locStr,
      landmark,
      district
    });
    setTitle(suggestedTitle);
    setDesc(suggestedDescription);
    setExpectedOutcome(generatedOutcome);
    const extracted = extractRequiredExpertise(selectedDomainKey, suggestedTitle, suggestedDescription);
    setRequiredExpertise(extracted);
    toast('Regenerated challenge details from impact factors.', 'info');
  }

  // Upload helper
  async function uploadPhotoToServer(fileOrDataUrl: File | string, name?: string): Promise<string> {
    try {
      if (typeof fileOrDataUrl === 'string') {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: fileOrDataUrl,
            name,
            bucket: 'problem-evidence'
          })
        });
        const json = await res.json();
        if (res.ok && json.success && json.url) return json.url;
      } else {
        const fd = new FormData();
        fd.append('file', fileOrDataUrl);
        fd.append('bucket', 'problem-evidence');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (res.ok && json.success && json.url) return json.url;
      }
    } catch {
      // offline/fallback
    }
    return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : URL.createObjectURL(fileOrDataUrl);
  }

  // Camera handling
  async function startCamera() {
    setCameraError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Direct camera streaming not supported by this browser. Please use photo upload.');
        toast('Camera not supported by browser. Please use photo upload.', 'error');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      setCameraError('Camera access denied or no camera device connected.');
      toast('Camera permission denied or camera unavailable. Please upload photo.', 'error');
      setIsCameraActive(false);
    }
  }

  function stopCamera() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  }

  async function captureSnapshot() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();

      setIsValidatingImage(true);
      const validation = await validateEvidenceFile(dataUrl, `camera_snapshot_${Date.now()}.jpg`);
      setValidationResult(validation);
      setIsValidatingImage(false);

      if (validation.suggestedCategoryKey) {
        const dKey = resolveDomainKey(validation.suggestedCategoryKey);
        setSelectedDomainKey(dKey);
        setCategory(getStandardDomainName(dKey));
        const cfg = CHALLENGE_ASSESSMENT_BY_DOMAIN[dKey];
        if (cfg) setDetectedProblem(cfg.categoryLabel || cfg.detectedProblemDefault);
      }

      const permanentUrl = await uploadPhotoToServer(dataUrl, `field_photo_${Date.now()}.jpg`);
      setFiles([
        {
          src: permanentUrl,
          isVideo: false,
          name: `field_snapshot_${Date.now()}.jpg`,
          exifGpsFound: false
        }
      ]);

      toast('📸 Field photo captured and registered.', 'success');
      autoDetectLocation();
    }
  }

  // File upload handler
  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = e.target.files;
    if (!fl || fl.length === 0) return;
    stopCamera();
    const newFiles: Photo[] = [];
    let photoGpsFound = false;

    setIsValidatingImage(true);
    for (const f of Array.from(fl)) {
      if (f.size > 10 * 1024 * 1024) {
        toast(`${f.name} is larger than 10MB.`, 'error');
        continue;
      }
      if (!/^image\/(jpeg|png|webp)$|^video\/(mp4|webm)$/.test(f.type)) {
        toast(`Unsupported file type: ${f.name}`, 'error');
        continue;
      }

      const validation = await validateEvidenceFile(f, f.name);
      setValidationResult(validation);

      if (validation.suggestedCategoryKey) {
        const dKey = resolveDomainKey(validation.suggestedCategoryKey);
        setSelectedDomainKey(dKey);
        setCategory(getStandardDomainName(dKey));
        const cfg = CHALLENGE_ASSESSMENT_BY_DOMAIN[dKey];
        if (cfg) setDetectedProblem(cfg.categoryLabel || cfg.detectedProblemDefault);
      }

      let hasExif = false;
      if (f.type.startsWith('image/')) {
        try {
          const gps = await exifr.gps(f);
          if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
            hasExif = true;
            photoGpsFound = true;
            setLat(String(gps.latitude));
            setLng(String(gps.longitude));
            setLocationSource('PHOTO_EXIF');
            setLocationAccuracy('Photo EXIF GPS (~5-15m)');
            setExifFound(true);
            setAddress(`EXIF Location: ${gps.latitude.toFixed(5)}° N, ${gps.longitude.toFixed(5)}° E`);
            setLocationConfirmed(true);
          }
        } catch {
          // EXIF reading failed or absent
        }
      }

      const permanentUrl = await uploadPhotoToServer(f);
      newFiles.push({ src: permanentUrl, isVideo: f.type.startsWith('video/'), name: f.name, exifGpsFound: hasExif });
    }
    setIsValidatingImage(false);

    if (photoGpsFound) {
      toast('✓ GPS coordinates extracted from photo metadata', 'success');
    } else {
      autoDetectLocation();
    }

    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setValidationResult(null);
  }

  // Load SIH Demo Benchmark Case (Jharkhand specific)
  function loadDemoBenchmarkCase() {
    stopCamera();
    const benchmarkSrc = '/demo/pothole_before.jpg';
    setFiles([
      {
        src: benchmarkSrc,
        isVideo: false,
        name: 'jharkhand_kanke_irrigation_benchmark.jpg',
        exifGpsFound: true
      }
    ]);
    setValidationResult({
      status: 'valid',
      title: 'Field Observation Verified',
      message: 'Verified Birsa Agricultural University, Kanke farm irrigation benchmark case.',
      reason: 'Verified agricultural water deficit documentation in Kanke, Ranchi.',
      suggestedCategoryKey: 'agriculture',
      detectedCategoryKey: 'agriculture',
      detectedKeywords: ['irrigation', 'water', 'crop'],
      canProceed: true,
      requiresManualCategory: false
    });
    setSelectedDomainKey('agriculture');
    setCategory('Agriculture & Food Security');
    setDetectedProblem('Solar Micro-Irrigation Deficit in Smallholder Vegetable Clusters');
    setDistrict('Ranchi');
    setBlock('Kanke Block');
    setLat(String(DEMO_LOCATION.lat));
    setLng(String(DEMO_LOCATION.lng));
    setAddress(DEMO_LOCATION.address);
    setLandmark(DEMO_LOCATION.landmark);
    setLocationSource('DEMO_LOCATION');
    setLocationAccuracy('Pre-Calibrated Benchmark Coordinates (BAU Ranchi)');
    setExifFound(true);
    setLocationConfirmed(true);
    
    // Set benchmark impact
    setQ1OptionId('pan_village');
    setQ2OptionId('chronic_loss');
    setContextOptionIds(['tribal_majority', 'drought_prone']);
    setTitle('Solar-Powered Micro-Drip Irrigation for High-Value Off-Season Vegetable Cultivation');
    setDesc('Smallholder tribal farmers in Kanke vegetable belt experience severe dry-season crop mortality due to unreliable diesel pump access and falling water tables. A solar IoT micro-irrigation system with smart soil moisture sensing is needed to double winter yield.');
    setAffectedPopulation('480 smallholder tribal farming households across 4 panchayats');
    setExpectedOutcome('Standardized solar-powered drip system (<₹45,000 per unit) reducing water consumption by 45% and boosting winter vegetable harvest.');
    setRequiredExpertise(['Agricultural Engineering', 'IoT & Embedded Systems', 'Renewable Energy', 'Soil Science & Agronomy']);
    
    toast('🎯 Loaded SIH 2026 Jharkhand Benchmark Case (Kanke, Ranchi)', 'success');
  }

  // Automatic Location Detection
  function autoDetectLocation() {
    if (!navigator.geolocation) {
      setMapStatus('Location could not be detected automatically. Device GPS is not supported.');
      setMapStatusType('error');
      return;
    }

    setIsDetectingGps(true);
    setMapStatus('Detecting location via device GPS...');
    setMapStatusType('info');

    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsDetectingGps(false);
        setLocationSource('DEVICE_GPS');
        setLocationAccuracy(`Device GPS API (±${Math.round(pos.coords.accuracy || 10)}m)`);
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        const detectedAddr = `Current Location: ${pos.coords.latitude.toFixed(5)}° N, ${pos.coords.longitude.toFixed(5)}° E`;
        setAddress(detectedAddr);
        setLocationConfirmed(true);
        setMapStatus('✓ Location detected from device GPS');
        setMapStatusType('success');
        if (wfMapRef.current) placeMarker(pos.coords.latitude, pos.coords.longitude, true);
      },
      () => {
        setIsDetectingGps(false);
        setMapStatus('GPS permission denied or unavailable. Please select your district and block from the list.');
        setMapStatusType('error');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  // Google Maps scripts
  function loadMapsScript() {
    if (document.getElementById('gmap-script')) return;
    window.initSahYogGoogleMap = initMap;
    const s = document.createElement('script');
    s.id = 'gmap-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&callback=initSahYogGoogleMap`;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      setMapStatus('Interactive map view unavailable. District and block selection active.');
      setMapStatusType('error');
    };
    document.head.appendChild(s);
  }

  function initMap() {
    if (!mapRef.current || wfMapRef.current) return;
    try {
      wfGeocoderRef.current = new window.google.maps.Geocoder();
      const initialCenter =
        lat && lng
          ? { lat: Number(lat), lng: Number(lng) }
          : { lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng }; // Ranchi center
      wfMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy',
        mapTypeId: 'roadmap'
      });
      wfMapRef.current.addListener('click', (e: any) => {
        setLocationSource('MAP_SELECTED');
        setLocationAccuracy('Interactive Map Pin (~5m)');
        placeMarker(e.latLng.lat(), e.latLng.lng(), true);
      });
      if (lat && lng) {
        placeMarker(Number(lat), Number(lng), false);
      }
    } catch {
      setMapStatus('Google Maps could not be initialized.');
      setMapStatusType('error');
    }
  }

  async function placeMarker(la: number, ln: number, doGeocode: boolean) {
    if (!wfMapRef.current) return;
    const pos = { lat: Number(la), lng: Number(ln) };
    wfMapRef.current.setCenter(pos);
    wfMapRef.current.setZoom(15);
    if (wfMarkerRef.current) wfMarkerRef.current.setMap(null);
    wfMarkerRef.current = new window.google.maps.Marker({
      position: pos,
      map: wfMapRef.current,
      title: 'Jharkhand Challenge Location'
    });
    let addr = address || `${district}, Jharkhand`;
    if (doGeocode && wfGeocoderRef.current) {
      try {
        const results = await new Promise<any>((res, rej) =>
          wfGeocoderRef.current.geocode({ location: pos }, (r: any, s: string) =>
            s === 'OK' && r?.[0] ? res(r) : rej()
          )
        );
        addr = results[0].formatted_address;
      } catch {
        addr = `Coordinates: ${pos.lat.toFixed(5)}° N, ${pos.lng.toFixed(5)}° E`;
      }
    }
    setLat(String(pos.lat));
    setLng(String(pos.lng));
    setAddress(addr);
    setLocationConfirmed(true);
    setMapStatus('Location confirmed from map pin.');
    setMapStatusType('success');
  }

  // Classification & matching check
  async function runAI() {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || detectedProblem, desc, category })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const c = json.data;
          setAiResult({
            'Societal Domain': c.category || category,
            'Challenge Severity': activeSeverity,
            'Innovation Priority': activePriority,
            'Mandated Department': c.authority || AUTHORITY[category] || 'Govt. of Jharkhand Department of Planning & Development',
            'Recommended Collaboration': 'Multidisciplinary Student-Faculty Squad + Industry/CSR Partner',
            'Required Expertise': requiredExpertise.join(', ') || 'Multidisciplinary Engineering & Social Science'
          });
          setAiLoading(false);
          return;
        }
      }
    } catch {
      // Local fallback
    }

    const a = classify(title || detectedProblem, desc, category);
    setAiResult({
      'Societal Domain': a.category || category,
      'Challenge Severity': activeSeverity,
      'Innovation Priority': activePriority,
      'Mandated Department': a.authority || AUTHORITY[category] || 'Govt. of Jharkhand',
      'Recommended Collaboration': 'Higher Education Institution (HEI) Squad Matching'
    });
    setAiLoading(false);
  }

  // Add / remove required skills
  function handleAddSkill() {
    if (!newSkillInput.trim()) return;
    const skill = newSkillInput.trim();
    if (!requiredExpertise.includes(skill)) {
      setRequiredExpertise([...requiredExpertise, skill]);
    }
    setNewSkillInput('');
  }

  function handleRemoveSkill(skillToRemove: string) {
    setRequiredExpertise(requiredExpertise.filter(s => s !== skillToRemove));
  }

  // Authoritative Backend Submission
  async function createProblem(): Promise<boolean> {
    setIsSubmitting(true);
    setSubmitError(null);
    const finalLat = lat ? Number(lat) : DEMO_LOCATION.lat;
    const finalLng = lng ? Number(lng) : DEMO_LOCATION.lng;
    const finalAddress = `${block ? block + ', ' : ''}${district}, Jharkhand`;

    const currentConfig = CHALLENGE_ASSESSMENT_BY_DOMAIN[selectedDomainKey];
    const q1Label = currentConfig?.question1.options.find(o => o.id === q1OptionId)?.label;

    const res = await submitProblem({
      title: title || `${activeSeverity} ${detectedProblem}`,
      desc: desc || 'Societal challenge submitted for collaborative university R&D.',
      category,
      domain: category,
      subdomain: SUBCATEGORY[category] || 'Societal Innovation',
      state: 'Jharkhand',
      district: district || 'Ranchi',
      block: block || '',
      affected_population: affectedPopulation || q1Label || 'Rural and urban communities across Jharkhand',
      expected_outcome: expectedOutcome || 'Field-validated prototype addressing core operational bottlenecks',
      required_expertise: requiredExpertise,
      severity: activeSeverity,
      priority: activePriority,
      location: address || finalAddress,
      landmark,
      contact,
      datetime: new Date().toISOString(),
      affected: affectedPopulation || q1Label || 'Community members across Jharkhand',
      latitude: finalLat,
      longitude: finalLng,
      location_source: locationSource || 'MANUAL_ENTRY',
      location_accuracy: locationAccuracy || 'User specified',
      photos: files.slice(),
      factors: {
        categoryKey: selectedDomainKey,
        domain: category,
        subdomain: SUBCATEGORY[category] || '',
        state: 'Jharkhand',
        district,
        block,
        affectedPopulation,
        expectedOutcome,
        requiredExpertise,
        q1OptionId,
        q2OptionId,
        contextOptionIds,
        contributingFactors: impactResult.factors,
        explanation: impactResult.explanation,
        suggestedSeverity: impactResult.suggestedSeverity,
        finalSeverity: activeSeverity,
        responsePriority: activePriority
      }
    });

    setIsSubmitting(false);

    if (!res.success || !res.data) {
      const err = res.error || 'Failed to register challenge in persistent datastore.';
      setSubmitError(err);
      toast(err, 'error');
      return false;
    }

    setCreatedId(res.data.id);
    setCreatedCat(res.data.category);
    toast(`Societal Challenge ${res.data.id} published to Jharkhand HEI Pipeline!`, 'success');
    return true;
  }

  // Step navigation
  function goNext() {
    if (step === 1) {
      if (files.length === 0) {
        toast('Please attach at least one field photo or document.', 'error');
        return;
      }
      stopCamera();
      if (!lat || !lng) {
        autoDetectLocation();
      }
      setStep(2);
    } else if (step === 2) {
      if (!district) {
        toast('Please select a Jharkhand district.', 'error');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      if (!title) {
        toast('Please provide a challenge title.', 'error');
        return;
      }
      setStep(5);
    } else if (step === 5) {
      createProblem();
    }
  }

  function handleViewExisting(problemId: string) {
    stopCamera();
    dispatch({ type: 'CLOSE_WORKFLOW' });
    dispatch({ type: 'OPEN_DETAIL', id: problemId, from: 'home' });
    toast(`Viewing existing challenge ${problemId}.`, 'info');
  }

  const nextLabel =
    step === 1
      ? 'Continue to Location (Jharkhand)'
      : step === 2
      ? 'Continue to Impact Assessment'
      : step === 3
      ? 'Extract Required Expertise & Details'
      : step === 4
      ? 'Review Challenge Proposal'
      : createdId
      ? 'View Challenge in HEI Workspace'
      : 'Submit to Jharkhand Innovation Pipeline';

  if (!wfOpen) return null;

  return (
    <div className="overlay workflow-overlay show" aria-hidden="false">
      <div className="modal" role="dialog" aria-modal={true} aria-labelledby="wfTitle" style={{ maxWidth: 880 }}>
        <div className="workflow-shell">
          {/* Header */}
          <div className="wf-head">
            <div className="modal-head" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src="/logo-mark.png"
                  alt="SahYog Emblem"
                  style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="proto-tag" style={{ background: '#0e3860', color: '#fff', fontSize: 10 }}>
                      GOVT. OF JHARKHAND · SIH 2026
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Official Problem Statement SIH26043</span>
                  </div>
                  <div className="wf-title" id="wfTitle" style={{ fontSize: 20, fontWeight: 900 }}>
                    Submit a Societal Challenge
                  </div>
                  <div className="wf-sub">
                    Crowdsourced Grassroots Problems → University &amp; Industry Collaborative Solutions
                  </div>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => {
                  stopCamera();
                  dispatch({ type: 'CLOSE_WORKFLOW' });
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Workflow Steps Indicator */}
          <div className="wf-steps">
            {WORKFLOW_STEPS.map((s, i) => (
              <div
                key={s}
                className={`wf-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}
              >
                <span className="num">{step > i + 1 ? '✓' : i + 1}</span>
                {s}
              </div>
            ))}
          </div>

          {/* Workflow Body */}
          <div className="wf-body">
            {/* STEP 1: FIELD EVIDENCE & DOMAIN SELECTION */}
            <div className={`wf-pane ${step === 1 ? 'active' : ''}`}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                  1. Field Evidence &amp; Observation
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Attach photographic or video proof of the societal bottleneck (e.g. arsenic testing kit, dry irrigation canal, unstaffed health subcentre, polluted mine run-off).
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13.5 }}
                  onClick={() => {
                    if (isCameraActive) captureSnapshot();
                    else startCamera();
                  }}
                  disabled={isValidatingImage}
                >
                  {isCameraActive ? '📸 Capture Field Photo' : '📷 Live Field Camera'}
                </button>

                <label
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    fontSize: 13.5,
                    cursor: 'pointer',
                    margin: 0,
                    opacity: isValidatingImage ? 0.6 : 1
                  }}
                >
                  <span>📁 Upload Image / Document</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4"
                    capture="environment"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileInput}
                    disabled={isValidatingImage}
                  />
                </label>
              </div>

              {/* WebRTC Live Camera */}
              {isCameraActive && (
                <div className="camera-container" style={{ marginBottom: 16 }}>
                  <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="camera-controls">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={captureSnapshot}
                    >
                      📸 Capture
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={stopCamera}
                    >
                      ✕ Cancel Camera
                    </button>
                  </div>
                </div>
              )}

              {/* Attached Evidence Preview */}
              {files.length > 0 && (
                <div style={{ background: '#fbfcfe', border: '1px solid var(--line)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <b style={{ fontSize: 13 }}>Evidence Documents ({files.length})</b>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setFiles([]);
                        setValidationResult(null);
                        startCamera();
                      }}
                    >
                      🔄 Retake / Change
                    </button>
                  </div>

                  <div className="wf-preview" style={{ marginTop: 0 }}>
                    {files.map((f, i) => (
                      <div className="wf-thumb" key={i}>
                        {f.isVideo ? <video src={f.src} muted /> : <img src={f.src} alt={`Evidence ${i + 1}`} />}
                        <button onClick={() => removeFile(i)} aria-label="Remove">×</button>
                        {f.exifGpsFound && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 2,
                              left: 2,
                              right: 2,
                              background: 'rgba(23, 138, 86, 0.9)',
                              color: '#fff',
                              fontSize: 9,
                              padding: '2px 4px',
                              borderRadius: 3,
                              textAlign: 'center'
                            }}
                          >
                            📍 GPS Extracted
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Societal Innovation Domain Selector (13 Domains) */}
              <div style={{ marginTop: 18, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>Select Societal Domain (13 Core Domains)</b>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                      Determines matching Higher Education Institution (HEI) departments and industry partners.
                    </div>
                  </div>
                  <span className="proto-tag" style={{ background: '#e0edff', color: 'var(--blue)' }}>
                    Active: {category}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
                  {SOCIETAL_DOMAINS.map(dom => (
                    <button
                      key={dom.key}
                      type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: selectedDomainKey === dom.key ? '2px solid var(--blue)' : '1px solid var(--line)',
                        background: selectedDomainKey === dom.key ? '#eef5fc' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: selectedDomainKey === dom.key ? 700 : 500,
                        color: selectedDomainKey === dom.key ? 'var(--blue)' : 'var(--ink)'
                      }}
                      onClick={() => handleDomainChange(dom.key)}
                    >
                      <span style={{ fontSize: 16 }}>{dom.icon}</span>
                      <span>{dom.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SIH Benchmark Drawer */}
              <div
                style={{
                  padding: '12px 14px',
                  background: '#f1f6fb',
                  border: '1px dashed #b7cde3',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 16
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="demo-tag">SIH 2026 DEMO BENCHMARK</span>
                    <b style={{ fontSize: 12.5, color: 'var(--blue)' }}>Jharkhand Agriculture &amp; Water Case</b>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                    Pre-fills Birsa Agricultural University, Kanke solar micro-irrigation deficit case study.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={loadDemoBenchmarkCase}
                >
                  🎯 Load Benchmark Case
                </button>
              </div>
            </div>

            {/* STEP 2: LOCATION IN JHARKHAND & DUPLICATE CHECK */}
            <div className={`wf-pane ${step === 2 ? 'active' : ''}`}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                  2. Location in Jharkhand (24 Districts)
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Pinpoint the administrative geography in Jharkhand. Automatically matches proximity with regional engineering colleges and polytechnics.
                </p>
              </div>

              {/* Duplicate Notice */}
              {duplicateNotice && (
                <div className="duplicate-alert-banner">
                  <div className="duplicate-alert-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⚠️</span>
                      <b>Similar Challenge Recorded in {district}</b>
                    </div>
                    <span className="proto-tag" style={{ background: '#f5c878', color: '#593900' }}>
                      Ecosystem Alert
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#593900', marginTop: 4 }}>
                    {duplicateNotice.reason}
                    <div style={{ marginTop: 4 }}>
                      <b>Title:</b> {duplicateNotice.problem.title} · Stage: <b>{STAGES[duplicateNotice.problem.stage] || 'Stage 1'}</b>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleViewExisting(duplicateNotice.problem.id)}
                    >
                      👁 View Existing Challenge #{duplicateNotice.problem.id}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => toast('Proceeding with separate local documentation.', 'info')}
                    >
                      Continue with Distinct Submission
                    </button>
                  </div>
                </div>
              )}

              {/* Jharkhand District & Block Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 700 }}>State *</label>
                  <input
                    type="text"
                    value={stateName}
                    readOnly
                    style={{ background: '#f8fafc', fontWeight: 600 }}
                  />
                </div>

                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 700 }}>Jharkhand District *</label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    {JHARKHAND_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d} District</option>
                    ))}
                  </select>
                </div>

                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 700 }}>Block / Panchayat / Ward</label>
                  <input
                    type="text"
                    placeholder="e.g. Kanke Block, Patratu, Sonari, etc."
                    value={block}
                    onChange={e => setBlock(e.target.value)}
                  />
                </div>
              </div>

              {/* Coordinates & Location Source */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8
                }}
              >
                <div style={{ fontSize: 12.5 }}>
                  <span style={{ color: 'var(--muted)' }}>GPS Registration: </span>
                  {lat && lng ? (
                    <b style={{ color: 'var(--blue)' }}>
                      📍 {Number(lat).toFixed(4)}° N, {Number(lng).toFixed(4)}° E ({locationSource || 'Mapped'})
                    </b>
                  ) : (
                    <span style={{ color: '#8f5a00' }}>Click map or retry device GPS</span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={autoDetectLocation}
                  disabled={isDetectingGps}
                >
                  {isDetectingGps ? 'Detecting GPS…' : '📡 Auto-Detect GPS'}
                </button>
              </div>

              {/* Map */}
              <div className="sahyog-google-map" id="wf-map" ref={mapRef} role="application" aria-label="Google Map" />

              {mapStatus && <div className={`map-status ${mapStatusType}`} style={{ marginTop: 8 }}>{mapStatus}</div>}
            </div>

            {/* STEP 3: DOMAIN-AWARE IMPACT ASSESSMENT */}
            <div className={`wf-pane ${step === 3 ? 'active' : ''}`}>
              {(() => {
                const currentConfig = CHALLENGE_ASSESSMENT_BY_DOMAIN[selectedDomainKey] || CHALLENGE_ASSESSMENT_BY_DOMAIN['water'];
                return (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                            3. Objective Severity &amp; Priority Evaluation
                          </h3>
                          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                            Domain criteria for <b>{category}</b> calculate problem urgency and funding match score.
                          </p>
                        </div>
                        <span className="proto-tag">Government Scoring Rubric</span>
                      </div>
                    </div>

                    {/* Question 1: Scale */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 8 }}>
                        {currentConfig.question1.title}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                        {currentConfig.question1.options.map(opt => (
                          <div
                            key={opt.id}
                            className={`impact-option-card ${q1OptionId === opt.id ? 'selected' : ''}`}
                            onClick={() => setQ1OptionId(opt.id)}
                          >
                            <input
                              type="radio"
                              name="domain_q1"
                              checked={q1OptionId === opt.id}
                              onChange={() => setQ1OptionId(opt.id)}
                            />
                            <span style={{ fontSize: 12.5, fontWeight: q1OptionId === opt.id ? 700 : 500 }}>
                              {opt.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Question 2: Severity */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 8 }}>
                        {currentConfig.question2.title}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                        {currentConfig.question2.options.map(opt => (
                          <div
                            key={opt.id}
                            className={`impact-option-card ${q2OptionId === opt.id ? 'selected' : ''}`}
                            onClick={() => setQ2OptionId(opt.id)}
                          >
                            <input
                              type="radio"
                              name="domain_q2"
                              checked={q2OptionId === opt.id}
                              onChange={() => setQ2OptionId(opt.id)}
                            />
                            <span style={{ fontSize: 12.5, fontWeight: q2OptionId === opt.id ? 700 : 500 }}>
                              {opt.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Question 3: Vulnerability & Sensitive Factors */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 8 }}>
                        {currentConfig.question3.title}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                        {currentConfig.question3.options.map(opt => {
                          const isChecked = contextOptionIds.includes(opt.id);
                          return (
                            <div
                              key={opt.id}
                              className={`impact-option-card ${isChecked ? 'selected' : ''}`}
                              onClick={() => {
                                setContextOptionIds(prev =>
                                  isChecked ? prev.filter(x => x !== opt.id) : [...prev, opt.id]
                                );
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                              />
                              <span style={{ fontSize: 12.5, fontWeight: isChecked ? 700 : 500 }}>
                                {opt.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Assessment Card */}
                    <div style={{ background: '#f7fbff', border: '1px solid #cfe0f1', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <b style={{ fontSize: 14, color: 'var(--blue)' }}>Evaluated Challenge Urgency</b>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                            Computed for Government of Jharkhand Innovation Prioritization
                          </div>
                        </div>
                        <span className="proto-tag">Prioritization Model</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: 10 }}>
                          <small style={{ color: 'var(--muted)', fontSize: 10, textTransform: 'uppercase' }}>
                            Calculated Severity
                          </small>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <span className={`status-chip ${activeSeverity}`}>{activeSeverity}</span>
                            <button
                              type="button"
                              className="prefill-edit-toggle"
                              onClick={() => setIsCustomizingSeverity(!isCustomizingSeverity)}
                            >
                              {isCustomizingSeverity ? 'Use Calculated' : 'Adjust'}
                            </button>
                          </div>
                          {isCustomizingSeverity && (
                            <select
                              style={{ marginTop: 6, fontSize: 12 }}
                              value={customSeverity}
                              onChange={e => setCustomSeverity(e.target.value)}
                            >
                              <option value="">Select severity</option>
                              <option value="Low">Low</option>
                              <option value="Moderate">Moderate</option>
                              <option value="High">High</option>
                              <option value="Critical">Critical</option>
                            </select>
                          )}
                        </div>

                        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: 10 }}>
                          <small style={{ color: 'var(--muted)', fontSize: 10, textTransform: 'uppercase' }}>
                            R&amp;D Matching Priority
                          </small>
                          <div style={{ marginTop: 4 }}>
                            <span className={`status-chip ${activePriority}`}>{activePriority}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                            Elevated for tribal hamlets and acute operational voids.
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--ink)', background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--line)' }}>
                        {impactResult.explanation}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* STEP 4: REQUIRED EXPERTISE EXTRACTION & CHALLENGE DETAILS */}
            <div className={`wf-pane ${step === 4 ? 'active' : ''}`}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                  4. Required Multidisciplinary Expertise &amp; Details
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Identifies engineering, science, and social disciplines required for student-faculty squads.
                </p>
              </div>

              {/* Multidisciplinary Expertise Badges */}
              <div style={{ padding: 14, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <b style={{ fontSize: 13, color: 'var(--blue)' }}>Required Multidisciplinary Disciplines (Extracted)</b>
                  <span className="proto-tag">HEI Team Matching Tags</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {requiredExpertise.map(exp => (
                    <span
                      key={exp}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#e0edff',
                        color: 'var(--blue)',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {exp}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(exp)}
                        style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', padding: 0 }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Add specific discipline (e.g. Hydrogeology, Metallurgy, Drone Survey)"
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    style={{ fontSize: 12, padding: '6px 10px', margin: 0 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddSkill}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Title Field */}
              <div className="field" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ margin: 0, fontWeight: 700 }}>Societal Challenge Title *</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      className="prefill-edit-toggle"
                      onClick={handleRegenerateDetails}
                    >
                      🔄 Re-sync from Impact
                    </button>
                    <button
                      type="button"
                      className="prefill-edit-toggle"
                      onClick={() => setIsEditingTitle(!isEditingTitle)}
                    >
                      {isEditingTitle ? 'Done' : '✏️ Edit'}
                    </button>
                  </div>
                </div>
                {isEditingTitle ? (
                  <input
                    type="text"
                    maxLength={150}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                ) : (
                  <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
                    {title}
                  </div>
                )}
              </div>

              {/* Description Field */}
              <div className="field" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ margin: 0, fontWeight: 700 }}>Ground Reality &amp; Problem Description *</label>
                  <button
                    type="button"
                    className="prefill-edit-toggle"
                    onClick={() => setIsEditingDesc(!isEditingDesc)}
                  >
                    {isEditingDesc ? 'Done' : '✏️ Edit'}
                  </button>
                </div>
                {isEditingDesc ? (
                  <textarea
                    rows={4}
                    maxLength={1200}
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                  />
                ) : (
                  <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, lineHeight: 1.5, color: 'var(--ink)' }}>
                    {desc}
                  </div>
                )}
              </div>

              {/* Affected Population & Expected Outcome */}
              <div className="wf-grid" style={{ marginBottom: 14 }}>
                <div className="field">
                  <label style={{ fontWeight: 700 }}>Target Population / Beneficiaries</label>
                  <input
                    type="text"
                    placeholder="e.g. 4,200 tribal farmers across 3 panchayats"
                    value={affectedPopulation}
                    onChange={e => setAffectedPopulation(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label style={{ fontWeight: 700 }}>Target Prototype Outcome / Specs</label>
                  <input
                    type="text"
                    placeholder="e.g. Gravity-fed filtration (<1.0mg/L fluoride, <₹15,000 unit cost)"
                    value={expectedOutcome}
                    onChange={e => setExpectedOutcome(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* STEP 5: FINAL REVIEW & SUBMIT */}
            <div className={`wf-pane ${step === 5 ? 'active' : ''}`}>
              {!createdId ? (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                      5. Review &amp; Submit Challenge
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                      Publishing will broadcast this challenge across Jharkhand Universities (BIT Mesra, IIT ISM, NIT JSR, BAU) and Industry CSR networks.
                    </p>
                  </div>

                  <div className="card" style={{ background: '#fbfcfe', border: '1px solid var(--line)', padding: 18 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: 14, marginBottom: 14 }}>
                      {files[0] && (
                        <div style={{ width: 100, height: 75, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--line)' }}>
                          <img src={files[0].src} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                          <span className={`status-chip ${activeSeverity}`}>Severity: {activeSeverity}</span>
                          <span className={`status-chip ${activePriority}`}>Priority: {activePriority}</span>
                          <span className="proto-tag">{category}</span>
                          <span className="proto-tag" style={{ background: '#0e3860', color: '#fff' }}>
                            {district}, Jharkhand
                          </span>
                        </div>
                        <b style={{ fontSize: 15, color: 'var(--ink)' }}>{title}</b>
                      </div>
                    </div>

                    <div className="kv" style={{ padding: '6px 0' }}>
                      <span>Location</span>
                      <b>{block ? `${block}, ` : ''}{district}, Jharkhand</b>
                    </div>
                    <div className="kv" style={{ padding: '6px 0' }}>
                      <span>Target Beneficiaries</span>
                      <b>{affectedPopulation || 'Rural & tribal community'}</b>
                    </div>
                    <div className="kv" style={{ padding: '6px 0' }}>
                      <span>Expected Outcome</span>
                      <b style={{ color: 'var(--blue)' }}>{expectedOutcome || 'Field-tested community prototype'}</b>
                    </div>

                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                        Required Multidisciplinary Disciplines
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {requiredExpertise.map(exp => (
                          <span key={exp} className="tech-badge" style={{ fontSize: 11 }}>
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                        Ground Reality Description
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--ink)' }}>
                        {desc}
                      </p>
                    </div>
                  </div>

                  {submitError && (
                    <div style={{ marginTop: 12, padding: 12, background: '#fdf2f2', border: '1px solid #f8b4b4', borderRadius: 6, color: '#9b1c1c', fontSize: 12 }}>
                      <b>Submission Error:</b> {submitError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="success-box">
                  <div className="success-icon">✓</div>
                  <h3 style={{ fontSize: 20 }}>Societal Challenge Published</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '6px 0 16px' }}>
                    Registered in the Government of Jharkhand Societal Innovation Pipeline.
                  </p>
                  <div className="card" style={{ textAlign: 'left', background: '#fbfcfe' }}>
                    <div className="kv"><span>Challenge ID</span><b>{createdId}</b></div>
                    <div className="kv"><span>Domain</span><span>{createdCat || category}</span></div>
                    <div className="kv"><span>District</span><span>{district}, Jharkhand</span></div>
                    <div className="kv"><span>Status</span><span className="status-chip High">Stage 1 · Crowdsourced &amp; Evaluated</span></div>
                    <div className="kv"><span>Pipeline</span><b>Awaiting University Squad Matching</b></div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--blue)', marginTop: 14 }}>
                    Click &ldquo;View Challenge in HEI Workspace&rdquo; to review matched universities and submit solution proposals.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="wf-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (step > 1 && !createdId) setStep(s => s - 1);
              }}
              style={{ visibility: step > 1 && !createdId ? 'visible' : 'hidden' }}
            >
              Back
            </button>
            <div className="right">
              {!createdId && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    stopCamera();
                    dispatch({ type: 'CLOSE_WORKFLOW' });
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (createdId) {
                    dispatch({ type: 'CLOSE_WORKFLOW' });
                    dispatch({ type: 'OPEN_DETAIL', id: createdId, from: 'home' });
                  } else {
                    goNext();
                  }
                }}
                disabled={isSubmitting || isValidatingImage}
              >
                {isSubmitting ? 'Publishing to Jharkhand HEI Pipeline…' : nextLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
