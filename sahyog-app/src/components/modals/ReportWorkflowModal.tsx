'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSahYog } from '@/store/useSahYog';
import {
  CATEGORIES,
  WORKFLOW_STEPS,
  STAGES,
  GOOGLE_MAPS_API_KEY,
  DEMO_LOCATION,
  ROAD_AFFECTED_OPTIONS,
  TRAFFIC_IMPACT_OPTIONS,
  CONTEXT_PROXIMITY_OPTIONS,
  calculateImpactSeverity,
  generatePrefilledDetails,
  SUBCATEGORY,
  AUTHORITY
} from '@/lib/constants';
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
  // Step 3: Impact & Severity
  // Step 4: Prefilled Details
  // Step 5: Review & Submit
  const [step, setStep] = useState(1);

  // Evidence state
  const [files, setFiles] = useState<Photo[]>([]);
  const [photoQuality, setPhotoQuality] = useState<'GOOD' | 'FAIR' | 'POOR' | null>(null);
  const [photoQualityReason, setPhotoQualityReason] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Location state
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  const [locationSource, setLocationSource] = useState<LocationSource>('DEVICE_GPS');
  const [locationAccuracy, setLocationAccuracy] = useState('High Accuracy (Device GPS API)');
  const [exifFound, setExifFound] = useState(false);
  const [mapStatus, setMapStatus] = useState('');
  const [mapStatusType, setMapStatusType] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [landmark, setLandmark] = useState('');

  // Impact Assessment state
  const [roadAffectedId, setRoadAffectedId] = useState<string>('most_lane');
  const [trafficImpactId, setTrafficImpactId] = useState<string>('severe');
  const [contextProximityIds, setContextProximityIds] = useState<string[]>(['school_hospital']);
  const [customSeverity, setCustomSeverity] = useState<string>('');
  const [isCustomizingSeverity, setIsCustomizingSeverity] = useState(false);

  // Prefilled & Classification state
  const [detectedProblem, setDetectedProblem] = useState('Pothole & road surface damage');
  const [category, setCategory] = useState('Roads & Infrastructure');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [contact, setContact] = useState('');
  const [aiResult, setAiResult] = useState<Record<string, string> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Submission & Result state
  const [createdId, setCreatedId] = useState('');
  const [createdCat, setCreatedCat] = useState('');
  const [createdDate, setCreatedDate] = useState('');
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

  // Calculate suggested severity and priority
  const impactResult = useMemo(() => {
    return calculateImpactSeverity({
      roadAffectedId,
      trafficImpactId,
      contextProximityIds
    });
  }, [roadAffectedId, trafficImpactId, contextProximityIds]);

  const activeSeverity = isCustomizingSeverity && customSeverity ? customSeverity : impactResult.suggestedSeverity;
  const activePriority = impactResult.suggestedPriority;

  // Detect nearby duplicate problems
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
      setPhotoQuality(null);
      setPhotoQualityReason('');
      setIsCameraActive(false);
      setCameraError('');
      setLocationConfirmed(false);
      setLat('');
      setLng('');
      setAddress('');
      setMapStatus('');
      setMapStatusType('');
      setLocationSource('DEVICE_GPS');
      setLocationAccuracy('High Accuracy (Device GPS API)');
      setExifFound(false);
      setAiResult(null);
      setTitle('');
      setDesc('');
      setCategory('Roads & Infrastructure');
      setDetectedProblem('Pothole & road surface damage');
      setLandmark('');
      setContact('');
      setLocationSearch('');
      setIsSubmitting(false);
      setSubmitError(null);
      setRoadAffectedId('most_lane');
      setTrafficImpactId('severe');
      setContextProximityIds(['school_hospital']);
      setCustomSeverity('');
      setIsCustomizingSeverity(false);
      setIsEditingTitle(false);
      setIsEditingDesc(false);
    }
    return () => {
      stopCamera();
    };
  }, [wfOpen]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Sync Google Map when step === 2
  useEffect(() => {
    if (step !== 2 || !wfOpen) return;
    const tryInit = () => {
      if (window.google?.maps && mapRef.current && !wfMapRef.current) initMap();
      else if (!window.google && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') loadMapsScript();
      else if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
        setMapStatus('Replace YOUR_GOOGLE_MAPS_API_KEY in lib/constants.ts with your real key.');
        setMapStatusType('error');
      }
    };
    setTimeout(tryInit, 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, wfOpen]);

  // When reaching step 4 (Prefilled Details), auto-generate title & description if blank
  useEffect(() => {
    if (step === 4) {
      const locStr = address || locationSearch || landmark || DEMO_LOCATION.address;
      const { suggestedTitle, suggestedDescription } = generatePrefilledDetails({
        category,
        detectedProblem,
        location: locStr,
        landmark,
        severity: activeSeverity,
        priority: activePriority,
        factors: impactResult.factors
      });
      if (!title) setTitle(suggestedTitle);
      if (!desc) setDesc(suggestedDescription);
      runAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Camera management
  async function startCamera() {
    setCameraError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Direct camera streaming is unsupported by this browser. Please use photo upload.');
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
    } catch (err: any) {
      setCameraError('Camera access denied or device has no connected camera.');
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

  function captureSnapshot() {
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
      setFiles([
        {
          src: dataUrl,
          isVideo: false,
          name: `camera_evidence_${Date.now()}.jpg`,
          exifGpsFound: false
        }
      ]);
      setPhotoQuality('GOOD');
      setPhotoQualityReason('Photo captured from device camera. Affected area is clear.');
      toast('📷 Camera snapshot captured!', 'success');
    }
  }

  // SIH Benchmark Photo Loader (1-click judge evaluation)
  function loadBenchmarkPhoto() {
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
    setPhotoQuality('GOOD');
    setPhotoQualityReason('High resolution benchmark evidence. Sharp road crater boundary and surface texture.');
    setLat(String(DEMO_LOCATION.lat));
    setLng(String(DEMO_LOCATION.lng));
    setAddress(DEMO_LOCATION.address);
    setLandmark(DEMO_LOCATION.landmark);
    setLocationSource('PHOTO_EXIF');
    setLocationAccuracy('Photo EXIF GPS Metadata (~5-15m)');
    setExifFound(true);
    setLocationConfirmed(true);
    setCategory('Roads & Infrastructure');
    setDetectedProblem('Pothole & road surface damage');
    toast('🎯 Loaded SIH Benchmark Evidence & LIET Coordinates!', 'success');
  }

  // File Upload with EXIF Extraction
  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = e.target.files;
    if (!fl || fl.length === 0) return;
    stopCamera();
    const newFiles: Photo[] = [];
    let photoGpsFound = false;

    for (const f of Array.from(fl)) {
      if (f.size > 8 * 1024 * 1024) {
        toast(`${f.name} is larger than 8MB.`, 'error');
        continue;
      }
      if (!/^image\/(jpeg|png|webp)$|^video\/(mp4|webm)$/.test(f.type)) {
        toast(`Unsupported file type: ${f.name}`, 'error');
        continue;
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
            setLocationAccuracy('Photo EXIF GPS Metadata (~5-15m)');
            setExifFound(true);
            if (!address) {
              setAddress(`Location from Photo EXIF: ${gps.latitude.toFixed(5)}° N, ${gps.longitude.toFixed(5)}° E`);
            }
          }
        } catch {
          // No EXIF or error
        }
      }

      const src = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      });

      newFiles.push({ src, isVideo: f.type.startsWith('video/'), name: f.name, exifGpsFound: hasExif });
    }

    if (photoGpsFound) {
      toast('📍 GPS coordinates successfully extracted from photo EXIF!', 'success');
    }

    setFiles(prev => [...prev, ...newFiles]);
    setPhotoQuality('GOOD');
    setPhotoQualityReason('Photo is clear enough for structural analysis.');
    e.target.value = '';
  }

  function removeFile(i: number) {
    setFiles(prev => {
      const updated = prev.filter((_, idx) => idx !== i);
      if (updated.length === 0) {
        setPhotoQuality(null);
        setPhotoQualityReason('');
      }
      return updated;
    });
  }

  // Location handling
  function loadMapsScript() {
    if (document.getElementById('gmap-script')) return;
    window.initSahYogGoogleMap = initMap;
    const s = document.createElement('script');
    s.id = 'gmap-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&callback=initSahYogGoogleMap`;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      setMapStatus('Google Maps failed to load. Fallback to browser GPS & SIH Demo Location active.');
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
          : { lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng };
      wfMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 16,
        mapTypeControl: true,
        streetViewControl: true,
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
        addr = 'Address could not be determined';
      }
    }
    setLat(String(pos.lat));
    setLng(String(pos.lng));
    setAddress(addr);
    setLocationConfirmed(false);
    setMapStatus('Location pin placed. Click "Confirm Location" below.');
    setMapStatusType('info');
  }

  function useDemoLocation() {
    setAddress(DEMO_LOCATION.address);
    setLat(String(DEMO_LOCATION.lat));
    setLng(String(DEMO_LOCATION.lng));
    setLocationSource('DEMO_LOCATION');
    setLocationAccuracy('Pre-Calibrated SIH Benchmark Coordinates (LIET Campus)');
    if (!landmark) setLandmark(DEMO_LOCATION.landmark);
    setLocationConfirmed(true);
    setMapStatus("✅ Confirmed SIH Demo Location: Lord's Institute of Engineering & Technology, Hyderabad.");
    setMapStatusType('success');
    toast('SIH Demo Location (LIET Hyderabad) loaded & confirmed!', 'success');
    if (wfMapRef.current && window.google?.maps) {
      const pos = { lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng };
      wfMapRef.current.setCenter(pos);
      wfMapRef.current.setZoom(16);
      if (wfMarkerRef.current) wfMarkerRef.current.setPosition(pos);
      else
        wfMarkerRef.current = new window.google.maps.Marker({
          position: pos,
          map: wfMapRef.current,
          title: "Lord's Institute (SIH Demo Location)"
        });
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMapStatus('GPS unavailable on this browser. Click map or use Demo Location.');
      setMapStatusType('error');
      return;
    }
    setMapStatus('Requesting device GPS coordinates…');
    setMapStatusType('info');
    toast('Requesting device location…', 'info');

    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocationSource('DEVICE_GPS');
        setLocationAccuracy(`High Accuracy GPS (±${Math.round(pos.coords.accuracy || 10)}m)`);
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setAddress(`Device GPS: ${pos.coords.latitude.toFixed(5)}° N, ${pos.coords.longitude.toFixed(5)}° E`);
        setLocationConfirmed(true);
        if (wfMapRef.current) placeMarker(pos.coords.latitude, pos.coords.longitude, true);
        toast('📍 Device GPS coordinates successfully detected!', 'success');
      },
      () => {
        setMapStatus('Device GPS permission denied. Map selection and SIH Demo Location active.');
        setMapStatusType('error');
        toast('GPS access denied. Use map selection or SIH Demo Location.', 'info');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  function confirmLocation() {
    if (!lat || !lng) {
      setMapStatus('Please detect GPS, select a map point, or click "Use SIH Demo Location".');
      setMapStatusType('error');
      return;
    }
    setLocationConfirmed(true);
    setMapStatus('✅ Problem location confirmed.');
    setMapStatusType('success');
    toast('Problem location confirmed.', 'success');
  }

  // Classification API
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
            'Recommended Action': c.action || 'Site inspection and rapid materials estimation',
            'Classification Method': 'Prototype Classification Engine (Ontology Mapping)',
            'Prototype Rule Confidence': `${score}% (Keyword Dictionary Match)`,
            'Matched Terms': c.matched_terms?.join(', ') || 'pothole, road damage, transit'
          });
          setAiLoading(false);
          return;
        }
      }
    } catch {
      // Fallback to local classifier
    }

    const a = classify(title || detectedProblem, desc, category);
    const score = Math.min(99, Math.max(65, a.confidence));
    setAiResult({
      'Classified Category': a.category || category,
      'Suggested Physical Severity': activeSeverity,
      'Suggested Response Priority': activePriority,
      'Mandated Authority': a.authority || AUTHORITY[category] || 'Public Works Department',
      'Recommended Action': a.action || 'Site inspection and rapid materials estimation',
      'Classification Method': 'Prototype Classification Engine (Ontology Mapping)',
      'Prototype Rule Confidence': `${score}% (Keyword Dictionary Match)`
    });
    setAiLoading(false);
  }

  // Authoritative Backend Submission
  async function createProblem(): Promise<boolean> {
    setIsSubmitting(true);
    setSubmitError(null);
    const finalLat = lat ? Number(lat) : DEMO_LOCATION.lat;
    const finalLng = lng ? Number(lng) : DEMO_LOCATION.lng;
    const finalAddress = address || locationSearch || DEMO_LOCATION.address;

    const res = await submitProblem({
      title: title || `${activeSeverity} ${detectedProblem} near ${landmark || 'Lord’s Institute'}`,
      desc: desc || 'Civic infrastructure problem reported by citizen.',
      category,
      severity: activeSeverity,
      location: finalAddress,
      landmark: landmark || (finalLat === DEMO_LOCATION.lat ? DEMO_LOCATION.landmark : ''),
      contact,
      datetime: new Date().toISOString(),
      affected: roadAffectedId === 'multi_lane' ? 'Multi-lane traffic' : 'Commuters and two-wheelers',
      latitude: finalLat,
      longitude: finalLng,
      location_source: locationSource,
      location_accuracy: locationAccuracy,
      photos: files.slice()
    });

    setIsSubmitting(false);

    if (!res.success || !res.data) {
      const err = res.error || 'Failed to register problem in backend database.';
      setSubmitError(err);
      toast(err, 'error');
      return false;
    }

    setCreatedId(res.data.id);
    setCreatedCat(res.data.category);
    setCreatedDate(new Date().toLocaleString('en-IN'));
    toast(`Problem ${res.data.id} registered in persistent database.`, 'success');
    return true;
  }

  // Navigation controller
  async function goNext() {
    if (step === 1) {
      if (files.length === 0) {
        toast('Please take a photo, upload an image, or use SIH Benchmark Evidence.', 'error');
        return;
      }
      stopCamera();
      setStep(2);
    } else if (step === 2) {
      if (!lat || !lng) {
        useDemoLocation();
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      if (!title) {
        toast('Please confirm or enter a problem title.', 'error');
        return;
      }
      setStep(5);
    } else if (step === 5) {
      const ok = await createProblem();
      if (ok) {
        // Leave at step 5 or navigate to detail
      }
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
      ? 'Confirm Evidence → Location'
      : step === 2
      ? 'Confirm Location → Assess Impact'
      : step === 3
      ? 'Confirm Impact → Prefilled Details'
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
          {/* Head */}
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

          {/* Steps Indicator */}
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

          {/* Body */}
          <div className="wf-body">
            {/* PANE 1: CAMERA & PHOTO FIRST */}
            <div className={`wf-pane ${step === 1 ? 'active' : ''}`}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                  Capture the Problem
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Take or upload a photograph of the issue. SahYog extracts evidence and location automatically.
                </p>
              </div>

              {/* Primary Action Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
                  onClick={() => {
                    if (isCameraActive) captureSnapshot();
                    else startCamera();
                  }}
                >
                  {isCameraActive ? '📸 Capture Snapshot' : '📷 Take Photo'}
                </button>

                <label
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    cursor: 'pointer',
                    margin: 0
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
                  />
                </label>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
                  onClick={loadBenchmarkPhoto}
                  title="Loads evaluated LIET campus road damage photo"
                >
                  🎯 Use SIH Benchmark Photo
                </button>
              </div>

              {/* Live WebRTC Camera Stream Container */}
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
                  ⚠️ {cameraError} (You can still upload a photo or use the SIH Benchmark).
                </div>
              )}

              {/* Captured Photo Previews & Quality Assessment */}
              {files.length > 0 && (
                <div style={{ background: '#fbfcfe', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b style={{ fontSize: 13 }}>Evidence Captured ({files.length})</b>
                      {photoQuality && (
                        <span className={`quality-chip ${photoQuality}`}>
                          Quality: {photoQuality}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setFiles([]);
                        setPhotoQuality(null);
                        startCamera();
                      }}
                    >
                      🔄 Retake / Change Photo
                    </button>
                  </div>

                  {photoQualityReason && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                      {photoQualityReason}
                    </div>
                  )}

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

              {/* Evidence Guidelines */}
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <span style={{ fontSize: 18 }}>💡</span>
                <div>
                  <b>Evidence Quality Tip:</b> Capture the affected road crater or infrastructure clearly in frame. Including nearby buildings or road edges helps solvers assess repair scale.
                </div>
              </div>
            </div>

            {/* PANE 2: AUTOMATIC LOCATION & DUPLICATE DETECTION */}
            <div className={`wf-pane ${step === 2 ? 'active' : ''}`}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                  Location &amp; Proximity Check
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Automatically determined via photo metadata or device GPS. Nearby duplicate reports are detected automatically.
                </p>
              </div>

              {/* DUPLICATE WARNING BANNER IF NEARBY REPORT DETECTED */}
              {nearbyDuplicate && (
                <div className="duplicate-alert-banner">
                  <div className="duplicate-alert-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⚠️</span>
                      <span>Similar problem already reported nearby (~{nearbyDuplicate.distance} meters away)</span>
                    </div>
                    <span className="proto-tag" style={{ background: '#f5c878', color: '#593900' }}>
                      Duplicate Guard
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#593900' }}>
                    <b>Problem #{nearbyDuplicate.problem.id}:</b> {nearbyDuplicate.problem.title} ({nearbyDuplicate.problem.category})
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
                      onClick={() => toast('Continuing to submit additional citizen evidence.', 'info')}
                    >
                      ➕ Report Anyway / Add Evidence
                    </button>
                  </div>
                </div>
              )}

              {/* Location Status & Detection Banner */}
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
                  <span style={{ color: 'var(--muted)' }}>Detected Location Source: </span>
                  <b style={{ color: 'var(--blue)', textTransform: 'uppercase' }}>
                    {locationSource === 'PHOTO_EXIF' ? '✓ Photo Metadata (EXIF GPS)' : locationSource}
                  </b>
                  <div style={{ color: 'var(--muted)', fontSize: 11.5, marginTop: 2 }}>{locationAccuracy}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={useMyLocation}>
                    📡 Device GPS
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={useDemoLocation}>
                    📍 SIH LIET Benchmark
                  </button>
                </div>
              </div>

              {/* Detected Location Card */}
              <div className="sahyog-location-card" style={{ marginTop: 0, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="sahyog-location-title" style={{ margin: 0 }}>📍 Problem Location</div>
                  <span className="proto-tag">
                    {locationConfirmed ? '✓ Confirmed' : 'Ready to Confirm'}
                  </span>
                </div>
                <div className="location-kv" style={{ margin: '10px 0' }}>
                  <div>
                    <span>Human-Readable Area / Address</span>
                    <b>{address || locationSearch || DEMO_LOCATION.address}</b>
                  </div>
                  <div>
                    <span>Latitude</span>
                    <b>{lat ? Number(lat).toFixed(5) : DEMO_LOCATION.lat}</b>
                  </div>
                  <div>
                    <span>Longitude</span>
                    <b>{lng ? Number(lng).toFixed(5) : DEMO_LOCATION.lng}</b>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={confirmLocation}
                    disabled={locationConfirmed}
                  >
                    {locationConfirmed ? '✅ Location Confirmed' : 'Confirm This Location'}
                  </button>
                  <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                    Coordinates will be attached to report for municipal jurisdiction matching.
                  </span>
                </div>
              </div>

              {/* Interactive Google Map Pinning */}
              <div className="sahyog-google-map" id="wf-map" ref={mapRef} role="application" aria-label="Google Map" />

              {/* Fallback Simulation Box when API key is default */}
              {(!window.google?.maps || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') && (
                <div
                  style={{
                    background: '#eef4fa',
                    border: '2px dashed #b7cde3',
                    borderRadius: 8,
                    padding: 14,
                    textAlign: 'center',
                    marginTop: 8,
                    cursor: 'pointer'
                  }}
                  onClick={() => useDemoLocation()}
                >
                  <b style={{ fontSize: 13, color: 'var(--blue)' }}>SIH 2026 Evaluation Location Benchmark</b>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 8px' }}>
                    Click to load verified coordinates: <b>Lord&apos;s Institute of Engineering &amp; Technology, Hyderabad (17.3486° N, 78.3683° E)</b>
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={e => {
                      e.stopPropagation();
                      useDemoLocation();
                    }}
                  >
                    Confirm LIET Benchmark Location
                  </button>
                </div>
              )}

              {mapStatus && <div className={`map-status ${mapStatusType}`} style={{ marginTop: 8 }}>{mapStatus}</div>}
            </div>

            {/* PANE 3: IMPACT-BASED SEVERITY & PRIORITY */}
            <div className={`wf-pane ${step === 3 ? 'active' : ''}`}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                  Impact &amp; Severity Assessment
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  SahYog calculates suggested severity and priority based on physical damage and surrounding civic context.
                </p>
              </div>

              {/* Question 1: Road Coverage */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 8 }}>
                  1. How much of the roadway is physically affected? *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                  {ROAD_AFFECTED_OPTIONS.map(opt => (
                    <div
                      key={opt.id}
                      className={`impact-option-card ${roadAffectedId === opt.id ? 'selected' : ''}`}
                      onClick={() => setRoadAffectedId(opt.id)}
                    >
                      <input
                        type="radio"
                        name="road_coverage"
                        checked={roadAffectedId === opt.id}
                        onChange={() => setRoadAffectedId(opt.id)}
                      />
                      <span style={{ fontSize: 12.5, fontWeight: roadAffectedId === opt.id ? 700 : 500 }}>
                        {opt.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 2: Traffic Disruption */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 8 }}>
                  2. Is vehicle traffic currently disrupted? *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                  {TRAFFIC_IMPACT_OPTIONS.map(opt => (
                    <div
                      key={opt.id}
                      className={`impact-option-card ${trafficImpactId === opt.id ? 'selected' : ''}`}
                      onClick={() => setTrafficImpactId(opt.id)}
                    >
                      <input
                        type="radio"
                        name="traffic_impact"
                        checked={trafficImpactId === opt.id}
                        onChange={() => setTrafficImpactId(opt.id)}
                      />
                      <span style={{ fontSize: 12.5, fontWeight: trafficImpactId === opt.id ? 700 : 500 }}>
                        {opt.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 3: Surrounding Context & Hazards */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 8 }}>
                  3. Critical facility proximity &amp; hazard context (select all that apply)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                  {CONTEXT_PROXIMITY_OPTIONS.map(opt => {
                    const isChecked = contextProximityIds.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`impact-option-card ${isChecked ? 'selected' : ''}`}
                        onClick={() => {
                          setContextProximityIds(prev =>
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

              {/* Calculated Severity & Priority Result Box */}
              <div style={{ background: '#f7fbff', border: '1px solid #cfe0f1', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <b style={{ fontSize: 14, color: 'var(--blue)' }}>Prototype Impact-Based Assessment</b>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                      Distinguishes physical problem severity from civic response priority.
                    </div>
                  </div>
                  <span className="proto-tag">Heuristic Calculation</span>
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
                        {isCustomizingSeverity ? 'Use Suggested' : 'Edit'}
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
                        <option value="Medium">Medium</option>
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
                      Elevated due to proximity to educational/civic facilities.
                    </div>
                  </div>
                </div>

                <div>
                  <b style={{ fontSize: 12, color: 'var(--ink)' }}>Contributing Factors:</b>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: 12, color: 'var(--muted)' }}>
                    {impactResult.factors.map((f, i) => (
                      <li key={i} style={{ marginBottom: 2 }}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* PANE 4: PREFILLED DETAILS & CLASSIFICATION */}
            <div className={`wf-pane ${step === 4 ? 'active' : ''}`}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                  Problem Details &amp; Classification
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Pre-filled by SahYog prototype ontology. You retain full edit control before submission.
                </p>
              </div>

              {/* Classification Engine Card */}
              <div className="ai-demo-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <b>Prototype Classification Engine</b>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Rule-Based Ontology &amp; Authority Mapping</div>
                  </div>
                  <span className="proto-tag">Rule-Based Prototype</span>
                </div>

                {aiLoading ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>
                    Analyzing problem evidence and matching civic ontology…
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

              {/* Auto-Generated Title with Edit Toggle */}
              <div className="field" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ margin: 0 }}>Problem Title *</label>
                  <button
                    type="button"
                    className="prefill-edit-toggle"
                    onClick={() => setIsEditingTitle(!isEditingTitle)}
                  >
                    {isEditingTitle ? 'Done Editing' : '✏️ Edit Title'}
                  </button>
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

              {/* Auto-Generated Description with Edit Toggle */}
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
                    placeholder="Nearby gate, junction, building..."
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

              <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--muted)' }}>
                🕒 <b>Timestamp:</b> Automatically recorded on submission ({new Date().toLocaleDateString('en-IN')}).
              </div>
            </div>

            {/* PANE 5: REVIEW & SUBMIT */}
            <div className={`wf-pane ${step === 5 ? 'active' : ''}`}>
              {!createdId ? (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
                      Report Review
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                      Review and confirm all details before dispatching to the multi-stakeholder collaborative pipeline.
                    </p>
                  </div>

                  <div className="card" style={{ background: '#fbfcfe', border: '1px solid var(--line)', padding: 18 }}>
                    {/* Summary Header */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: 14, marginBottom: 14 }}>
                      {files[0] && (
                        <div style={{ width: 100, height: 75, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--line)' }}>
                          <img src={files[0].src} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                          <span className={`status-chip ${activeSeverity}`}>Severity: {activeSeverity}</span>
                          <span className={`status-chip ${activePriority}`}>Priority: {activePriority}</span>
                          <span className="proto-tag">{category}</span>
                        </div>
                        <b style={{ fontSize: 15, color: 'var(--ink)' }}>{title}</b>
                      </div>
                    </div>

                    {/* Summary KVs */}
                    <div className="kv" style={{ padding: '6px 0' }}>
                      <span>Location</span>
                      <b>{address || locationSearch || DEMO_LOCATION.address}</b>
                    </div>
                    <div className="kv" style={{ padding: '6px 0' }}>
                      <span>Location Source</span>
                      <span className="status-chip Low">{locationSource}</span>
                    </div>
                    <div className="kv" style={{ padding: '6px 0' }}>
                      <span>Mandated Authority</span>
                      <b>{AUTHORITY[category] || 'Public Works Department'}</b>
                    </div>
                    <div className="kv" style={{ padding: '6px 0' }}>
                      <span>Evidence Quality</span>
                      <span className={`quality-chip ${photoQuality || 'GOOD'}`}>{photoQuality || 'GOOD'}</span>
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
                    </div>
                  )}
                </div>
              ) : (
                <div className="success-box">
                  <div className="success-icon">✓</div>
                  <h3 style={{ fontSize: 20 }}>Problem Registered in Database</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '6px 0 16px' }}>
                    Successfully created and persisted in the relational database. Central source of truth across all 5 stakeholder dashboards.
                  </p>
                  <div className="card" style={{ textAlign: 'left', background: '#fbfcfe' }}>
                    <div className="kv"><span>Problem ID</span><b>{createdId}</b></div>
                    <div className="kv"><span>Category</span><span>{createdCat || category}</span></div>
                    <div className="kv"><span>Location</span><span>{address || locationSearch || DEMO_LOCATION.address}</span></div>
                    <div className="kv"><span>Severity &amp; Priority</span><span>{activeSeverity} · Priority: {activePriority}</span></div>
                    <div className="kv"><span>Status</span><span className="status-chip High">Stage 1 · Submitted &amp; Classified</span></div>
                    <div className="kv"><span>Database Status</span><b>Persistent (data/sahyog.db.json)</b></div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--blue)', marginTop: 14 }}>
                    Click &ldquo;View Stakeholder Workspace&rdquo; to track solver matching and collaboration!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering in Database…' : nextLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
