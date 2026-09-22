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
  AUTHORITY
} from '@/lib/constants';
import {
  IMPACT_QUESTIONS_BY_CATEGORY,
  calculateCategoryImpactSeverity,
  generateCategoryPrefilledDetails,
  validateEvidenceFile,
  resolveCategoryKey,
  getStandardCategoryName,
  CIVIC_CATEGORIES,
  type CivicCategoryKey,
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

  // Step 1: Capture Photo
  // Step 2: Location & Duplicates
  // Step 3: Help SahYog Assess Impact
  // Step 4: Prefilled Details
  // Step 5: Review & Submit
  const [step, setStep] = useState(1);

  // Evidence & Validation state
  const [files, setFiles] = useState<Photo[]>([]);
  const [validationResult, setValidationResult] = useState<ImageValidationResult | null>(null);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Category state (Supported 8 civic categories)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<CivicCategoryKey>('road');
  const [isChangingCategory, setIsChangingCategory] = useState(false);

  // Location state (Strictly automatic hierarchy: EXIF -> Device GPS -> Map/Search fallback)
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

  // Dynamic Category Impact Assessment state (Neutral unselected defaults — NO severe preselection!)
  const [q1OptionId, setQ1OptionId] = useState<string>('');
  const [q2OptionId, setQ2OptionId] = useState<string>('');
  const [contextOptionIds, setContextOptionIds] = useState<string[]>([]);
  const [customSeverity, setCustomSeverity] = useState<string>('');
  const [isCustomizingSeverity, setIsCustomizingSeverity] = useState(false);

  // Prefilled & Classification state
  const [detectedProblem, setDetectedProblem] = useState('Road surface damage or pothole');
  const [category, setCategory] = useState('Roads & Infrastructure');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
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

  // Dynamic impact calculation using selected category config
  const impactResult = useMemo(() => {
    return calculateCategoryImpactSeverity({
      categoryKey: selectedCategoryKey,
      q1OptionId,
      q2OptionId,
      contextOptionIds
    });
  }, [selectedCategoryKey, q1OptionId, q2OptionId, contextOptionIds]);

  const activeSeverity = isCustomizingSeverity && customSeverity ? customSeverity : impactResult.suggestedSeverity;
  const activePriority = impactResult.suggestedPriority;

  // Category switch helper: immediately resets questions and updates detected labels
  function handleCategoryChange(newKey: CivicCategoryKey) {
    setSelectedCategoryKey(newKey);
    const standardName = getStandardCategoryName(newKey);
    setCategory(standardName);
    const cfg = IMPACT_QUESTIONS_BY_CATEGORY[newKey];
    if (cfg) {
      setDetectedProblem(cfg.categoryLabel || cfg.detectedProblemDefault);
    }
    setQ1OptionId('');
    setQ2OptionId('');
    setContextOptionIds([]);
    setCustomSeverity('');
    setIsCustomizingSeverity(false);
    toast(`Category switched to ${standardName}. Impact questions updated.`, 'info');
  }

  // Nearby duplicate detection (<600m)
  const nearbyDuplicate = useMemo(() => {
    const currentLat = Number(lat);
    const currentLng = Number(lng);
    if (!currentLat || !currentLng || !problems || problems.length === 0) return null;

    let closest: { problem: Problem; distance: number } | null = null;
    for (const p of problems) {
      if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
        const d = getDistanceMeters(currentLat, currentLng, p.latitude, p.longitude);
        if (d <= 600) {
          if (!closest || d < closest.distance) {
            closest = { problem: p, distance: d };
          }
        }
      }
    }
    return closest;
  }, [lat, lng, problems]);

  // Reset on open
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
      setMapStatus('');
      setMapStatusType('');
      setLocationSource(null);
      setLocationAccuracy('');
      setExifFound(false);
      setIsDetectingGps(false);
      setAiResult(null);
      setTitle('');
      setDesc('');
      setSelectedCategoryKey('road');
      setIsChangingCategory(false);
      setCategory('Roads & Infrastructure');
      setDetectedProblem('Road surface damage or pothole');
      setValidationResult(null);
      setIsValidatingImage(false);
      setLandmark('');
      setContact('');
      setLocationSearch('');
      setIsSubmitting(false);
      setSubmitError(null);
      // Neutral unselected defaults!
      setQ1OptionId('');
      setQ2OptionId('');
      setContextOptionIds([]);
      setCustomSeverity('');
      setIsCustomizingSeverity(false);
      setIsEditingTitle(false);
      setIsEditingDesc(false);
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

  // Map init on step === 2
  useEffect(() => {
    if (step !== 2 || !wfOpen) return;
    const tryInit = () => {
      if (window.google?.maps && mapRef.current && !wfMapRef.current) initMap();
      else if (!window.google && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') loadMapsScript();
      else if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
        setMapStatus('Google Maps API key is in development mode. Interactive coordinates and search active.');
        setMapStatusType('info');
      }
    };
    setTimeout(tryInit, 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, wfOpen]);

  // When step 4 is reached, prefill suggestions if unpopulated
  useEffect(() => {
    if (step === 4) {
      const locStr = address || locationSearch || landmark || 'Detected problem location';
      const { suggestedTitle, suggestedDescription } = generateCategoryPrefilledDetails({
        categoryKey: selectedCategoryKey,
        q1OptionId,
        q2OptionId,
        contextOptionIds,
        locationAddress: locStr,
        landmark
      });
      if (!title) setTitle(suggestedTitle);
      if (!desc) setDesc(suggestedDescription);
      runAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleRegenerateDetails() {
    const locStr = address || locationSearch || landmark || 'Detected problem location';
    const { suggestedTitle, suggestedDescription } = generateCategoryPrefilledDetails({
      categoryKey: selectedCategoryKey,
      q1OptionId,
      q2OptionId,
      contextOptionIds,
      locationAddress: locStr,
      landmark
    });
    setTitle(suggestedTitle);
    setDesc(suggestedDescription);
    toast('Regenerated title & description from impact factors.', 'info');
  }

  // Upload helper: stores file permanently via /api/upload into problem-evidence bucket
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
        if (res.ok && json.success && json.url) {
          return json.url;
        }
        if (json.error) {
          toast(json.error, 'error');
        }
      } else {
        const fd = new FormData();
        fd.append('file', fileOrDataUrl);
        fd.append('bucket', 'problem-evidence');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (res.ok && json.success && json.url) {
          return json.url;
        }
        if (json.error) {
          toast(json.error, 'error');
        }
      }
    } catch {
      toast('Evidence upload failed. Checking connectivity...', 'error');
    }
    return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : URL.createObjectURL(fileOrDataUrl);
  }

  // Camera controls
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
        const catKey = validation.suggestedCategoryKey;
        setSelectedCategoryKey(catKey);
        setCategory(getStandardCategoryName(catKey));
        const cfg = IMPACT_QUESTIONS_BY_CATEGORY[catKey];
        if (cfg) setDetectedProblem(cfg.categoryLabel || cfg.detectedProblemDefault);
      }

      // Upload to server
      const permanentUrl = await uploadPhotoToServer(dataUrl, `camera_${Date.now()}.jpg`);
      setFiles([
        {
          src: permanentUrl,
          isVideo: false,
          name: `camera_snapshot_${Date.now()}.jpg`,
          exifGpsFound: false
        }
      ]);

      if (validation.status === 'valid') {
        toast('📷 Camera snapshot captured and validated as civic evidence!', 'success');
      } else if (validation.status === 'selfie') {
        toast('⚠️ Personal photo/selfie detected. Please provide civic issue photo.', 'error');
      } else if (validation.status === 'non_civic') {
        toast('⚠️ Non-civic content detected. Please provide civic issue photo.', 'error');
      } else if (validation.status === 'low_quality') {
        toast('⚠️ Low quality or blurry image detected.', 'error');
      } else if (validation.status === 'uncertain') {
        toast('ℹ️ Category uncertain. Please pick the civic category below.', 'info');
      }

      // Camera images have no EXIF GPS; immediately trigger device GPS
      autoDetectLocation();
    }
  }

  // File Upload with evidence validation & EXIF GPS extraction
  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = e.target.files;
    if (!fl || fl.length === 0) return;
    stopCamera();
    const newFiles: Photo[] = [];
    let photoGpsFound = false;

    setIsValidatingImage(true);
    for (const f of Array.from(fl)) {
      if (f.size > 8 * 1024 * 1024) {
        toast(`${f.name} is larger than 8MB.`, 'error');
        continue;
      }
      if (!/^image\/(jpeg|png|webp)$|^video\/(mp4|webm)$/.test(f.type)) {
        toast(`Unsupported file type: ${f.name}`, 'error');
        continue;
      }

      // Honest heuristic evidence validation
      const validation = await validateEvidenceFile(f, f.name);
      setValidationResult(validation);

      if (validation.suggestedCategoryKey) {
        const catKey = validation.suggestedCategoryKey;
        setSelectedCategoryKey(catKey);
        setCategory(getStandardCategoryName(catKey));
        const cfg = IMPACT_QUESTIONS_BY_CATEGORY[catKey];
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
            setLocationAccuracy('Photo EXIF Metadata (~5-15m)');
            setExifFound(true);
            setAddress(`Location from Photo EXIF: ${gps.latitude.toFixed(5)}° N, ${gps.longitude.toFixed(5)}° E`);
            setLocationConfirmed(true);
          }
        } catch {
          // EXIF reading failed or absent
        }
      }

      const permanentUrl = await uploadPhotoToServer(f);
      newFiles.push({ src: permanentUrl, isVideo: f.type.startsWith('video/'), name: f.name, exifGpsFound: hasExif });

      if (validation.status === 'valid') {
        const catKey = validation.suggestedCategoryKey || 'road';
        toast(`✓ Evidence validated: ${IMPACT_QUESTIONS_BY_CATEGORY[catKey]?.categoryLabel}`, 'success');
      } else if (validation.status === 'selfie') {
        toast('⚠️ Personal photo / selfie detected. Please provide civic issue photo.', 'error');
      } else if (validation.status === 'non_civic') {
        toast('⚠️ Non-civic content detected. Please provide civic issue photo.', 'error');
      } else if (validation.status === 'low_quality') {
        toast('⚠️ Low quality or blurry image detected.', 'error');
      } else if (validation.status === 'uncertain') {
        toast('ℹ️ Category uncertain. Please pick the civic category below.', 'info');
      }
    }
    setIsValidatingImage(false);

    if (photoGpsFound) {
      toast('✓ Location detected from photo metadata (EXIF GPS)', 'success');
    } else {
      // EXIF unavailable: automatically trigger device GPS
      autoDetectLocation();
    }

    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setValidationResult(null);
  }

  // Explicit Demo Mode loader (SIH presentation only — isolated from real reporting!)
  function loadDemoBenchmarkCase() {
    stopCamera();
    const benchmarkSrc = '/demo/pothole_before.jpg';
    setFiles([
      {
        src: benchmarkSrc,
        isVideo: false,
        name: 'sih_benchmark_pothole_before.jpg',
        exifGpsFound: true
      }
    ]);
    setValidationResult({
      status: 'valid',
      title: 'Evidence Verified',
      message: 'Verified LIET Hyderabad entrance road damage benchmark.',
      reason: 'Verified LIET Hyderabad entrance road damage benchmark.',
      suggestedCategoryKey: 'road',
      detectedCategoryKey: 'road',
      detectedKeywords: ['pothole', 'road'],
      canProceed: true,
      requiresManualCategory: false
    });
    setSelectedCategoryKey('road');
    setCategory('Roads & Infrastructure');
    setDetectedProblem('Road surface damage or pothole');
    setLat(String(DEMO_LOCATION.lat));
    setLng(String(DEMO_LOCATION.lng));
    setAddress(DEMO_LOCATION.address);
    setLandmark(DEMO_LOCATION.landmark);
    setLocationSource('PHOTO_EXIF');
    setLocationAccuracy('Pre-Calibrated Benchmark Coordinates');
    setExifFound(true);
    setLocationConfirmed(true);
    // Pre-populate benchmark impact for SIH demonstration
    setQ1OptionId('most_lane');
    setQ2OptionId('severe');
    setContextOptionIds(['school_hospital']);
    toast('🎯 Demo Mode: Loaded SIH Benchmark Case (LIET Campus Hyderabad)', 'success');
  }

  // Automatic Location Detection (EXIF -> Device GPS -> Manual fallback)
  function autoDetectLocation() {
    if (!navigator.geolocation) {
      setMapStatus('Location could not be detected automatically. Device GPS is not supported.');
      setMapStatusType('error');
      setLocationConfirmed(false);
      return;
    }

    setIsDetectingGps(true);
    setMapStatus('Detecting your location via device GPS...');
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
        toast('✓ Location detected from device GPS', 'success');
        if (wfMapRef.current) placeMarker(pos.coords.latitude, pos.coords.longitude, true);
      },
      () => {
        setIsDetectingGps(false);
        setMapStatus('Location could not be detected automatically. Permission denied or GPS unavailable. Please select on map or search.');
        setMapStatusType('error');
        setLocationConfirmed(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  // Google Maps init and helpers
  function loadMapsScript() {
    if (document.getElementById('gmap-script')) return;
    window.initSahYogGoogleMap = initMap;
    const s = document.createElement('script');
    s.id = 'gmap-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&callback=initSahYogGoogleMap`;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      setMapStatus('Interactive map view unavailable. Device GPS and manual address search active.');
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
          : { lat: 17.385, lng: 78.4867 }; // Central Hyderabad default center
      wfMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 15,
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
    wfMapRef.current.setZoom(16);
    if (wfMarkerRef.current) wfMarkerRef.current.setMap(null);
    wfMarkerRef.current = new window.google.maps.Marker({
      position: pos,
      map: wfMapRef.current,
      title: 'SahYog Problem Location'
    });
    let addr = address || 'Selected map location';
    if (doGeocode && wfGeocoderRef.current) {
      try {
        const results = await new Promise<any>((res, rej) =>
          wfGeocoderRef.current.geocode({ location: pos }, (r: any, s: string) =>
            s === 'OK' && r?.[0] ? res(r) : rej()
          )
        );
        addr = results[0].formatted_address;
      } catch {
        addr = `Selected Point: ${pos.lat.toFixed(5)}° N, ${pos.lng.toFixed(5)}° E`;
      }
    }
    setLat(String(pos.lat));
    setLng(String(pos.lng));
    setAddress(addr);
    setLocationConfirmed(true);
    setMapStatus('Location confirmed from map pin.');
    setMapStatusType('success');
  }

  // Truthful Prototype Classification API (Backend authoritative)
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
          const score = Math.min(99, Math.max(65, c.confidence));
          setAiResult({
            'Classified Category': c.category || category,
            'Suggested Physical Severity': activeSeverity,
            'Suggested Response Priority': activePriority,
            'Mandated Authority': c.authority || AUTHORITY[category] || 'Public Works Department',
            'Recommended Action': c.action || 'Site inspection and field assessment',
            'Classification Method': 'Prototype Rule-Based Classification (Ontology Match)',
            'Rule Match Confidence': `${score}% (Keyword Dictionary Match)`,
            'Matched Terms': c.matched_terms?.join(', ') || 'civic infrastructure'
          });
          setAiLoading(false);
          return;
        }
      }
    } catch {
      // Local fallback
    }

    const a = classify(title || detectedProblem, desc, category);
    const score = Math.min(99, Math.max(65, a.confidence));
    setAiResult({
      'Classified Category': a.category || category,
      'Suggested Physical Severity': activeSeverity,
      'Suggested Response Priority': activePriority,
      'Mandated Authority': a.authority || AUTHORITY[category] || 'Public Works Department',
      'Recommended Action': a.action || 'Site inspection and field assessment',
      'Classification Method': 'Prototype Rule-Based Classification (Ontology Match)',
      'Rule Match Confidence': `${score}% (Keyword Dictionary Match)`
    });
    setAiLoading(false);
  }

  // Authoritative Backend Submission
  async function createProblem(): Promise<boolean> {
    setIsSubmitting(true);
    setSubmitError(null);
    const finalLat = lat ? Number(lat) : null;
    const finalLng = lng ? Number(lng) : null;
    const finalAddress = address || locationSearch || 'Reported civic location';

    const currentConfig = IMPACT_QUESTIONS_BY_CATEGORY[selectedCategoryKey];
    const q1Label = currentConfig?.question1.options.find(o => o.id === q1OptionId)?.label;

    const res = await submitProblem({
      title: title || `${activeSeverity} ${detectedProblem}`,
      desc: desc || 'Civic infrastructure problem reported by citizen.',
      category,
      severity: activeSeverity,
      location: finalAddress,
      landmark,
      contact,
      datetime: new Date().toISOString(),
      affected: q1Label || 'Citizens and community members',
      latitude: finalLat ?? DEMO_LOCATION.lat,
      longitude: finalLng ?? DEMO_LOCATION.lng,
      location_source: locationSource || 'MANUAL_ENTRY',
      location_accuracy: locationAccuracy || 'User specified',
      photos: files.slice(),
      factors: {
        categoryKey: selectedCategoryKey,
        categoryName: category,
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
      const err = res.error || 'Failed to register problem in backend datastore.';
      setSubmitError(err);
      toast(err, 'error');
      return false;
    }

    setCreatedId(res.data.id);
    setCreatedCat(res.data.category);
    toast(`Problem ${res.data.id} registered in persistent datastore.`, 'success');
    return true;
  }

  // Step navigation
  function goNext() {
    if (step === 1) {
      if (files.length === 0) {
        toast('Please capture or upload photo evidence to proceed.', 'error');
        return;
      }
      if (validationResult && (validationResult.status === 'selfie' || validationResult.status === 'non_civic' || validationResult.status === 'low_quality')) {
        toast('Cannot proceed with invalid or non-civic evidence. Please provide a clear photo of the civic issue.', 'error');
        return;
      }
      if (validationResult?.status === 'uncertain' && !selectedCategoryKey) {
        toast('Please select a civic category before continuing.', 'error');
        return;
      }
      stopCamera();
      // If location is not yet known, trigger auto GPS immediately
      if (!lat || !lng) {
        autoDetectLocation();
      }
      setStep(2);
    } else if (step === 2) {
      if (!lat || !lng) {
        toast('Please confirm a location, select on map, or use Demo Mode.', 'error');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      if (!title) {
        toast('Please provide a problem title.', 'error');
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
    toast(`Viewing existing nearby problem ${problemId}.`, 'info');
  }

  const nextLabel =
    step === 1
      ? 'Continue to Location'
      : step === 2
      ? 'Continue to Impact'
      : step === 3
      ? 'Continue to Review Details'
      : step === 4
      ? 'Review Report Summary'
      : createdId
      ? 'View Stakeholder Workspace'
      : 'Submit to Collaborative Pipeline';

  if (!wfOpen) return null;

  return (
    <div className="overlay workflow-overlay show" aria-hidden="false">
      <div className="modal" role="dialog" aria-modal={true} aria-labelledby="wfTitle">
        <div className="workflow-shell">
          {/* Header */}
          <div className="wf-head">
            <div className="modal-head" style={{ margin: 0 }}>
              <div>
                <div className="wf-title" id="wfTitle">Report a Societal Problem</div>
                <div className="wf-sub">Evidence-First Reporting · Automatic Context &amp; Multi-Stakeholder Collaboration</div>
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
            {/* STEP 1: PHOTO EVIDENCE FIRST */}
            <div className={`wf-pane ${step === 1 ? 'active' : ''}`}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                  Capture the Problem
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Take or upload a photograph of the issue. SahYog extracts evidence and location automatically.
                </p>
              </div>

              {/* Primary Photo Actions */}
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
                  {isCameraActive ? '📸 Capture Snapshot' : '📷 Take Photo'}
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
                  <span>🖼 Upload Photo</span>
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

              {/* Image Validation Spinner */}
              {isValidatingImage && (
                <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 14, fontSize: 12.5, color: 'var(--muted)' }}>
                  ⏳ Validating evidence authenticity and scanning civic cues…
                </div>
              )}

              {/* WebRTC Live Camera Stream */}
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
                      📸 Snapshot
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={stopCamera}
                    >
                      ✕ Close Camera
                    </button>
                  </div>
                </div>
              )}

              {cameraError && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#fff8eb',
                    border: '1px solid #f9dfad',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#8f5a00',
                    marginBottom: 12
                  }}
                >
                  ⚠️ {cameraError} (You can upload a photo from your device instead).
                </div>
              )}

              {/* Evidence Validation Notices */}
              {files.length > 0 && validationResult && (
                <>
                  {/* Case A: Selfie / Portrait */}
                  {validationResult.status === 'selfie' && (
                    <div style={{ padding: '14px 16px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c53030', fontWeight: 700, fontSize: 13.5 }}>
                        <span>🚫</span>
                        <span>Personal Photo / Selfie Detected</span>
                      </div>
                      <p style={{ margin: '6px 0 12px', fontSize: 12.5, color: '#742a2a', lineHeight: 1.5 }}>
                        SahYog is dedicated exclusively to public infrastructure and community issues. Photos containing personal portraits, selfies, or non-civic subjects cannot be registered for municipal resolution.
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setFiles([]);
                            setValidationResult(null);
                            startCamera();
                          }}
                        >
                          📸 Retake Photo
                        </button>
                        <label
                          className="btn btn-secondary btn-sm"
                          style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center' }}
                        >
                          <span>🖼 Choose Another Image</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,video/mp4"
                            style={{ display: 'none' }}
                            onChange={handleFileInput}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Case B: Non-Civic Content */}
                  {validationResult.status === 'non_civic' && (
                    <div style={{ padding: '14px 16px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c53030', fontWeight: 700, fontSize: 13.5 }}>
                        <span>⚠️</span>
                        <span>Non-Civic Content Detected</span>
                      </div>
                      <p style={{ margin: '6px 0 12px', fontSize: 12.5, color: '#742a2a', lineHeight: 1.5 }}>
                        {validationResult.reason || 'The image appears unrelated to civic infrastructure, sanitation, or public amenities. Municipal response teams require photographic proof of physical issues.'}
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setFiles([]);
                            setValidationResult(null);
                            startCamera();
                          }}
                        >
                          📸 Retake Photo
                        </button>
                        <label
                          className="btn btn-secondary btn-sm"
                          style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center' }}
                        >
                          <span>🖼 Choose Another Image</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,video/mp4"
                            style={{ display: 'none' }}
                            onChange={handleFileInput}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Case C: Low Quality / Blurry */}
                  {validationResult.status === 'low_quality' && (
                    <div style={{ padding: '14px 16px', background: '#fffaf0', border: '1px solid #feebc8', borderRadius: 10, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c05621', fontWeight: 700, fontSize: 13.5 }}>
                        <span>⚠️</span>
                        <span>Low Quality / Blurry Image</span>
                      </div>
                      <p style={{ margin: '6px 0 12px', fontSize: 12.5, color: '#7b341e', lineHeight: 1.5 }}>
                        {validationResult.reason || 'The image resolution is too low or blurry to assess physical damage. Please capture or upload a higher clarity photo.'}
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setFiles([]);
                            setValidationResult(null);
                            startCamera();
                          }}
                        >
                          📸 Retake Photo
                        </button>
                        <label
                          className="btn btn-secondary btn-sm"
                          style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center' }}
                        >
                          <span>🖼 Choose Another Image</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,video/mp4"
                            style={{ display: 'none' }}
                            onChange={handleFileInput}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Case D: Category Uncertainty */}
                  {validationResult.status === 'uncertain' && (
                    <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1e293b', fontWeight: 700, fontSize: 13.5 }}>
                        <span>ℹ️</span>
                        <span>Category Classification Uncertainty</span>
                      </div>
                      <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                        Category could not be determined automatically from image metadata. Please select the appropriate civic problem category below to continue:
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8, marginTop: 8 }}>
                        {CIVIC_CATEGORIES.map(cat => (
                          <button
                            key={cat.key}
                            type="button"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: selectedCategoryKey === cat.key ? '2px solid var(--blue)' : '1px solid var(--line)',
                              background: selectedCategoryKey === cat.key ? '#eef5fc' : '#fff',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: 12,
                              fontWeight: selectedCategoryKey === cat.key ? 700 : 500,
                              color: selectedCategoryKey === cat.key ? 'var(--blue)' : 'var(--ink)'
                            }}
                            onClick={() => {
                              handleCategoryChange(cat.key);
                              setValidationResult(prev => prev ? { ...prev, status: 'valid', suggestedCategoryKey: cat.key, detectedCategoryKey: cat.key } : null);
                            }}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Case E: Valid Civic Evidence */}
                  {validationResult.status === 'valid' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 14 }}>✓</span>
                        <div>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#15803d' }}>
                            Evidence Validated: {IMPACT_QUESTIONS_BY_CATEGORY[selectedCategoryKey]?.categoryLabel}
                          </span>
                          <div style={{ fontSize: 11, color: '#166534', marginTop: 1 }}>
                            Category: <b>{category}</b> · Prototype Rule-Based Classification
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="prefill-edit-toggle"
                        onClick={() => setIsChangingCategory(!isChangingCategory)}
                      >
                        {isChangingCategory ? 'Keep Category' : 'Change Category'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Category selector drawer if user clicks Change Category in Step 1 */}
              {isChangingCategory && (
                <div style={{ padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                    Select Problem Category:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
                    {CIVIC_CATEGORIES.map(cat => (
                      <button
                        key={cat.key}
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: selectedCategoryKey === cat.key ? '2px solid var(--blue)' : '1px solid var(--line)',
                          background: selectedCategoryKey === cat.key ? '#eef5fc' : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: 12,
                          fontWeight: selectedCategoryKey === cat.key ? 700 : 500,
                          color: selectedCategoryKey === cat.key ? 'var(--blue)' : 'var(--ink)'
                        }}
                        onClick={() => {
                          handleCategoryChange(cat.key);
                          setIsChangingCategory(false);
                        }}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Captured Photo Previews */}
              {files.length > 0 && (
                <div style={{ background: '#fbfcfe', border: '1px solid var(--line)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b style={{ fontSize: 13 }}>Evidence Attached ({files.length})</b>
                      {validationResult?.status === 'valid' && (
                        <span className="quality-chip GOOD">✓ Evidence Ready</span>
                      )}
                    </div>
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
                            📍 GPS in Photo
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explicit SIH Benchmark Demo Mode Drawer */}
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
                  marginTop: 10
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="demo-tag">DEMO MODE</span>
                    <b style={{ fontSize: 12.5, color: 'var(--blue)' }}>SIH 2026 Evaluation Benchmark Case</b>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                    Demonstrates verified LIET Hyderabad entrance road pothole evidence &amp; coordinates.
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

            {/* STEP 2: LOCATION & DUPLICATE DETECTION */}
            <div className={`wf-pane ${step === 2 ? 'active' : ''}`}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                  Location &amp; Proximity Check
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Automatically determined via photo metadata or device GPS. Nearby reports are checked automatically.
                </p>
              </div>

              {/* Nearby Duplicate Detection Banner */}
              {nearbyDuplicate && (
                <div className="duplicate-alert-banner">
                  <div className="duplicate-alert-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⚠️</span>
                      <span>Nearby problem detected within 600m (~{nearbyDuplicate.distance} meters away)</span>
                    </div>
                    <span className="proto-tag" style={{ background: '#f5c878', color: '#593900' }}>
                      Proximity Notice
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#593900' }}>
                    <b>Problem #{nearbyDuplicate.problem.id}:</b> {nearbyDuplicate.problem.title} ({nearbyDuplicate.problem.category})
                    {nearbyDuplicate.problem.category === category && (
                      <span style={{ marginLeft: 6, fontWeight: 700, color: '#14548f' }}>
                        • Same Category ({category})
                      </span>
                    )}
                    <div style={{ marginTop: 3, opacity: 0.9 }}>
                      Status: <b>{STAGES[nearbyDuplicate.problem.stage] || 'Reported'}</b> · Location: {nearbyDuplicate.problem.location}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleViewExisting(nearbyDuplicate.problem.id)}
                    >
                      👁 View Existing Problem
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => toast('Continuing as a separate report.', 'info')}
                    >
                      Continue as New Report
                    </button>
                  </div>
                </div>
              )}

              {/* Location Source Status Banner */}
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
                  <span style={{ color: 'var(--muted)' }}>Location Source: </span>
                  {locationSource ? (
                    <b style={{ color: 'var(--blue)' }}>
                      {locationSource === 'PHOTO_EXIF'
                        ? '✓ Location detected from photo metadata (EXIF GPS)'
                        : locationSource === 'DEVICE_GPS'
                        ? '✓ Location detected from device GPS'
                        : 'Map Selection'}
                    </b>
                  ) : (
                    <span style={{ color: '#8f5a00' }}>Awaiting automatic detection or map pin</span>
                  )}
                  {locationAccuracy && (
                    <div style={{ color: 'var(--muted)', fontSize: 11.5, marginTop: 2 }}>{locationAccuracy}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={autoDetectLocation}
                    disabled={isDetectingGps}
                  >
                    {isDetectingGps ? 'Detecting GPS…' : '📡 Retry Device GPS'}
                  </button>
                </div>
              </div>

              {/* Detected Coordinates Card */}
              {lat && lng ? (
                <div className="sahyog-location-card" style={{ marginTop: 0, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="sahyog-location-title" style={{ margin: 0 }}>📍 Problem Location</div>
                    <span className="proto-tag">
                      {locationConfirmed ? '✓ Confirmed' : 'Ready to Confirm'}
                    </span>
                  </div>
                  <div className="location-kv" style={{ margin: '10px 0' }}>
                    <div>
                      <span>Area / Address</span>
                      <b>{address || locationSearch || 'Coordinates registered'}</b>
                    </div>
                    <div>
                      <span>Latitude</span>
                      <b>{Number(lat).toFixed(5)}</b>
                    </div>
                    <div>
                      <span>Longitude</span>
                      <b>{Number(lng).toFixed(5)}</b>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#fff8eb',
                    border: '1px solid #f9dfad',
                    borderRadius: 8,
                    fontSize: 12.5,
                    color: '#8f5a00',
                    marginBottom: 12
                  }}
                >
                  <b>Location could not be detected automatically.</b>
                  <div style={{ marginTop: 4 }}>
                    Please click a point on the interactive map below, search your area, or load the SIH Demo Benchmark.
                  </div>
                </div>
              )}

              {/* Map View */}
              <div className="sahyog-google-map" id="wf-map" ref={mapRef} role="application" aria-label="Google Map" />

              {/* Explicit Demo Coordinates Button for Presentation */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11.5 }}
                  onClick={() => {
                    setAddress(DEMO_LOCATION.address);
                    setLat(String(DEMO_LOCATION.lat));
                    setLng(String(DEMO_LOCATION.lng));
                    setLocationSource('DEMO_LOCATION');
                    setLocationAccuracy('Pre-Calibrated Benchmark Coordinates');
                    setLocationConfirmed(true);
                    toast('🎯 Demo Mode: Loaded LIET Campus Coordinates', 'info');
                  }}
                >
                  📍 Demo Mode — Use LIET Campus Coordinates
                </button>
              </div>

              {mapStatus && <div className={`map-status ${mapStatusType}`} style={{ marginTop: 8 }}>{mapStatus}</div>}
            </div>

            {/* STEP 3: HELP SAHYOG ASSESS THE IMPACT */}
            <div className={`wf-pane ${step === 3 ? 'active' : ''}`}>
              {(() => {
                const currentConfig = IMPACT_QUESTIONS_BY_CATEGORY[selectedCategoryKey] || IMPACT_QUESTIONS_BY_CATEGORY['road'];
                return (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                            Help SahYog assess the impact
                          </h3>
                          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                            Category-specific questions for <b>{category}</b> calculate an objective severity score for solver matching.
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="proto-tag">Heuristic Factor Assessment</span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setIsChangingCategory(!isChangingCategory)}
                            style={{ fontSize: 12 }}
                          >
                            {isChangingCategory ? 'Done Changing' : '🔄 Change Category'}
                          </button>
                        </div>
                      </div>

                      {/* Category Switcher Drawer in Step 3 */}
                      {isChangingCategory && (
                        <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                            Select Civic Category (resets questions to category defaults):
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                            {CIVIC_CATEGORIES.map(cat => (
                              <button
                                key={cat.key}
                                type="button"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '8px 12px',
                                  borderRadius: 8,
                                  border: selectedCategoryKey === cat.key ? '2px solid var(--blue)' : '1px solid var(--line)',
                                  background: selectedCategoryKey === cat.key ? '#eef5fc' : '#fff',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontSize: 12,
                                  fontWeight: selectedCategoryKey === cat.key ? 700 : 500,
                                  color: selectedCategoryKey === cat.key ? 'var(--blue)' : 'var(--ink)'
                                }}
                                onClick={() => {
                                  handleCategoryChange(cat.key);
                                  setIsChangingCategory(false);
                                }}
                              >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Question 1: Scale / Volume / Extent */}
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
                              name="category_q1"
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

                    {/* Question 2: Disruption / Obstruction / Health Risk */}
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
                              name="category_q2"
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

                    {/* Question 3: Sensitive Context / Hazard Boosts */}
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

                    {/* Prototype Severity Recommendation Box */}
                    <div style={{ background: '#f7fbff', border: '1px solid #cfe0f1', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <b style={{ fontSize: 14, color: 'var(--blue)' }}>Impact-Based Assessment</b>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                            Suggested severity based on field scale, civic disruption, and sensitive location context.
                          </div>
                        </div>
                        <span className="proto-tag">Heuristic Factor Assessment</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: 10 }}>
                          <small style={{ color: 'var(--muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            Suggested Physical Severity
                          </small>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <span className={`status-chip ${activeSeverity}`}>{activeSeverity}</span>
                            <button
                              type="button"
                              className="prefill-edit-toggle"
                              onClick={() => setIsCustomizingSeverity(!isCustomizingSeverity)}
                            >
                              {isCustomizingSeverity ? 'Use Suggested' : 'Change Severity'}
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
                          <small style={{ color: 'var(--muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            Suggested Response Priority
                          </small>
                          <div style={{ marginTop: 4 }}>
                            <span className={`status-chip ${activePriority}`}>{activePriority}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                            Elevated if in vicinity of educational, hospital, or high-risk zones.
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <b style={{ fontSize: 12, color: 'var(--ink)' }}>Factual Assessment Summary:</b>
                        <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 4, background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--line)' }}>
                          {impactResult.explanation}
                        </div>
                        {impactResult.factors.length > 0 && (
                          <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: 11.5, color: 'var(--muted)' }}>
                            {impactResult.factors.map((f, i) => (
                              <li key={i} style={{ marginBottom: 2 }}>{f}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* STEP 4: PREFILLED DETAILS & RULE-BASED CLASSIFICATION */}
            <div className={`wf-pane ${step === 4 ? 'active' : ''}`}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                  Problem Details &amp; Classification
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Pre-filled by prototype rule-based ontology. You retain full edit control before submission.
                </p>
              </div>

              {/* Transparent Classifier Card */}
              <div className="ai-demo-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <b>Prototype Rule-Based Classification</b>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Rule-Based Ontology &amp; Statutory Authority Mapping</div>
                  </div>
                  <span className="proto-tag">Rule-Based Prototype</span>
                </div>

                {aiLoading ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>
                    Analyzing report context and available evidence against municipal ontology…
                  </div>
                ) : (
                  <div className="ai-demo-grid" style={{ marginTop: 10 }}>
                    <div className="ai-kv">
                      <small>Detected Problem</small>
                      <b>{detectedProblem}</b>
                    </div>
                    <div className="ai-kv">
                      <small>Category</small>
                      <b>{category}</b>
                    </div>
                    <div className="ai-kv">
                      <small>Subcategory</small>
                      <b>{SUBCATEGORY[category] || 'Road Surface Damage'}</b>
                    </div>
                    <div className="ai-kv">
                      <small>Mandated Authority</small>
                      <b>{AUTHORITY[category] || 'Public Works Department'}</b>
                    </div>
                  </div>
                )}
              </div>

              {/* Title Field with Edit Toggle & Regenerate */}
              <div className="field" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ margin: 0 }}>Problem Title *</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      className="prefill-edit-toggle"
                      onClick={handleRegenerateDetails}
                      title="Sync title and description with selected category and impact factors"
                    >
                      🔄 Re-sync from Factors
                    </button>
                    <button
                      type="button"
                      className="prefill-edit-toggle"
                      onClick={() => setIsEditingTitle(!isEditingTitle)}
                    >
                      {isEditingTitle ? 'Done Editing' : '✏️ Edit Title'}
                    </button>
                  </div>
                </div>
                {isEditingTitle ? (
                  <input
                    type="text"
                    maxLength={120}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                ) : (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#fff',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: 'var(--ink)'
                    }}
                  >
                    {title}
                  </div>
                )}
              </div>

              {/* Description Field with Edit Toggle */}
              <div className="field" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ margin: 0 }}>Description *</label>
                  <button
                    type="button"
                    className="prefill-edit-toggle"
                    onClick={() => setIsEditingDesc(!isEditingDesc)}
                  >
                    {isEditingDesc ? 'Done Editing' : '✏️ Edit Description'}
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
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#fff',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: 'var(--ink)'
                    }}
                  >
                    {desc}
                  </div>
                )}
              </div>

              {/* Optional Landmark & Contact Fields */}
              <div className="wf-grid">
                <div className="field">
                  <label>Landmark (optional)</label>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Nearby gate, building, or junction..."
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Contact Info (optional)</label>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Phone or email for status updates"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* STEP 5: REVIEW & SUBMIT */}
            <div className={`wf-pane ${step === 5 ? 'active' : ''}`}>
              {!createdId ? (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                      Report Review
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                      Review and edit anything before submitting to the collaborative pipeline.
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
                        </div>
                        <b style={{ fontSize: 15, color: 'var(--ink)' }}>{title}</b>
                      </div>
                    </div>

                    <div className="kv" style={{ padding: '6px 0' }}>
                      <span>Location</span>
                      <b>{address || locationSearch || 'Reported civic area'}</b>
                    </div>
                    <div className="kv" style={{ padding: '6px 0' }}>
                      <span>Location Source</span>
                      <span className="status-chip Low">{locationSource || 'MANUAL_ENTRY'}</span>
                    </div>
                    <div className="kv" style={{ padding: '6px 0' }}>
                      <span>Mandated Authority</span>
                      <b>{AUTHORITY[category] || 'Public Works Department'}</b>
                    </div>
                    <div className="kv" style={{ padding: '6px 0' }}>
                      <span>Evidence Status</span>
                      <span className="quality-chip GOOD">✓ Evidence Attached ({files.length})</span>
                    </div>

                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                        Impact Factors &amp; Assessment
                      </span>
                      <div style={{ fontSize: 12.5, color: 'var(--ink)', marginTop: 4 }}>
                        {impactResult.explanation}
                      </div>
                      {impactResult.factors.length > 0 && (
                        <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: 11.5, color: 'var(--muted)' }}>
                          {impactResult.factors.map((f, i) => (
                            <li key={i} style={{ marginBottom: 2 }}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                        Description
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--ink)' }}>
                        {desc}
                      </p>
                    </div>
                  </div>

                  {submitError && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        background: '#fdf2f2',
                        border: '1px solid #f8b4b4',
                        borderRadius: 6,
                        color: '#9b1c1c',
                        fontSize: 12
                      }}
                    >
                      <b>Submission Error:</b> {submitError}
                      <div style={{ marginTop: 4 }}>Click &ldquo;Submit to Collaborative Pipeline&rdquo; to retry.</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="success-box">
                  <div className="success-icon">✓</div>
                  <h3 style={{ fontSize: 20 }}>Problem Registered in Pipeline</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '6px 0 16px' }}>
                    Created in persistent datastore as the central source of truth across all 5 stakeholder dashboards.
                  </p>
                  <div className="card" style={{ textAlign: 'left', background: '#fbfcfe' }}>
                    <div className="kv"><span>Problem ID</span><b>{createdId}</b></div>
                    <div className="kv"><span>Category</span><span>{createdCat || category}</span></div>
                    <div className="kv"><span>Location</span><span>{address || locationSearch}</span></div>
                    <div className="kv"><span>Severity &amp; Priority</span><span>{activeSeverity} · Priority: {activePriority}</span></div>
                    <div className="kv"><span>Status</span><span className="status-chip High">Stage 1 · Submitted &amp; Classified</span></div>
                    <div className="kv"><span>Datastore Status</span><b>Persistent Supabase Datastore</b></div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--blue)', marginTop: 14 }}>
                    Click &ldquo;View Stakeholder Workspace&rdquo; to track solver matching and collaboration!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
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
              {(() => {
                const isStep1Invalid = step === 1 && (
                  files.length === 0 ||
                  validationResult?.status === 'selfie' ||
                  validationResult?.status === 'non_civic' ||
                  validationResult?.status === 'low_quality' ||
                  (validationResult?.status === 'uncertain' && !selectedCategoryKey)
                );
                return (
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
                    disabled={isSubmitting || isValidatingImage || isStep1Invalid}
                    title={isStep1Invalid ? 'Please attach valid civic evidence to proceed' : ''}
                  >
                    {isSubmitting ? 'Registering in Pipeline…' : nextLabel}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
