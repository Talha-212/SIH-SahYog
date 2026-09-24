'use client';
import { useState } from 'react';
import { useSahYog } from '@/store/useSahYog';
import { CATEGORIES, DEMO_LOCATION } from '@/lib/constants';
import type { Photo, LocationSource } from '@/lib/types';
import { toast } from '@/components/ToastStack';
import { useAuth } from '@/lib/auth/AuthContext';
import exifr from 'exifr';

export default function ReportView() {
  const { state, dispatch, submitProblem } = useSahYog();
  const auth = useAuth();
  const { selectedSeverity, uploadedPhotos, currentRole } = state;
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [affected, setAffected] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>('MANUAL_ENTRY');
  const [latlng, setLatlng] = useState('Coordinates will appear here once automatically detected or selected.');
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function requireAuthentication() {
    if (!auth.isAuthenticated) {
      window.location.href = '/login?redirect=/report';
      return false;
    }
    return true;
  }

  function useDemoLocation() {
    setLocation(DEMO_LOCATION.address);
    setLat(DEMO_LOCATION.lat);
    setLng(DEMO_LOCATION.lng);
    setLocationSource('DEMO_LOCATION');
    setLatlng(`Lat: ${DEMO_LOCATION.lat}, Lng: ${DEMO_LOCATION.lng} (Confirmed SIH Demo Location: LIET Hyderabad).`);
    toast('Jharkhand demo location loaded!', 'success');
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast('Device GPS unavailable. Falling back to benchmark location.', 'error');
      useDemoLocation();
      return;
    }
    toast('Detecting device coordinates…', 'info');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationSource('DEVICE_GPS');
        setLocation(location || `Detected Location: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
        setLatlng(`Lat: ${pos.coords.latitude.toFixed(6)}, Lng: ${pos.coords.longitude.toFixed(6)} (Device GPS API ±${Math.round(pos.coords.accuracy || 10)}m).`);
        toast('Device GPS attached to report!', 'success');
      },
      () => {
        toast('GPS permission not granted. Applying SIH Demo coordinates.', 'info');
        useDemoLocation();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function handleLocationInput(v: string) {
    setLocation(v);
    setLocationSource('MANUAL_ENTRY');
    if (v.trim()) {
      setLatlng(`Approximate area: "${v}". (Click "Detect My Location" or "Demo Location" for exact GPS coordinates).`);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const newPhotos: Photo[] = [];
    let foundExif = false;

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/');
      if (!isVideo && !file.type.startsWith('image/')) continue;
      if (file.size > 8 * 1024 * 1024) { setError(`File "${file.name}" is too large. Please keep files under 8MB.`); continue; }

      let hasExif = false;
      if (file.type.startsWith('image/')) {
        try {
          const gps = await exifr.gps(file);
          if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
            hasExif = true;
            foundExif = true;
            setLat(gps.latitude);
            setLng(gps.longitude);
            setLocationSource('PHOTO_EXIF');
            if (!location) setLocation(`Photo EXIF: ${gps.latitude.toFixed(5)}° N, ${gps.longitude.toFixed(5)}° E`);
            setLatlng(`Lat: ${gps.latitude.toFixed(6)}, Lng: ${gps.longitude.toFixed(6)} (Extracted from Photo EXIF metadata).`);
          }
        } catch {
          // EXIF reading failure is handled gracefully
        }
      }

      const reader = new FileReader();
      reader.onload = ev => {
        newPhotos.push({ src: ev.target?.result as string, isVideo, exifGpsFound: hasExif });
        dispatch({ type: 'SET_UPLOADED_PHOTOS', photos: [...uploadedPhotos, ...newPhotos] });
      };
      reader.readAsDataURL(file);
    }

    if (foundExif) {
      toast('📍 GPS coordinates extracted from photo EXIF!', 'success');
    }
  }

  function removePhoto(i: number) {
    const updated = uploadedPhotos.filter((_, idx) => idx !== i);
    dispatch({ type: 'SET_UPLOADED_PHOTOS', photos: updated });
  }

  async function submit() {
    setError('');
    if (!requireAuthentication()) return;
    if (!title) { setError('Please add a title for the problem.'); return; }
    if (!desc) { setError('Please add a description of the problem.'); return; }
    if (!location) { setError('Please select or detect a location.'); return; }
    if (!selectedSeverity) { setError('Please select a severity level.'); return; }

    setSubmitting(true);
    const res = await submitProblem({
      title,
      desc,
      category,
      location,
      affected,
      severity: selectedSeverity,
      latitude: lat ?? DEMO_LOCATION.lat,
      longitude: lng ?? DEMO_LOCATION.lng,
      location_source: locationSource,
      photos: uploadedPhotos.slice()
    });
    setSubmitting(false);

    if (!res.success || !res.data) {
      setError(res.error || 'Failed to submit problem to backend database.');
      toast(res.error || 'Submission failed. Please check backend connection.', 'error');
      return;
    }

    toast(`Problem ${res.data.id} submitted to persistent backend pipeline!`, 'success');
  }

  return (
    <div className="wrap section">
      <div className="section-title">Report a Problem</div>
      <div className="section-sub">Automatic location detection &amp; photos enable rapid solver matching and statutory civic assignment.</div>

      {/* Guided 5-step workflow banner */}
      <div className="card" style={{ background: '#f0f7ff', border: '1px solid #c8dff7', marginTop: 14, marginBottom: 18, padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <b style={{ fontSize: 13.5, color: 'var(--blue)' }}>Recommended for SIH 2026: 5-Step Guided Reporting Workflow</b>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              Interactive Photo EXIF extraction → Coordinate confirmation → Prototype Classification → Solver matching.
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { if (requireAuthentication()) dispatch({ type: 'OPEN_WORKFLOW' }); }}>
            🚀 Launch 5-Step Guided Workflow
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            {error && <div className="error-msg">{error}</div>}

            {/* 1. Evidence First */}
            <div className="field" style={{ background: '#fbfcfe', border: '1px solid var(--line)', padding: 14, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <label style={{ margin: 0, fontWeight: 700, fontSize: 13.5 }}>1. Capture / Upload Photo Evidence *</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const benchmarkSrc = '/demo/pothole_before.jpg';
                    dispatch({
                      type: 'SET_UPLOADED_PHOTOS',
                      photos: [{ src: benchmarkSrc, isVideo: false, exifGpsFound: true }]
                    });
                    useDemoLocation();
                    setTitle('Severe pothole & road damage near Lord’s Institute main gate');
                    setDesc('A pothole has been documented near the main gate. The damaged section affects vehicle movement and creates safety risks for two-wheelers.');
                    setCategory('Roads & Infrastructure');
                    dispatch({ type: 'SET_SEVERITY', sev: 'High' });
                    toast('🎯 Loaded SIH Benchmark photo and pre-filled report details!', 'success');
                  }}
                >
                  🎯 Use SIH Benchmark Photo
                </button>
              </div>

              <div
                className={`drop-zone ${drag ? 'drag' : ''}`}
                onDragEnter={e => { e.preventDefault(); setDrag(true); }}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={e => { e.preventDefault(); setDrag(false); }}
                onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
              >
                <p>Drag photos here, or click to upload from camera/storage</p>
                <div className="hl">JPEG, PNG, WebP up to 8MB · EXIF GPS automatically extracted if available</div>
                <label className="file-input-btn">
                  Choose files
                  <input type="file" accept="image/*,video/*" capture="environment" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
                </label>
                <div className="thumbs">
                  {uploadedPhotos.map((ph, i) => (
                    <div className="thumb" key={i}>
                      {ph.isVideo ? <video src={ph.src} muted /> : <img src={ph.src} alt="" />}
                      <button className="rm" onClick={() => removePhoto(i)} aria-label="Remove file">✕</button>
                      {ph.exifGpsFound && (
                        <div style={{ position: 'absolute', bottom: 2, left: 2, right: 2, background: 'rgba(23, 138, 86, 0.9)', color: '#fff', fontSize: 9, padding: '2px 4px', borderRadius: 3, textAlign: 'center' }}>
                          📍 GPS
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Location Detection */}
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label htmlFor="f-location" style={{ margin: 0, fontWeight: 700 }}>2. Problem Location &amp; Coordinates *</label>
                <span className="proto-tag" style={{ fontSize: 10 }}>Source: {locationSource}</span>
              </div>
              <div className="locate-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                <input type="text" id="f-location" placeholder="Search area or let GPS/Photo detect" value={location} onChange={e => handleLocationInput(e.target.value)} />
                <button type="button" className="btn btn-primary btn-sm" onClick={useDemoLocation}>Demo Location (LIET)</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={useCurrentLocation}>📡 Detect Device GPS</button>
              </div>
              <div className="latlng-note">{latlng}</div>
            </div>

            {/* 3. Pre-filled / Editable Problem Details */}
            <div className="field">
              <label htmlFor="f-title" style={{ fontWeight: 700 }}>3. Problem Title *</label>
              <input type="text" id="f-title" placeholder="e.g. Community water access challenge or school infrastructure gap" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="f-desc" style={{ fontWeight: 700 }}>Detailed Description *</label>
              <textarea id="f-desc" placeholder="Describe what you observed, since when, and how it's affecting the area..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>

            <div className="row-2">
              <div className="field">
                <label htmlFor="f-category">Category *</label>
                <select id="f-category" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Severity *</label>
                <div className="sev-group">
                  {['Low', 'Medium', 'High', 'Critical'].map(s => (
                    <div key={s} className={`sev-opt ${selectedSeverity === s ? 'selected' : ''}`} data-sev={s} onClick={() => dispatch({ type: 'SET_SEVERITY', sev: s })}>{s}</div>
                  ))}
                </div>
              </div>
            </div>

            <button className="btn btn-primary btn-block" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting to Backend Pipeline…' : 'Submit Problem to Pipeline'}
            </button>
          </div>
        </div>
        <div>
          <div className="card">
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
              <b>What happens after you submit</b><br /><br />
              <b>1. Persistent Record.</b> The report is created in the persistent database as the central source of truth across Citizen, Government, University, Industry, and NGO dashboards.<br /><br />
              <b>2. Classification.</b> Our classifier assigns the statutory civic authority based on problem category and keywords (<span className="proto-tag">RULE_BASED_PROTOTYPE</span>).<br /><br />
              <b>3. Geographic Solver Matching.</b> Detected coordinates match local municipal zones, university research labs, and roadwork contractors within proximity.<br /><br />
              <b>4. Closed-Loop Verification.</b> Once deployed, only the citizen reporter can sign off to mark the problem resolved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
