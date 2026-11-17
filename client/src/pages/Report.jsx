
import { useEffect, useRef, useState } from "react";
import {
  Upload,
  ImagePlus,
  X,
  LoaderCircle,
  LocateFixed,
  PenLine,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import {
  listMyReports,
  submitReport,
  withdrawReport,
} from "../services/admin/reportsService";
import { useAuth } from "../contexts/AuthContext";
import {
  getBarangaysByCity,
  getCitiesByProvince,
  getProvinces,
} from "../services/locationService";

function Report() {
  const { user, loading: authLoading } = useAuth();
  const [reportType, setReportType] = useState("Flooded road");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState({
    latitude: null,
    longitude: null,
  });
  const [locationMode, setLocationMode] = useState("custom");
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [barangayId, setBarangayId] = useState("");
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [details, setDetails] = useState("");
  const [images, setImages] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [myReports, setMyReports] = useState([]);
  const [loadingMyReports, setLoadingMyReports] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const fileInputRef = useRef(null);

  const loadMyReports = () => {
    if (!user) {
      setMyReports([]);
      return;
    }
    setLoadingMyReports(true);
    listMyReports()
      .then(setMyReports)
      .catch((error) => console.error("Unable to load your reports.", error))
      .finally(() => setLoadingMyReports(false));
  };

  useEffect(() => {
    loadMyReports();
  }, [user]);

  const handleWithdraw = async (id) => {
    setWithdrawingId(id);
    try {
      await withdrawReport(id);
      loadMyReports();
    } catch (error) {
      setSubmitError(error.message || "Unable to withdraw this report.");
    } finally {
      setWithdrawingId(null);
    }
  };

  useEffect(() => {
    let active = true;
    setLoadingLocations(true);
    getProvinces()
      .then((items) => {
        if (active) setProvinces(items);
      })
      .catch((error) => {
        console.error("Unable to load provinces.", error);
        if (active) setLocationError("Location choices are unavailable. You can still enter a landmark.");
      })
      .finally(() => {
        if (active) setLoadingLocations(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setCities([]);
    setBarangays([]);
    setCityId("");
    setBarangayId("");
    if (!provinceId) return undefined;
    getCitiesByProvince(provinceId)
      .then((items) => {
        if (active) setCities(items);
      })
      .catch((error) => console.error("Unable to load cities.", error));
    return () => {
      active = false;
    };
  }, [provinceId]);

  useEffect(() => {
    let active = true;
    setBarangays([]);
    setBarangayId("");
    if (!cityId) return undefined;
    getBarangaysByCity(cityId)
      .then((items) => {
        if (active) setBarangays(items);
      })
      .catch((error) => console.error("Unable to load barangays.", error));
    return () => {
      active = false;
    };
  }, [cityId]);

  // Get user's current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location access is not supported by this browser. You can enter a landmark instead.");
      return;
    }

    setLoadingLocation(true);
    setLocationError("");
    setLocationMode("current");
    setProvinceId("");
    setCityId("");
    setBarangayId("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation("Current location");
        setCoordinates({ latitude, longitude });
        setLoadingLocation(false);
      },
      () => {
        setLocationMode("custom");
        setLocationError("We couldn't access your location. Enter a barangay, street, or landmark instead.");
        setLoadingLocation(false);
      }
    );
  };

  const handleCustomLocation = (value) => {
    setLocationMode("custom");
    setLocation(value);
    setCoordinates({ latitude: null, longitude: null });
    setLocationError("");
  };

  // Upload images
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    setImages((prev) => [...prev, ...validFiles].slice(0, 5));
    e.target.value = "";
  };

  // Remove selected image
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit report
  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedLocationName =
      barangays.find((item) => item.psgc_code === barangayId)?.name ||
      cities.find((item) => item.psgc_code === cityId)?.name ||
      provinces.find((item) => item.psgc_code === provinceId)?.name ||
      "";
    const locationText = location.trim() || selectedLocationName;

    if (!locationText || (locationMode === "custom" && location.trim() === "Current location")) {
      setSubmitError("Please provide a location.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitted(false);

    try {
      await submitReport({
        reportType,
        locationText,
        details,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        provinceId,
        cityId,
        barangayId,
        images,
        observedAt: new Date().toISOString(),
      });
      setSubmitted(true);
      loadMyReports();
      setDetails("");
      setImages([]);
      setLocation("");
      setCoordinates({ latitude: null, longitude: null });
      setLocationMode("custom");
      setProvinceId("");
      setCityId("");
      setBarangayId("");
    } catch (error) {
      console.error("Unable to submit report.", error);
      setSubmitError(error.message || "Unable to submit your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-8 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16">

        {/* LEFT SECTION */}
        <section className="flex flex-col items-start lg:pt-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Community reporting</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-secondary sm:text-4xl md:text-5xl">
            Report Flood Conditions
          </h1>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-text/70 sm:text-lg">
            Share what you are seeing so AGOS can verify conditions, improve route guidance, and keep your community informed.
          </p>

          <a
            href="#report-form"
            className="mt-6 hidden items-center justify-center rounded-lg bg-secondary px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-secondary-hover active:scale-95 md:inline-flex"
          >
            Report Now!
          </a>
          <div className="mt-8 hidden max-w-sm rounded-xl border border-primary/15 bg-white p-4 shadow-card lg:block">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={22} />
              <div>
                <p className="text-sm font-bold text-secondary">Reports are reviewed</p>
                <p className="mt-1 text-xs leading-relaxed text-text/60">Your submission is sent to the AGOS review queue before it can affect public conditions or alerts.</p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT SECTION - REPORT FORM */}
        <section
          id="report-form"
          className="w-full min-w-0 rounded-2xl bg-white p-5 shadow-elevated sm:p-7 md:p-8"
        >
          <div className="mb-6 border-b border-gray-100 pb-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">New report</p>
            <h2 className="mt-1 text-xl font-extrabold text-secondary">Tell us what is happening</h2>
            <p className="mt-1 text-sm text-text/60">Fields marked with <span className="font-bold text-risk-high">*</span> are required.</p>
          </div>
          {authLoading && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-text/70" role="status">
              <LoaderCircle size={18} className="animate-spin text-primary" />
              Checking your sign-in status...
            </div>
          )}
          {!authLoading && !user && (
            <div className="mb-5 flex gap-3 rounded-xl border border-risk-moderate/30 bg-risk-moderate/10 p-4 text-sm text-text/75">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-risk-moderate" />
              <span>Sign in before submitting a community report.</span>
            </div>
          )}
          {submitError && (
            <div className="mb-5 flex gap-3 rounded-xl border border-risk-high/30 bg-risk-high/10 p-4 text-sm text-text/75" role="alert">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-risk-high" />
              {submitError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

            {/* REPORT TYPE */}
            <div>
              <label
                htmlFor="reportType"
                className="mb-2 block text-sm font-medium text-text/75"
              >
                What are you reporting? <span className="text-risk-high">*</span>
              </label>

              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-secondary focus:ring-1 focus:ring-secondary"
              >
                <option value="Flooded road">Flooded road</option>
                <option value="Road is passable">Road is passable</option>
                <option value="Transport disruption">Transport disruption</option>
                <option value="Heavy rainfall">Heavy rainfall</option>
                <option value="Unsafe route">Unsafe route</option>
                <option value="Emergency need">Emergency need</option>
              </select>
            </div>

            {/* LOCATION */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-text/75">
                  Where did this happen? <span className="text-risk-high">*</span>
                </label>
                <span className="text-[11px] text-text/45">Choose one method</span>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
                <button type="button" onClick={handleCurrentLocation} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition ${locationMode === "current" ? "bg-white text-secondary shadow-sm" : "text-text/60 hover:text-secondary"}`}>
                  <LocateFixed size={16} /> Use current location
                </button>
                <button type="button" onClick={() => handleCustomLocation(locationMode === "current" ? "" : location)} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition ${locationMode === "custom" ? "bg-white text-secondary shadow-sm" : "text-text/60 hover:text-secondary"}`}>
                  <PenLine size={16} /> Enter a location
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {loadingLocation && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-text/70" role="status">
                    <LoaderCircle size={17} className="animate-spin text-primary" /> Getting your location securely...
                  </div>
                )}
                {locationMode === "current" && !loadingLocation && location && (
                  <div className="flex min-w-0 items-center gap-3 rounded-lg border border-safe/20 bg-safe/5 p-3 text-sm text-text/75">
                    <CheckCircle2 size={18} className="shrink-0 text-safe" />
                    <span><span className="font-semibold text-secondary">Current location captured.</span> Coordinates will be shared privately with the report.</span>
                  </div>
                )}
                {locationMode === "custom" && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => handleCustomLocation(e.target.value)}
                      placeholder="Street, landmark, road, or nearby place (optional)"
                      className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-secondary focus:ring-1 focus:ring-secondary"
                    />
                    <div className="grid gap-2 sm:grid-cols-3">
                      <select
                        value={provinceId}
                        onChange={(event) => setProvinceId(event.target.value)}
                        disabled={loadingLocations}
                        className="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-xs outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                      >
                        <option value="">{loadingLocations ? "Loading provinces..." : "Select province"}</option>
                        {provinces.map((item) => <option key={item.psgc_code} value={item.psgc_code}>{item.name}</option>)}
                      </select>
                      <select
                        value={cityId}
                        onChange={(event) => setCityId(event.target.value)}
                        disabled={!provinceId || !cities.length}
                        className="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-xs outline-none focus:border-secondary focus:ring-1 focus:ring-secondary disabled:bg-gray-50"
                      >
                        <option value="">Select city/municipality</option>
                        {cities.map((item) => <option key={item.psgc_code} value={item.psgc_code}>{item.name}</option>)}
                      </select>
                      <select
                        value={barangayId}
                        onChange={(event) => setBarangayId(event.target.value)}
                        disabled={!cityId || !barangays.length}
                        className="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-xs outline-none focus:border-secondary focus:ring-1 focus:ring-secondary disabled:bg-gray-50"
                      >
                        <option value="">Select barangay</option>
                        {barangays.map((item) => <option key={item.psgc_code} value={item.psgc_code}>{item.name}</option>)}
                      </select>
                    </div>
                    <p className="text-[11px] leading-relaxed text-text/50">
                      Choose the closest area so reports can be grouped accurately on the flood map.
                    </p>
                  </div>
                )}
                {locationError && <p className="text-xs leading-relaxed text-risk-high" role="alert">{locationError}</p>}
              </div>
            </div>

            {/* DETAILS AND IMAGE UPLOAD */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_104px] sm:gap-3">

              {/* OTHER DETAILS */}
              <div className="min-w-0">
                <label
                  htmlFor="details"
                  className="mb-2 block text-sm font-medium text-text/75"
                >
                  Other details:
                </label>

                <textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Describe the flood conditions..."
                  className="min-h-[84px] w-full resize-y rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-secondary focus:ring-1 focus:ring-secondary"
                />
              </div>

              {/* IMAGE UPLOAD */}
              <div className="min-w-0">
                <label className="mb-2 block whitespace-nowrap text-sm text-text/75">
                    Images <span className="text-[10px] text-gray-400">(optional)</span>
                </label>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-[84px] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-gray-500 transition hover:border-secondary hover:bg-gray-50 hover:text-secondary"
                >
                  <Upload size={21} />
                  <span className="text-xs font-semibold">Add photos</span>
                  <span className="text-[10px] text-text/45">Up to 5 images</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* IMAGE PREVIEW */}
            <div className="rounded-xl border border-gray-100 bg-background/60 p-3">
              {images.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                {images.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex min-w-0 max-w-full items-center gap-2 rounded-md bg-gray-100 p-2 text-xs text-gray-600"
                  >
                    <ImagePlus size={16} className="shrink-0" />

                    <span className="max-w-[150px] truncate">
                      {file.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="shrink-0 text-red-500 transition hover:text-red-700"
                      aria-label="Remove image"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}

                <p className="w-full text-xs text-gray-400">
                  {images.length}/5 images selected
                </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-xs text-text/50">
                  <ImagePlus size={18} className="text-text/35" />
                  <span>No photos added. Photos help reviewers understand the conditions.</span>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={submitting || authLoading || !user}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-secondary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {submitting && <LoaderCircle size={17} className="animate-spin" />}
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>

          </form>
          {user && (
            <section className="mt-8 border-t border-gray-100 pt-6" aria-labelledby="my-reports-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Your activity</p>
                  <h3 id="my-reports-title" className="mt-1 text-lg font-extrabold text-secondary">Recent reports</h3>
                </div>
                {loadingMyReports && <LoaderCircle size={17} className="animate-spin text-primary" />}
              </div>
              {!loadingMyReports && !myReports.length && (
                <p className="mt-3 rounded-lg bg-background p-3 text-xs text-text/55">You have not submitted any reports yet.</p>
              )}
              <div className="mt-3 space-y-2">
                {myReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-secondary">{report.type}</p>
                      <p className="mt-1 truncate text-[11px] text-text/55">{report.location}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold capitalize text-primary">{report.status}</span>
                      {report.status === "pending" && (
                        <button type="button" onClick={() => handleWithdraw(report.id)} disabled={withdrawingId === report.id} className="text-[10px] font-bold text-risk-high hover:underline disabled:opacity-50">
                          {withdrawingId === report.id ? "Withdrawing..." : "Withdraw"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
      {submitted && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-secondary/50 p-4" role="dialog" aria-modal="true" aria-labelledby="report-success-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-safe/10 text-safe">
              <CheckCircle2 size={32} />
            </div>
            <div className="mt-5 text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Report received</p>
              <h2 id="report-success-title" className="mt-2 text-2xl font-extrabold text-secondary">Thank you for helping AGOS</h2>
              <p className="mt-3 text-sm leading-relaxed text-text/65">
                Your report is now pending review. Verified reports may help improve flood conditions and route guidance for the community.
              </p>
            </div>
            <button type="button" onClick={() => setSubmitted(false)} className="mt-6 w-full rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-white transition hover:bg-secondary-hover">
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Report;
