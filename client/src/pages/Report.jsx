
import { useRef, useState } from "react";
import {
  MapPin,
  Upload,
  ImagePlus,
  X,
  LoaderCircle,
} from "lucide-react";

function Report() {
  const [reportType, setReportType] = useState("Flooded Location");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [images, setImages] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const fileInputRef = useRef(null);

  // Get user's current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`${latitude}, ${longitude}`);
        setLoadingLocation(false);
      },
      () => {
        alert("Unable to retrieve your location. Please allow location access.");
        setLoadingLocation(false);
      }
    );
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
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!location.trim()) {
      alert("Please provide a location.");
      return;
    }

    const reportData = {
      reportType,
      location,
      details,
      images,
    };

    console.log("Report submitted:", reportData);
    alert("Your report has been submitted!");
  };

  return (
    <main className="md:mx-32 p-2 bg-background">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 md:gap-8 lg:grid-cols-[0.8fr_1.4fr] lg:items-center lg:gap-16">

        {/* LEFT SECTION */}
        <section className="flex flex-col items-start">
          <h1 className="text-2xl font-extrabold leading-tight text-text sm:text-3xl md:text-4xl">
            Report Flood Conditions
          </h1>

          <p className="mt-3 hidden max-w-sm text-lg font-light leading-relaxed text-text/75 md:block md:text-xl">
            Help the AGOS team monitor your community.
          </p>

          <a
            href="#report-form"
            className="mt-5 hidden items-center justify-center rounded-md bg-secondary px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-secondary-hover active:scale-95 md:inline-flex"
          >
            Report Now!
          </a>
        </section>

        {/* RIGHT SECTION - REPORT FORM */}
        <section
          id="report-form"
          className="w-full min-w-0 rounded-xl bg-white p-4 shadow-elevated sm:p-6 md:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

            {/* REPORT TYPE */}
            <div>
              <label
                htmlFor="reportType"
                className="mb-2 block text-sm font-medium text-text/75"
              >
                What are you reporting?
              </label>

              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-secondary focus:ring-1 focus:ring-secondary"
              >
                <option value="Flooded Location">Flooded Location</option>
                <option value="Rising Water Level">Rising Water Level</option>
                <option value="Heavy Rainfall">Heavy Rainfall</option>
                <option value="Road Obstruction">Road Obstruction</option>
                <option value="Damaged Infrastructure">Damaged Infrastructure</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* LOCATION */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text/75">
                Where?
              </label>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  disabled={loadingLocation}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-3 py-3 text-sm font-medium text-white transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingLocation ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin size={17} />
                      Use my current location
                    </>
                  )}
                </button>

                {location && (
                  <div className="flex min-w-0 items-start gap-2 rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                    <MapPin
                      size={17}
                      className="mt-0.5 shrink-0 text-secondary"
                    />
                    <span className="min-w-0 break-all">{location}</span>
                  </div>
                )}

                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter barangay, street, or landmark"
                  className="w-full min-w-0 rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-secondary focus:ring-1 focus:ring-secondary"
                />
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
                  className="flex h-[84px] w-full flex-col items-center justify-center gap-1 rounded-lg border border-gray-300 text-gray-500 transition hover:border-secondary hover:bg-gray-50 hover:text-secondary"
                >
                  <Upload size={21} />
                  <span className="text-xs">Upload</span>
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
            {images.length > 0 && (
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
            )}

            {/* SUBMIT BUTTON */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                className="w-full rounded-md bg-secondary px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-secondary-hover active:scale-95 sm:w-auto"
              >
                Submit Report
              </button>
            </div>

          </form>
        </section>
      </div>
    </main>
  );
}

export default Report;
