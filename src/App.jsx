import React from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { getReport as getReportFromBackend, submitReport as submitReportToBackend } from "./api";

const STATUSES = [
  "REPORTED",
  "VERIFIED",
  "ASSIGNED",
  "INVESTIGATING",
  "SCHEDULED",
  "RESOLVED",
];

function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link to="/" className="brand" aria-label="Fix My Street home">
          <span className="brand-mark">F</span>
          <span>Fix My Street</span>
        </Link>

        <nav aria-label="Main navigation">
          <Link className={isHome ? "nav-link active" : "nav-link"} to="/">
            Home
          </Link>
          <Link className={location.pathname.startsWith("/report") ? "nav-link active" : "nav-link"} to="/report">
            Report
          </Link>
          <Link className={location.pathname.startsWith("/track") ? "nav-link active" : "nav-link"} to="/track">
            Track
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <span>Fix My Street</span>
          <span>Making infrastructure reporting simpler for residents.</span>
        </div>
      </footer>
    </>
  );
}

function Home() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> Community infrastructure</div>
          <h1>Report a problem.<br /><span>Help fix your city.</span></h1>
          <p>
            Fix My Street makes it easy for residents to report infrastructure
            problems and follow what happens next.
          </p>

          <div className="hero-actions">
            <Link className="button button-primary" to="/report">
              Report a Problem <span aria-hidden="true">→</span>
            </Link>
            <Link className="hero-track-link" to="/track">
              Track a Report <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="trust-row" aria-label="How Fix My Street works">
            <span>📍 <strong>Location</strong></span>
            <span>📷 <strong>Photo</strong></span>
            <span>🔎 <strong>Track status</strong></span>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-top">
            <span className="mini-label">FIX MY STREET</span>
            <span className="live-pill"><span /> LIVE</span>
          </div>
          <div className="issue-preview">
            <div className="issue-icon">🕳️</div>
            <div>
              <strong>Road issue reported</strong>
              <p>Report CF-1042</p>
            </div>
          </div>
          <div className="progress-preview">
            {STATUSES.map((status, index) => (
              <div className="preview-step" key={status}>
                <span className={index <= 3 ? "preview-dot done" : "preview-dot"} />
                <span>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Report() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [description, setDescription] = useState("");
  const [locationState, setLocationState] = useState("idle");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function useLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser. You can enter the coordinates manually.");
      return;
    }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocationState("success");
      },
      () => {
        setLocationState("error");
        setError("We couldn't access your location. Please allow location access or enter the coordinates manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhoto({ file, preview: URL.createObjectURL(file) });
    setError("");
  }

  async function submitReport(event) {
    event.preventDefault();
    setError("");

    if (!photo) {
      setError("Please add a photo before submitting.");
      return;
    }
    if (!latitude || !longitude) {
      setError("Please add your location before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // The backend receives the exact fields agreed for the citizen report:
      // photo, latitude, longitude, and description.
      const report = await submitReportToBackend(
        photo.file,
        latitude,
        longitude,
        description
      );

      // The backend is the source of truth. Use its real report ID.
      navigate(`/confirmation/${report.report_id}`);
    } catch (submissionError) {
      console.error("Fix My Street report submission failed:", submissionError);
      setError(submissionError.message || "We couldn't submit your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const photoReady = Boolean(photo);
  const locationReady = Boolean(latitude && longitude);
  const descriptionReady = Boolean(description.trim());
  const completedSteps = Number(photoReady) + Number(locationReady) + Number(descriptionReady);

  return (
    <section className="page-section report-page">
      <div className="container">
        <div className="report-intro">
          <div>
            <div className="eyebrow">FIX MY STREET / NEW REPORT</div>
            <h1>Report a problem</h1>
            <p>Help your community by sharing what you found. Add a photo and location, then tell us what happened.</p>
          </div>
          <div className="report-progress" aria-label={`${completedSteps} of 3 report details completed`}>
            <div className="report-progress-top"><span>Report details</span><strong>{completedSteps}/3</strong></div>
            <div className="report-progress-bar"><span style={{ width: `${(completedSteps / 3) * 100}%` }} /></div>
          </div>
        </div>

        <form className="report-layout" onSubmit={submitReport}>
          <div className="report-main">
            <section className={`report-card report-step-card ${photoReady ? "complete" : ""}`}>
              <div className="step-heading">
                <div className="step-number">1</div>
                <div><span className="step-kicker">FIRST</span><h2>Add a photo</h2><p>A clear photo helps the team understand the problem.</p></div>
                {photoReady && <span className="step-check">✓ Added</span>}
              </div>
              <label className={`photo-dropzone ${photo ? "has-photo" : ""}`} htmlFor="photo">
                {photo ? (
                  <>
                    <img src={photo.preview} alt="Selected infrastructure problem" className="photo-preview-large" />
                    <div className="photo-change">Change photo</div>
                  </>
                ) : (
                  <div className="photo-empty">
                    <div className="camera-badge">⌁</div>
                    <strong>Take a photo or choose one</strong>
                    <span>Show the problem as clearly as possible</span>
                    <small>JPG, PNG or HEIC</small>
                  </div>
                )}
                <input id="photo" name="photo" type="file" accept="image/*" capture="environment" onChange={handlePhoto} />
              </label>
            </section>

            <section className={`report-card report-step-card ${locationReady ? "complete" : ""}`}>
              <div className="step-heading">
                <div className="step-number">2</div>
                <div><span className="step-kicker">NEXT</span><h2>Pin the location</h2><p>Tell us where the issue is so it can be found quickly.</p></div>
                {locationReady && <span className="step-check">✓ Added</span>}
              </div>

              <button type="button" className="location-button location-primary" onClick={useLocation}>
                <span className="location-pin">●</span>
                {locationState === "loading" ? "Finding your location…" : "Use my current location"}
              </button>

              {locationState === "success" && (
                <div className="location-success"><span>✓</span>Location captured successfully</div>
              )}

              <div className="location-divider"><span>or enter coordinates manually</span></div>

              <div className="coordinate-grid">
                <div className="input-group">
                  <label htmlFor="latitude">latitude</label>
                  <input id="latitude" name="latitude" value={latitude} onChange={(e) => { setLatitude(e.target.value); setLocationState("idle"); }} inputMode="decimal" placeholder="45.4215" />
                </div>
                <div className="input-group">
                  <label htmlFor="longitude">longitude</label>
                  <input id="longitude" name="longitude" value={longitude} onChange={(e) => { setLongitude(e.target.value); setLocationState("idle"); }} inputMode="decimal" placeholder="-75.6972" />
                </div>
              </div>
            </section>

            <section className={`report-card report-step-card ${descriptionReady ? "complete" : ""}`}>
              <div className="step-heading">
                <div className="step-number">3</div>
                <div><span className="step-kicker">OPTIONAL</span><h2>Describe what you noticed</h2><p>A few words can give useful context to your report.</p></div>
                {descriptionReady && <span className="step-check">✓ Added</span>}
              </div>

              <textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Example: Large pothole near the crosswalk. It is difficult for cyclists to avoid." rows="5" maxLength="500" />
              <div className="character-count">{description.length}/500</div>
            </section>

            {error && <div className="error-box report-error" role="alert">⚠ {error}</div>}

            <button
              className="button button-primary submit-button report-submit"
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              <span>{isSubmitting ? "Submitting report…" : "Submit Report"}</span>
              <span className="submit-arrow" aria-hidden="true">→</span>
            </button>

            <p className="privacy-note">Your report will start as <strong>REPORTED</strong> and can be tracked using its report ID.</p>
          </div>

          <aside className="report-summary">
            <div className="summary-card">
              <div className="summary-header"><span className="eyebrow">YOUR REPORT</span><span className="summary-live">LIVE</span></div>
              <h3>Ready to submit?</h3>
              <p className="summary-copy">We'll use the information below to create your report.</p>

              <div className="summary-item">
                <span className={`summary-icon ${photoReady ? "ready" : ""}`}>▣</span>
                <div><strong>Photo</strong><span>{photoReady ? "Photo added" : "Waiting for photo"}</span></div>
                {photoReady && <b>✓</b>}
              </div>
              <div className="summary-item">
                <span className={`summary-icon ${locationReady ? "ready" : ""}`}>●</span>
                <div><strong>Location</strong><span>{locationReady ? "Location added" : "Waiting for location"}</span></div>
                {locationReady && <b>✓</b>}
              </div>
              <div className="summary-item">
                <span className={`summary-icon ${descriptionReady ? "ready" : ""}`}>≡</span>
                <div><strong>Description</strong><span>{descriptionReady ? "Description added" : "Optional"}</span></div>
                {descriptionReady && <b>✓</b>}
              </div>

              <div className="summary-note"><span>✓</span><p>After submitting, you'll receive a unique report ID that you can use to track progress.</p></div>
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}

function Confirmation() {
  const { report_id } = useParams();

  return (
    <section className="page-section">
      <div className="container narrow">
        <div className="confirmation-card">
          <div className="success-circle">✓</div>
          <div className="eyebrow">FIX MY STREET / CONFIRMATION</div>
          <h1>Report Submitted</h1>
          <p>Your report has been received. Keep your report ID to check its status.</p>

          <div className="report-id-box">
            <span>Report ID</span>
            <strong>{report_id}</strong>
          </div>

          <div className="confirmation-actions">
            <Link className="button button-primary" to={`/track/${report_id}`}>
              View Report
            </Link>
            <Link className="button button-secondary" to="/report">
              Report Another Problem
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrackSearch() {
  const navigate = useNavigate();
  const [report_id, setReportId] = useState("");

  function submit(event) {
    event.preventDefault();
    if (report_id.trim()) navigate(`/track/${report_id.trim().toUpperCase()}`);
  }

  return (
    <section className="page-section">
      <div className="container narrow">
        <div className="page-heading">
          <div className="eyebrow">FIX MY STREET / TRACK</div>
          <h1>Track a Report</h1>
          <p>Enter your report ID to see its current status and timeline.</p>
        </div>

        <form className="track-search" onSubmit={submit}>
          <label htmlFor="report_id">report_id</label>
          <div className="search-row">
            <input
              id="report_id"
              value={report_id}
              onChange={(e) => setReportId(e.target.value)}
              placeholder="6"
            />
            <button className="button button-primary" type="submit">View Report</button>
          </div>
        </form>


      </div>
    </section>
  );
}

function Tracking() {
  const { report_id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setError("");
      setReport(null);

      try {
        const data = await getReportFromBackend(report_id);
        if (!cancelled) setReport(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "We couldn't retrieve this report.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [report_id]);

  if (loading) {
    return (
      <section className="page-section">
        <div className="container narrow">
          <div className="not-found">
            <div className="loading-spinner" aria-hidden="true" />
            <h1>Loading report</h1>
            <p>Checking the latest status for report <strong>{report_id}</strong>…</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !report) {
    return (
      <section className="page-section">
        <div className="container narrow">
          <div className="not-found">
            <div className="error-icon">?</div>
            <h1>Report not found</h1>
            <p>{error || `We couldn't find report ${report_id}.`}</p>
            <Link className="button button-primary" to="/track">Try another report</Link>
          </div>
        </div>
      </section>
    );
  }

  const currentIndex = STATUSES.indexOf(report.status);

  return (
    <section className="page-section">
      <div className="container">
        <div className="tracking-header">
          <div>
            <div className="eyebrow">FIX MY STREET / REPORT</div>
            <h1>{report.report_id}</h1>
          </div>
          <span className={`status-badge status-${report.status.toLowerCase()}`}>{report.status}</span>
        </div>

        <div className="tracking-grid">
          <div className="timeline-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">STATUS</span>
                <h2>Report progress</h2>
              </div>
            </div>

            <div className="timeline" aria-label="Report status timeline">
              {STATUSES.map((status, index) => {
                const done = index <= currentIndex;
                const active = index === currentIndex;
                const history = report.status_history?.find((item) => item.status === status);

                return (
                  <div className={`timeline-item ${done ? "done" : ""} ${active ? "active" : ""}`} key={status}>
                    <div className="timeline-marker">
                      {done ? "✓" : ""}
                    </div>
                    <div className="timeline-content">
                      <strong>{status}</strong>
                      {history && <span>{formatDate(history.timestamp)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="details-card">
            <div className="card-heading">
              <span className="eyebrow">REPORT INFORMATION</span>
              <h2>Details</h2>
            </div>

            <Detail label="report_id" value={report.report_id} mono />
            <Detail label="category" value={report.category} />
            <Detail label="severity" value={report.severity} />
            <Detail label="department" value={report.department} />
            <Detail label="status" value={report.status} />
            <Detail label="created_at" value={formatDate(report.created_at)} />
          </div>
        </div>

        <div className="bottom-actions">
          <Link className="button button-secondary" to="/track">Track another report</Link>
          <Link className="button button-primary" to="/report">Report a problem</Link>
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value, mono }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong className={mono ? "mono" : ""}>{value || "—"}</strong>
    </div>
  );
}

function QRPage() {
  return (
    <section className="qr-entry">
      <div className="qr-panel">
        <div className="brand centered">
          <span className="brand-mark">F</span>
          <span>Fix My Street</span>
        </div>
        <div className="qr-symbol">▦</div>
        <div className="eyebrow">FIX MY STREET / QUICK REPORT</div>
        <h1>See a problem?<br />Report it here.</h1>
        <p>Use this page from a Fix My Street QR code placed near infrastructure that needs attention.</p>
        <Link className="button button-primary full-width" to="/report">
          Report a Problem <span aria-hidden="true">→</span>
        </Link>
        <Link className="qr-track-link" to="/track">Already have a report ID? Track it.</Link>
      </div>
    </section>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} />
        <Route path="/confirmation/:report_id" element={<Confirmation />} />
        <Route path="/track" element={<TrackSearch />} />
        <Route path="/track/:report_id" element={<Tracking />} />
        <Route path="/qr" element={<QRPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}