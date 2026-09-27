import React from "react";







import { useEffect, useState } from "react";







import {







  Link,







  Navigate,







  Route,







  Routes,







  useLocation,







  useNavigate,







  useParams,







} from "react-router-dom";










function formatLabel(value) {
  if (!value) return "—";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDuration(ms) {
  if (ms == null) {
    return "Not enough data yet";
  }

  const totalMinutes = Math.round(ms / (1000 * 60));

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    if (hours === 0) {
      return `${days} day${days === 1 ? "" : "s"}`;
    }

    return `${days} day${days === 1 ? "" : "s"} ${hours} hr${hours === 1 ? "" : "s"}`;
  }

  if (hours > 0) {
    if (minutes === 0) {
      return `${hours} hr${hours === 1 ? "" : "s"}`;
    }

    return `${hours} hr${hours === 1 ? "" : "s"} ${minutes} min`;
  }

  return `${minutes} min`;
}




import {







  getReport as getReportFromBackend,







  submitReport as submitReportToBackend,







} from "./api";























































/* =========================================================







   REPORT STATUSES







   ========================================================= */















const STATUSES = [







  "REPORTED",







  "VERIFIED",







  "ASSIGNED",







  "INVESTIGATING",







  "SCHEDULED",







  "RESOLVED",







];















import {







  APIProvider,







  Map,







  AdvancedMarker,







  useMap,







  useMapsLibrary,







} from "@vis.gl/react-google-maps";















/* =========================================================







   HEADER







   ========================================================= */















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















          <Link







            className={isHome ? "nav-link active" : "nav-link"}







            to="/"







          >







            Home







          </Link>















          <Link







            className={







              location.pathname.startsWith("/report")







                ? "nav-link active"







                : "nav-link"







            }







            to="/report"







          >







            Report







          </Link>















          <Link







            className={







              location.pathname.startsWith("/track")







                ? "nav-link active"







                : "nav-link"







            }







            to="/track"







          >







            Track







          </Link>















        </nav>















      </div>







    </header>







  );







}























/* =========================================================







   LAYOUT







   ========================================================= */















function Layout({ children }) {







  return (







    <>







      <Header />















      <main>{children}</main>















      <footer className="site-footer">







        <div className="container footer-inner">







          <span>Fix My Street</span>







          <span>







            Making infrastructure reporting simpler for residents.







          </span>







        </div>







      </footer>







    </>







  );







}























/* =========================================================







   HOME







   ========================================================= */















function Home() {

  const [nearbyReports, setNearbyReports] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  async function findNearbyIssues() {
    setNearbyError("");
    setNearbyLoading(true);

    if (!navigator.geolocation) {
      setNearbyError("Location is not supported by this browser.");
      setNearbyLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setUserLocation({
            lat,
            lng
          });

          const response = await fetch(
            `http://localhost:5000/api/reports/nearby?lat=${lat}&lng=${lng}&radius=1000`
          );

          if (!response.ok) {
            throw new Error("Could not load nearby issues.");
          }

          const data = await response.json();

          setNearbyReports(data.reports || []);
        } catch (error) {
          console.error("Nearby issues error:", error);
          setNearbyError(
            "We couldn't load nearby issues. Please try again."
          );
        } finally {
          setNearbyLoading(false);
        }
      },

      () => {
        setNearbyError(
          "We couldn't access your location. Please allow location access and try again."
        );
        setNearbyLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  return (



    <>


      <section className="hero">















        <div className="container hero-grid">















          <div className="hero-copy">















            <div className="eyebrow">







              <span className="status-dot" /> Community infrastructure







            </div>















            <h1>







              Report a problem.







              <br />







              <span>Help fix your city.</span>







            </h1>















            <p>







              Fix My Street makes it easy for residents to report







              infrastructure problems and follow what happens next.







            </p>















            <div className="hero-actions">















              <Link className="button button-primary" to="/report">







                Report a Problem <span aria-hidden="true"></span>







              </Link>















              <Link className="hero-track-link" to="/track">







                Track a Report <span aria-hidden="true"></span>







              </Link>


              <button
                type="button"
                className="hero-track-link nearby-link"
                onClick={findNearbyIssues}
                disabled={nearbyLoading}
              >
                <span className="nearby-button-icon"></span>
                {nearbyLoading
                  ? "Finding nearby issues…"
                  : "Issues Near You"}
                   {!nearbyLoading && (
    <span aria-hidden="true"></span>
  )}
              </button>















            </div>












          </div>























          <div className="hero-card">















            <div className="card-top">







              <span className="mini-label">FIX MY STREET</span>















              <span className="live-pill">







                <span /> LIVE







              </span>







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















                  <span







                    className={







                      index <= 3







                        ? "preview-dot done"







                        : "preview-dot"







                    }







                  />















                  <span>{status}</span>















                </div>















              ))}















            </div>















          </div>















        </div>















      </section>

      <section
        style={{
          padding: "50px 0",
          background: "#ffffff"
        }}
      >
        <div className="container">

          <div style={{ marginBottom: "24px" }}>
            <div className="eyebrow">
              📍 LIVE COMMUNITY REPORTS
            </div>

            <h2 style={{ marginBottom: "8px" }}>
              Issues Near You
            </h2>

            <p style={{ color: "#64748b" }}>
              See infrastructure problems already reported nearby
              before submitting another report.
            </p>
          </div>

          {nearbyError && (
            <div className="error-box">
              ⚠ {nearbyError}
            </div>
          )}

          {userLocation && nearbyReports.length === 0 && !nearbyLoading && (
            <p>No active issues were found within 1 km.</p>
          )}

          {nearbyReports.length > 0 && userLocation && (
            <NearbyIssuesMap
              userLocation={userLocation}
              reports={nearbyReports}
            />
          )}

          {nearbyReports.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px"
              }}
            >
              {nearbyReports.map((report) => (
                <div
                  key={report.report_id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "20px",
                    background: "#ffffff"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "12px"
                    }}
                  >
                    <strong>
                      {formatLabel(report.category)}
                    </strong>

                    <span>
                      {report.status}
                    </span>
                  </div>

                  <div style={{ color: "#64748b" }}>
                    📍 {Math.round(report.distance_meters)} m away
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      color: "#64748b"
                    }}
                  >
                    👥 {report.community_report_count}{" "}
                    {report.community_report_count === 1
                      ? "community report"
                      : "community reports"}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </section>

    </>




  );







}























/* =========================================================







   GOOGLE MAP COMPONENTS







   ========================================================= */













function NearbyIssuesMap({ userLocation, reports }) {

  if (!userLocation) {
    return null;
  }

  const center = {
    lat: Number(userLocation.lat),
    lng: Number(userLocation.lng)
  };

  return (
    <div
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        marginBottom: "24px"
      }}
    >
      <Map
        defaultCenter={center}
        defaultZoom={16}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        style={{
          width: "100%",
          height: "100%"
        }}
      >

        {/* Citizen's location */}
        <AdvancedMarker position={center}>
          <div
            style={{
              background: "#2563eb",
              border: "3px solid white",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
            title="Your location"
          />
        </AdvancedMarker>

        {/* Nearby reported issues */}
        {reports.map((report) => (
          <AdvancedMarker
            key={report.report_id}
            position={{
              lat: Number(report.latitude),
              lng: Number(report.longitude)
            }}
          >
            <div
              style={{
                background: "white",
                border: "2px solid #0f6cbd",
                borderRadius: "20px",
                padding: "5px 9px",
                fontSize: "12px",
                fontWeight: "700",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap"
              }}
              title={formatLabel(report.category)}
            >
              {formatLabel(report.category)} · {report.community_report_count}            </div>
          </AdvancedMarker>
        ))}

      </Map>
    </div>
  );
}

function GoogleMapController({ latitude, longitude }) {







  const map = useMap();















  useEffect(() => {







    if (!map || !latitude || !longitude) return;















    const lat = Number(latitude);







    const lng = Number(longitude);















    if (Number.isNaN(lat) || Number.isNaN(lng)) return;















    map.panTo({ lat, lng });







    map.setZoom(17);







  }, [map, latitude, longitude]);















  return null;







}























function AddressSearch({ onLocationSelect }) {

  const places = useMapsLibrary("places");

  const [searchError, setSearchError] = useState("");



  useEffect(() => {

    if (!places) return;



    const container = document.getElementById(

      "google-address-search-container"

    );



    if (!container) return;



    container.innerHTML = "";



    const autocomplete =

      new places.PlaceAutocompleteElement();



    autocomplete.placeholder =

      "e.g. Bank St & Somerset St W, Ottawa";



    // Keep results focused on Canada.

    autocomplete.includedRegionCodes = ["ca"];



    autocomplete.style.width = "100%";

    autocomplete.style.colorScheme = "light";

    autocomplete.style.backgroundColor = "#ffffff";

    autocomplete.style.color = "#102a43";

    autocomplete.style.border = "1px solid #cbd5e1";

    autocomplete.style.borderRadius = "10px";

    autocomplete.style.fontFamily = "inherit";

    autocomplete.style.fontSize = "16px";

    autocomplete.style.boxShadow =

      "0 8px 24px rgba(15, 42, 67, 0.10)";



    const handlePlaceSelect = async (event) => {

      try {

        const placePrediction = event.placePrediction;



        if (!placePrediction) {

          setSearchError(

            "We couldn't find that location. Try another address or intersection."

          );

          return;

        }



        const place = placePrediction.toPlace();



        await place.fetchFields({

          fields: [

            "displayName",

            "formattedAddress",

            "location",

          ],

        });



        if (!place.location) {

          setSearchError(

            "We couldn't find that location. Try another address or intersection."

          );

          return;

        }



        const lat = place.location.lat();

        const lng = place.location.lng();



        const address =

          place.formattedAddress ||

          place.displayName ||

          "Selected location";



        setSearchError("");



        onLocationSelect(

          lat.toFixed(6),

          lng.toFixed(6),

          address

        );

      } catch (placeError) {

        console.error(

          "Google Places selection failed:",

          placeError

        );



        setSearchError(

          "We couldn't load that location. Please try again."

        );

      }

    };



    autocomplete.addEventListener(

      "gmp-select",

      handlePlaceSelect

    );



    container.appendChild(autocomplete);



    return () => {

      autocomplete.removeEventListener(

        "gmp-select",

        handlePlaceSelect

      );



      if (container.contains(autocomplete)) {

        container.removeChild(autocomplete);

      }

    };

  }, [places, onLocationSelect]);



  return (

    <div style={{ marginBottom: "16px" }}>

      <label

        htmlFor="google-address-search-container"

        style={{

          display: "block",

          fontWeight: "700",

          marginBottom: "8px",

          color: "#102a43",

        }}

      >

        Search address or intersection

      </label>



      <div

        id="google-address-search-container"

        style={{

          width: "100%",

        }}

      />



      {searchError && (

        <p

          style={{

            color: "#b91c1c",

            marginTop: "8px",

            marginBottom: "0",

            fontSize: "14px",

          }}

        >

          {searchError}

        </p>

      )}

    </div>

  );

}







function LocationMap({







  latitude,







  longitude,







  onLocationChange,







}) {







  const hasLocation =







    latitude !== "" &&







    longitude !== "" &&







    !Number.isNaN(Number(latitude)) &&







    !Number.isNaN(Number(longitude));















  const position = hasLocation







    ? {







      lat: Number(latitude),







      lng: Number(longitude),







    }







    : null;















  const defaultCenter = {







    lat: 45.4215,







    lng: -75.6972,







  };















  function handleMapClick(event) {







    const lat = event.detail?.latLng?.lat;







    const lng = event.detail?.latLng?.lng;















    if (typeof lat !== "number" ||







      typeof lng !== "number") {







      return;







    }















    onLocationChange(







      lat.toFixed(6),







      lng.toFixed(6)







    );







  }















  function handleMarkerDrag(event) {







    const lat = event.latLng?.lat();







    const lng = event.latLng?.lng();















    if (typeof lat !== "number" ||







      typeof lng !== "number") {







      return;







    }















    onLocationChange(







      lat.toFixed(6),







      lng.toFixed(6)







    );







  }















  return (







    <div







      style={{







        height: "350px",







        width: "100%",







        borderRadius: "16px",







        overflow: "hidden",







        border: "1px solid #dbe2ea",







      }}







    >







      <Map







        defaultCenter={defaultCenter}







        defaultZoom={12}







        mapId="DEMO_MAP_ID"







        gestureHandling="greedy"







        disableDefaultUI={false}







        onClick={handleMapClick}







        style={{







          width: "100%",







          height: "100%",







        }}







      >







        <GoogleMapController







          latitude={latitude}







          longitude={longitude}







        />















        {position && (







          <AdvancedMarker







            position={position}







            draggable







            onDragEnd={handleMarkerDrag}







          />







        )}







      </Map>







    </div>







  );







}























/* =========================================================







   REPORT PAGE







   ========================================================= */















function Report() {















  const navigate = useNavigate();















  const [photo, setPhoto] = useState(null);















  const [latitude, setLatitude] = useState("");















  const [longitude, setLongitude] = useState("");







  const [selectedAddress, setSelectedAddress] = useState("");















  const [description, setDescription] =







    useState("");















  const [locationState, setLocationState] =







    useState("idle");















  const [error, setError] = useState("");















  const [isSubmitting, setIsSubmitting] =







    useState(false);























  /* ---------------------------------------------------------







     GPS LOCATION







     --------------------------------------------------------- */















  function useCurrentLocation() {















    setError("");















    if (!navigator.geolocation) {















      setError(







        "Location is not supported by this browser. Please choose the location on the map."







      );















      return;







    }























    setLocationState("loading");























    navigator.geolocation.getCurrentPosition(















      (position) => {















        const lat =







          position.coords.latitude.toFixed(6);















        const lng =







          position.coords.longitude.toFixed(6);























        setLatitude(lat);















        setLongitude(lng);



        setSelectedAddress("");















        setLocationState("success");















      },























      () => {















        setLocationState("error");















        setError(







          "We couldn't access your location. Please choose the location on the map instead."







        );















      },























      {







        enableHighAccuracy: true,







        timeout: 10000,







      }















    );







  }























  /* ---------------------------------------------------------







     MAP LOCATION







     --------------------------------------------------------- */















  function handleMapLocationChange(lat, lng) {



    setLatitude(lat);



    setLongitude(lng);



    setSelectedAddress("");



    setLocationState("success");



    setError("");



  }







  function handleAddressLocationChange(lat, lng, address) {



    setLatitude(lat);



    setLongitude(lng);



    setSelectedAddress(address);



    setLocationState("success");



    setError("");



  }























  /* ---------------------------------------------------------







     PHOTO







     --------------------------------------------------------- */















  function handlePhoto(event) {















    const file = event.target.files?.[0];















    if (!file) return;























    setPhoto({







      file,







      preview: URL.createObjectURL(file),







    });















    setError("");







  }























  /* ---------------------------------------------------------







     SUBMIT REPORT







     --------------------------------------------------------- */















  async function submitReport(event) {















    event.preventDefault();















    setError("");























    if (!photo) {















      setError(







        "Please add a photo before submitting."







      );















      return;







    }























    if (!latitude || !longitude) {















      setError(







        "Please choose the issue location before submitting."







      );















      return;







    }























    setIsSubmitting(true);























    try {















      /*







        Backend API remains unchanged.















        It still receives:















        photo







        latitude







        longitude







        description







      */















      const report =







        await submitReportToBackend(







          photo.file,







          latitude,







          longitude,







          description







        );























      navigate(
        `/confirmation/${report.report_id}`,
        { state: { report } }
      );















    } catch (submissionError) {















      console.error(







        "Fix My Street report submission failed:",







        submissionError







      );























      setError(







        submissionError.message ||







        "We couldn't submit your report. Please try again."







      );















    } finally {















      setIsSubmitting(false);















    }







  }























  const photoReady = Boolean(photo);















  const locationReady =







    Boolean(latitude && longitude);















  const descriptionReady =







    Boolean(description.trim());























  const completedSteps =







    Number(photoReady) +







    Number(locationReady) +







    Number(descriptionReady);























  return (















    <section className="page-section report-page">















      <div className="container">























        {/* PAGE HEADER */}















        <div className="report-intro">















          <div>















            <div className="eyebrow">







              FIX MY STREET / NEW REPORT







            </div>















            <h1>Report a problem</h1>















            <p>







              Help your community by sharing what







              you found. Add a photo and location,







              then tell us what happened.







            </p>















          </div>























          <div







            className="report-progress"







            aria-label={`${completedSteps} of 3 report details completed`}







          >















            <div className="report-progress-top">















              <span>Report details</span>















              <strong>







                {completedSteps}/3







              </strong>















            </div>























            <div className="report-progress-bar">















              <span







                style={{







                  width:







                    `${(completedSteps / 3) * 100}%`,







                }}







              />















            </div>















          </div>















        </div>































        <form







          className="report-layout"







          onSubmit={submitReport}







        >















          <div className="report-main">























            {/* =================================================







                STEP 1 — PHOTO







               ================================================= */}















            <section







              className={`report-card report-step-card ${photoReady ? "complete" : ""







                }`}







            >















              <div className="step-heading">















                <div className="step-number">







                  1







                </div>















                <div>















                  <span className="step-kicker">







                    FIRST







                  </span>















                  <h2>Add a photo</h2>















                  <p>







                    A clear photo helps the team







                    understand the problem.







                  </p>















                </div>























                {photoReady && (















                  <span className="step-check">







                    ✓ Added







                  </span>















                )}















              </div>























              <label







                className={`photo-dropzone ${photo ? "has-photo" : ""







                  }`}







                htmlFor="photo"







              >















                {photo ? (















                  <>















                    <img







                      src={photo.preview}







                      alt="Selected infrastructure problem"







                      className="photo-preview-large"







                    />















                    <div className="photo-change">







                      Change photo







                    </div>















                  </>















                ) : (















                  <div className="photo-empty">















                    <div className="camera-badge">







                      ⌁







                    </div>















                    <strong>







                      Take a photo or choose one







                    </strong>















                    <span>







                      Show the problem as clearly







                      as possible







                    </span>















                    <small>







                      JPG, PNG or HEIC







                    </small>















                  </div>















                )}























                <input







                  id="photo"







                  name="photo"







                  type="file"







                  accept="image/*"







                  capture="environment"







                  onChange={handlePhoto}







                />















              </label>















            </section>































            {/* =================================================







                STEP 2 — LOCATION







               ================================================= */}















            <section







              className={`report-card report-step-card ${locationReady ? "complete" : ""







                }`}







            >















              <div className="step-heading">















                <div className="step-number">







                  2







                </div>















                <div>















                  <span className="step-kicker">







                    NEXT







                  </span>















                  <h2>Pin the location</h2>















                  <p>







                    Tell us where the issue is so







                    it can be found quickly.







                  </p>















                </div>























                {locationReady && (















                  <span className="step-check">







                    ✓ Added







                  </span>















                )}















              </div>































              {/* GPS BUTTON */}















              <button







                type="button"







                className="location-button location-primary"







                onClick={useCurrentLocation}







                disabled={







                  locationState === "loading"







                }







              >















                <span className="location-pin">







                  ●







                </span>















                {locationState === "loading"







                  ? "Finding your location…"







                  : "Use my current location"}















              </button>































              <div className="location-divider">



                <span>or search for an address / intersection</span>



              </div>







              <AddressSearch



                onLocationSelect={handleAddressLocationChange}



              />







              <div className="location-divider">



                <span>or choose the exact location on the map</span>



              </div>































              {/* MAP */}















              <LocationMap







                latitude={latitude}







                longitude={longitude}







                onLocationChange={







                  handleMapLocationChange







                }







              />































              <p







                style={{







                  marginTop: "12px",







                  marginBottom: "0",







                  fontSize: "14px",







                  color: "#64748b",







                  lineHeight: "1.5",







                }}







              >







                Click the map to place the pin.







                You can also drag the pin to adjust







                the exact location.







              </p>































              {/* LOCATION SELECTED */}















              {locationReady && (















                <div







                  className="location-success"







                  style={{







                    marginTop: "14px",







                  }}







                >















                  <span>✓</span>















                  {selectedAddress || "Location selected"}















                </div>















              )}















            </section>































            {/* =================================================







                STEP 3 — DESCRIPTION







               ================================================= */}















            <section







              className={`report-card report-step-card ${descriptionReady







                ? "complete"







                : ""







                }`}







            >















              <div className="step-heading">















                <div className="step-number">







                  3







                </div>















                <div>















                  <span className="step-kicker">







                    OPTIONAL







                  </span>















                  <h2>







                    Describe what you noticed







                  </h2>















                  <p>







                    A few words can give useful







                    context to your report.







                  </p>















                </div>























                {descriptionReady && (















                  <span className="step-check">







                    ✓ Added







                  </span>















                )}















              </div>























              <textarea







                id="description"







                name="description"







                value={description}







                onChange={(event) =>







                  setDescription(







                    event.target.value







                  )







                }







                placeholder="Example: Large pothole near the crosswalk. It is difficult for cyclists to avoid."







                rows="5"







                maxLength="500"







              />























              <div className="character-count">







                {description.length}/500







              </div>















            </section>































            {/* ERROR */}















            {error && (















              <div







                className="error-box report-error"







                role="alert"







              >







                ⚠ {error}







              </div>















            )}































            {/* SUBMIT */}















            <button







              className="button button-primary submit-button report-submit"







              type="submit"







              disabled={isSubmitting}







              aria-busy={isSubmitting}







            >















              <span>















                {isSubmitting







                  ? "Submitting report…"







                  : "Submit Report"}















              </span>















              <span







                className="submit-arrow"







                aria-hidden="true"







              >







              







              </span>















            </button>























            <p className="privacy-note">















              Your report will start as{" "}















              <strong>







                REPORTED







              </strong>{" "}















              and can be tracked using its







              report ID.















            </p>















          </div>































          {/* =================================================







              SUMMARY







             ================================================= */}















          <aside className="report-summary">















            <div className="summary-card">















              <div className="summary-header">















                <span className="eyebrow">







                  YOUR REPORT







                </span>















                <span className="summary-live">







                  LIVE







                </span>















              </div>























              <h3>







                Ready to submit?







              </h3>























              <p className="summary-copy">















                We'll use the information below







                to create your report.















              </p>































              {/* PHOTO */}















              <div className="summary-item">















                <span







                  className={`summary-icon ${photoReady ? "ready" : ""







                    }`}







                >







                  ▣







                </span>















                <div>















                  <strong>







                    Photo







                  </strong>















                  <span>















                    {photoReady







                      ? "Photo added"







                      : "Waiting for photo"}















                  </span>















                </div>















                {photoReady && <b>✓</b>}















              </div>































              {/* LOCATION */}















              <div className="summary-item">















                <span







                  className={`summary-icon ${locationReady







                    ? "ready"







                    : ""







                    }`}







                >







                  ●







                </span>















                <div>















                  <strong>







                    Location







                  </strong>















                  <span>















                    {locationReady ? selectedAddress || "Location selected" : "Waiting for location"}















                  </span>















                </div>















                {locationReady && <b>✓</b>}















              </div>































              {/* DESCRIPTION */}















              <div className="summary-item">















                <span







                  className={`summary-icon ${descriptionReady







                    ? "ready"







                    : ""







                    }`}







                >







                  ≡







                </span>















                <div>















                  <strong>







                    Description







                  </strong>















                  <span>















                    {descriptionReady







                      ? "Description added"







                      : "Optional"}















                  </span>















                </div>















                {descriptionReady && <b>✓</b>}















              </div>































              <div className="summary-note">















                <span>✓</span>















                <p>







                  After submitting, you'll receive







                  a unique report ID that you can







                  use to track progress.







                </p>















              </div>















            </div>















          </aside>















        </form>















      </div>















    </section>







  );







}























/* =========================================================







   CONFIRMATION







   ========================================================= */















function Confirmation() {
  const { report_id } = useParams();
  const location = useLocation();

  const [report, setReport] = useState(location.state?.report || null);
  const [loadingReport, setLoadingReport] = useState(!location.state?.report);

  useEffect(() => {
    if (report) return;

    let cancelled = false;

    async function loadReport() {
      try {
        const data = await getReportFromBackend(report_id);
        if (!cancelled) setReport(data);
      } catch (loadError) {
        console.error("Could not load confirmation safety details:", loadError);
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [report, report_id]);

  const severity = String(report?.severity || "").toLowerCase();
  const category = String(report?.category || "").toLowerCase();

  const isPriorityHazard =
    Boolean(report?.safety_risk) &&
    ["high", "critical"].includes(severity);

  const isElectricalHazard =
    ["downed_or_hanging_wire", "damaged_utility_pole"].includes(category);

  return (
    <section className="page-section">
      <div className="container narrow">
        <div className="confirmation-card">
          <div className="success-circle">✓</div>

          <div className="eyebrow">
            FIX MY STREET / CONFIRMATION
          </div>

          <h1>Report Submitted</h1>

          <p>
            Your report has been received. Keep your report ID to check its status.
          </p>

          {isPriorityHazard && (
            <div
              role="alert"
              style={{
                margin: "22px 0",
                padding: "18px 20px",
                borderRadius: "14px",
                border: "1px solid #fecaca",
                background: "#fff7f7",
                color: "#991b1b",
                textAlign: "left",
                lineHeight: "1.5",
              }}
            >
              <strong style={{ display: "block", fontSize: "17px" }}>
                ⚠ Potential safety hazard detected
              </strong>

              <div style={{ marginTop: "6px", fontSize: "14px" }}>
                {isElectricalHazard
                  ? "A downed or damaged electrical/utility hazard may be present. Keep a safe distance and do not touch the wire, pole, or nearby objects."
                  : "This report was flagged for priority municipal review. Keep a safe distance from the hazard."}
              </div>

              <div style={{ marginTop: "8px", fontSize: "14px", fontWeight: "600" }}>
                If there is an immediate threat to life or safety, contact emergency services.
              </div>
            </div>
          )}

          {!report && loadingReport && (
            <p style={{ fontSize: "14px", color: "#64748b" }}>
              Checking report safety details…
            </p>
          )}

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


/* =========================================================







   TRACK SEARCH







   ========================================================= */















function TrackSearch() {















  const navigate = useNavigate();















  const [report_id, setReportId] =







    useState("");























  function submit(event) {















    event.preventDefault();















    if (report_id.trim()) {















      navigate(







        `/track/${report_id







          .trim()







          .toUpperCase()}`







      );















    }







  }























  return (















    <section className="page-section">















      <div className="container narrow">















        <div className="page-heading">















          <div className="eyebrow">







            FIX MY STREET / TRACK







          </div>















          <h1>







            Track a Report







          </h1>















          <p>







            Enter your report ID to see its







            current status and timeline.







          </p>















        </div>























        <form







          className="track-search"







          onSubmit={submit}







        >















          <label htmlFor="report_id">







            Report ID







          </label>























          <div className="search-row">















            <input







              id="report_id"







              value={report_id}







              onChange={(event) =>







                setReportId(







                  event.target.value







                )







              }







              placeholder="6"







            />















            <button







              className="button button-primary"







              type="submit"







            >







              View Report







            </button>















          </div>















        </form>















      </div>















    </section>







  );







}























/* =========================================================







   TRACKING PAGE







   ========================================================= */















function Tracking() {















  const { report_id } = useParams();















  const [report, setReport] =







    useState(null);















  const [loading, setLoading] =







    useState(true);















  const [error, setError] =







    useState("");























  useEffect(() => {















    let cancelled = false;























    async function loadReport() {















      setLoading(true);















      setError("");















      setReport(null);























      try {















        const data =







          await getReportFromBackend(







            report_id







          );























        if (!cancelled) {















          setReport(data);















        }















      } catch (loadError) {















        if (!cancelled) {















          setError(







            loadError.message ||







            "We couldn't retrieve this report."







          );















        }















      } finally {















        if (!cancelled) {















          setLoading(false);















        }















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















            <div







              className="loading-spinner"







              aria-hidden="true"







            />















            <h1>







              Loading report







            </h1>















            <p>







              Checking the latest status for report{" "}







              <strong>







                {report_id}







              </strong>







              …







            </p>















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















            <div className="error-icon">







              ?







            </div>















            <h1>







              Report not found







            </h1>















            <p>







              {error ||







                `We couldn't find report ${report_id}.`}







            </p>















            <Link







              className="button button-primary"







              to="/track"







            >







              Try another report







            </Link>















          </div>















        </div>















      </section>







    );







  }































  const currentIndex =







    STATUSES.indexOf(report.status);























  return (















    <section className="page-section">















      <div className="container">























        <div className="tracking-header">















          <div>















            <div className="eyebrow">







              FIX MY STREET / REPORT







            </div>















            <h1>







              {report.report_id}







            </h1>















          </div>























          <span







            className={`status-badge status-${report.status.toLowerCase()}`}







          >







            {report.status}







          </span>















        </div>































        {report.safety_risk &&

          ["high", "critical"].includes(String(report.severity || "").toLowerCase()) && (

            <div

              role="alert"

              style={{

                marginBottom: "20px",

                padding: "16px 18px",

                borderRadius: "12px",

                border: "1px solid #fecaca",

                background: "#fff7f7",

                color: "#991b1b",

                lineHeight: "1.5",

              }}

            >

              <strong>⚠ Safety hazard reported</strong>

              <div style={{ marginTop: "4px", fontSize: "14px" }}>

                This report was flagged for priority municipal review. Keep a safe

                distance from the hazard and use emergency services when there is

                an immediate threat to life or safety.

              </div>

            </div>

          )}



        <div className="tracking-grid">























          {/* STATUS TIMELINE */}















          <div className="timeline-card">















            <div className="card-heading">















              <div>















                <span className="eyebrow">







                  STATUS







                </span>















                <h2>







                  Report progress







                </h2>















              </div>















            </div>























            <div







              className="timeline"







              aria-label="Report status timeline"







            >















              {STATUSES.map(







                (status, index) => {















                  const done =







                    index <= currentIndex;















                  const active =







                    index === currentIndex;















                  const history =







                    report.status_history?.find(







                      (item) =>







                        item.status === status







                    );























                  return (















                    <div







                      className={`timeline-item ${done ? "done" : ""







                        } ${active ? "active" : ""







                        }`}







                      key={status}







                    >















                      <div className="timeline-marker">















                        {done ? "✓" : ""}















                      </div>























                      <div className="timeline-content">















                        <strong>







                          {status}







                        </strong>















                        {history && (















                          <span>







                            {formatDate(







                              history.timestamp







                            )}







                          </span>















                        )}















                      </div>















                    </div>















                  );







                }







              )}















            </div>















          </div>































          {/* REPORT DETAILS */}















          <div className="details-card">















            <div className="card-heading">















              <span className="eyebrow">







                REPORT INFORMATION







              </span>















              <h2>







                Details







              </h2>















            </div>























            <Detail







              label="Report ID"







              value={report.report_id}







              mono







            />















            <Detail







              label="Issue Type"







              value={formatLabel(report.category)}







            />















            <Detail







              label="Severity"







              value={report.severity}







            />















            <Detail
              label="Responsible Department"
              value={report.department}
            />

            <Detail
              label="Community Reports"
              value={
                report.total_reports_for_issue === 1
                  ? "1 matching report nearby"
                  : `${report.total_reports_for_issue} matching reports nearby`
              }
            />

            <Detail
              label="Typical Resolution Time"
              value={
                report.resolution_sample_size > 0
                  ? `${formatDuration(report.median_resolution_ms)} (${report.resolution_sample_size} resolved ${report.resolution_sample_size === 1 ? "report" : "reports"
                  })`
                  : "Not enough data yet"
              }
            />

            <Detail
              label="Status"
              value={report.status}
            />












            <Detail







              label="Submitted"







              value={formatDate(







                report.created_at







              )}







            />















          </div>















        </div>































        <div className="bottom-actions">

          <Link







            className="button button-secondary"







            to="/track"







          >







            Track another report







          </Link>















          <Link







            className="button button-primary"







            to="/report"







          >







            Report a problem







          </Link>















        </div>















      </div>















    </section>







  );







}























/* =========================================================







   DETAIL COMPONENT







   ========================================================= */















function Detail({







  label,







  value,







  mono,







}) {















  return (















    <div className="detail-row">















      <span>







        {label}







      </span>















      <strong







        className={







          mono ? "mono" : ""







        }







      >







        {value || "—"}







      </strong>















    </div>







  );







}























/* =========================================================







   QR PAGE







   ========================================================= */















function QRPage() {















  return (















    <section className="qr-entry">















      <div className="qr-panel">















        <div className="brand centered">















          <span className="brand-mark">







            F







          </span>















          <span>







            Fix My Street







          </span>















        </div>























        <div className="qr-symbol">







          ▦







        </div>























        <div className="eyebrow">







          FIX MY STREET / QUICK REPORT







        </div>























        <h1>







          See a problem?







          <br />







          Report it here.







        </h1>























        <p>







          Use this page from a Fix My Street QR







          code placed near infrastructure that







          needs attention.







        </p>























        <Link







          className="button button-primary full-width"







          to="/report"







        >







          Report a Problem{" "}







          <span aria-hidden="true">







            →







          </span>







        </Link>























        <Link







          className="qr-track-link"







          to="/track"







        >







          Already have a report ID? Track it.







        </Link>















      </div>















    </section>







  );







}























/* =========================================================







   DATE FORMATTER







   ========================================================= */















function formatDate(value) {















  if (!value) {







    return "—";







  }























  const date =







    new Date(value);























  if (







    Number.isNaN(







      date.getTime()







    )







  ) {







    return value;







  }























  return new Intl.DateTimeFormat(







    "en-CA",







    {







      dateStyle: "medium",







      timeStyle: "short",







    }







  ).format(date);







}























/* =========================================================







   APP ROUTES







   ========================================================= */















export default function App() {



  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;







  return (



    <APIProvider



      apiKey={googleMapsApiKey}



      libraries={["places"]}



    >



      <Layout>















        <Routes>















          <Route







            path="/"







            element={<Home />}







          />















          <Route







            path="/report"







            element={<Report />}







          />















          <Route







            path="/confirmation/:report_id"







            element={<Confirmation />}







          />















          <Route







            path="/track"







            element={<TrackSearch />}







          />















          <Route







            path="/track/:report_id"







            element={<Tracking />}







          />















          <Route







            path="/qr"







            element={<QRPage />}







          />















          <Route







            path="*"







            element={







              <Navigate







                to="/"







                replace







              />







            }







          />















        </Routes>















      </Layout>



    </APIProvider>







  );







}