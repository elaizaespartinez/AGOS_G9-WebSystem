
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    LoaderCircle,
    Save,
    UserRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";

const inputClass =
    "w-full rounded-lg border border-gray-300 bg-background px-4 py-3 text-sm text-text outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
    "mb-1.5 block text-sm font-semibold text-text";

const PageShell = ({ children }) => (
    <main className="md:mx-32 p-2 bg-background">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
    </main>
);

export default function EditProfile() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [provinceID, setProvinceID] = useState("");
    const [cityID, setCityID] = useState("");
    const [barangayID, setBarangayID] = useState("");

    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);

    const [error, setError] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Load the user's profile and available provinces
    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            if (authLoading) return;

            if (!user) {
                navigate("/login", { replace: true });
                return;
            }

            setIsLoading(true);
            setError("");

            try {
                const [profileResult, provinceResult] = await Promise.all([
                    supabase
                        .from("profiles")
                        .select("name, province_id, city_id, barangay_id")
                        .eq("id", user.id)
                        .single(),

                    supabase
                        .from("provinces")
                        .select("psgc_code, name")
                        .order("name"),
                ]);

                if (profileResult.error) throw profileResult.error;
                if (provinceResult.error) throw provinceResult.error;

                if (isMounted) {
                    const profile = profileResult.data;

                    setName(profile.name || "");
                    setEmail(user.email || "");

                    setProvinceID(profile.province_id || "");
                    setCityID(profile.city_id || "");
                    setBarangayID(profile.barangay_id || "");

                    setProvinces(provinceResult.data || []);
                }
            } catch (err) {
                console.error("Unable to load profile:", err);

                if (isMounted) {
                    setError(
                        "Unable to load your profile. Please try again."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [user, authLoading, navigate]);

    // Load cities whenever the selected province changes
    useEffect(() => {
        let isMounted = true;

        const loadCities = async () => {
            if (!provinceID) {
                setCities([]);
                return;
            }

            setLoadingCities(true);

            try {
                const { data, error } = await supabase
                    .from("cities_municipalities")
                    .select("psgc_code, name, type")
                    .eq("province_code", provinceID)
                    .order("name");

                if (error) throw error;

                if (isMounted) {
                    setCities(data || []);
                }
            } catch (err) {
                console.error("Unable to load cities:", err);

                if (isMounted) {
                    setCities([]);
                    setError("Unable to load cities and municipalities.");
                }
            } finally {
                if (isMounted) {
                    setLoadingCities(false);
                }
            }
        };

        loadCities();

        return () => {
            isMounted = false;
        };
    }, [provinceID]);

    // Load barangays whenever the selected city changes
    useEffect(() => {
        let isMounted = true;

        const loadBarangays = async () => {
            if (!cityID) {
                setBarangays([]);
                return;
            }

            setLoadingBarangays(true);

            try {
                const { data, error } = await supabase
                    .from("barangays")
                    .select("psgc_code, name")
                    .eq("city_municipality_code", cityID)
                    .order("name");

                if (error) throw error;

                if (isMounted) {
                    setBarangays(data || []);
                }
            } catch (err) {
                console.error("Unable to load barangays:", err);

                if (isMounted) {
                    setBarangays([]);
                    setError("Unable to load barangays.");
                }
            } finally {
                if (isMounted) {
                    setLoadingBarangays(false);
                }
            }
        };

        loadBarangays();

        return () => {
            isMounted = false;
        };
    }, [cityID]);

    const handleProvinceChange = (value) => {
        setProvinceID(value);
        setCityID("");
        setBarangayID("");
        setSuccess("");
        setError("");
    };

    const handleCityChange = (value) => {
        setCityID(value);
        setBarangayID("");
        setSuccess("");
        setError("");
    };

    const handleSave = async (event) => {
        event.preventDefault();

        if (!user) return;

        if (!name.trim() || !provinceID || !cityID || !barangayID) {
            setError("Please complete all required fields.");
            return;
        }

        const validProvince = provinces.some(
            (province) => province.psgc_code === provinceID
        );

        const validCity = cities.some(
            (city) => city.psgc_code === cityID
        );

        const validBarangay = barangays.some(
            (barangay) => barangay.psgc_code === barangayID
        );

        if (!validProvince || !validCity || !validBarangay) {
            setError("Please select a valid address.");
            return;
        }

        setIsSaving(true);
        setError("");

        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    name: name.trim(),
                    province_id: provinceID,
                    city_id: cityID,
                    barangay_id: barangayID,
                })
                .eq("id", user.id);

            if (error) throw error;

            setShowSuccessModal(true);
        } catch (err) {
            console.error("Unable to update profile:", err);

            setError(
                err.message ||
                    "Unable to update your profile. Please try again."
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <PageShell>
                <div className="flex min-h-64 items-center justify-center">
                    <LoaderCircle
                        className="animate-spin text-secondary"
                        size={32}
                    />
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            {/* Page heading */}
            <div className="mb-6">
                <Link
                    to="/profile"
                    className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-text/70 transition hover:text-secondary"
                >
                    <ArrowLeft size={16} />
                    Back to Profile
                </Link>

                <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    Account
                </p>

                <h1 className="mt-1 text-3xl font-extrabold text-text">
                    Edit Profile
                </h1>

                <p className="mt-2 text-sm text-text/70">
                    Update your personal information and address.
                </p>
            </div>

            <section className="rounded-2xl bg-card p-5 shadow-card md:p-8">
                {/* Profile icon */}
                <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                        <UserRound
                            size={24}
                            className="text-secondary"
                        />
                    </div>

                    <div>
                        <h2 className="font-bold text-text">
                            Personal Details
                        </h2>

                        <p className="text-xs text-text/60">
                            Keep your account information updated.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Personal information */}
                    <div>
                        <h3 className="mb-4 text-sm font-extrabold text-text">
                            Personal Information
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="name"
                                    className={labelClass}
                                >
                                    Full name
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setSuccess("");
                                    }}
                                    placeholder="Enter your full name"
                                    className={inputClass}
                                    required
                                    maxLength={100}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className={labelClass}
                                >
                                    Email address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    className={inputClass}
                                    disabled
                                    readOnly
                                />

                                <p className="mt-1.5 text-xs text-text/50">
                                    Email address cannot be changed here.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <h3 className="mb-4 text-sm font-extrabold text-text">
                            Address
                        </h3>

                        <div className="space-y-4">
                            {/* Province */}
                            <div>
                                <label
                                    htmlFor="province"
                                    className={labelClass}
                                >
                                    Province
                                </label>

                                <select
                                    id="province"
                                    value={provinceID}
                                    onChange={(e) =>
                                        handleProvinceChange(e.target.value)
                                    }
                                    className={inputClass}
                                    required
                                >
                                    <option value="">
                                        Select province
                                    </option>

                                    {provinces.map((province) => (
                                        <option
                                            key={province.psgc_code}
                                            value={province.psgc_code}
                                        >
                                            {province.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* City / Municipality */}
                            <div>
                                <label
                                    htmlFor="city"
                                    className={labelClass}
                                >
                                    City / Municipality
                                </label>

                                <select
                                    id="city"
                                    value={cityID}
                                    onChange={(e) =>
                                        handleCityChange(e.target.value)
                                    }
                                    className={inputClass}
                                    disabled={!provinceID || loadingCities}
                                    required
                                >
                                    <option value="">
                                        {loadingCities
                                            ? "Loading cities..."
                                            : !provinceID
                                              ? "Select a province first"
                                              : "Select city / municipality"}
                                    </option>

                                    {cities.map((city) => (
                                        <option
                                            key={city.psgc_code}
                                            value={city.psgc_code}
                                        >
                                            {city.name} (
                                            {city.type === "city"
                                                ? "City"
                                                : "Municipality"}
                                            )
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Barangay */}
                            <div>
                                <label
                                    htmlFor="barangay"
                                    className={labelClass}
                                >
                                    Barangay
                                </label>

                                <select
                                    id="barangay"
                                    value={barangayID}
                                    onChange={(e) => {
                                        setBarangayID(e.target.value);
                                        setSuccess("");
                                    }}
                                    className={inputClass}
                                    disabled={!cityID || loadingBarangays}
                                    required
                                >
                                    <option value="">
                                        {loadingBarangays
                                            ? "Loading barangays..."
                                            : !cityID
                                              ? "Select a city first"
                                              : "Select barangay"}
                                    </option>

                                    {barangays.map((barangay) => (
                                        <option
                                            key={barangay.psgc_code}
                                            value={barangay.psgc_code}
                                        >
                                            {barangay.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Feedback messages */}
                    {error && (
                        <div
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                        <Link
                            to="/profile"
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-gray-100"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={
                                isSaving ||
                                loadingCities ||
                                loadingBarangays
                            }
                            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? (
                                <>
                                    <LoaderCircle
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </section>

            {showSuccessModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="success-title"
                >
                    <div className="w-full max-w-md rounded-2xl bg-card p-6 text-center shadow-xl">
                        {/* Success Icon */}
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <Save size={30} className="text-green-600" />
                        </div>

                        {/* Message */}
                        <h2
                            id="success-title"
                            className="text-xl font-extrabold text-text"
                        >
                            Profile Updated!
                        </h2>

                        <p className="mt-2 text-sm leading-relaxed text-text/70">
                            Your personal information and address have been
                            successfully updated.
                        </p>

                        {/* Navigation Options */}
                        <div className="mt-6 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/profile", { replace: true })}
                                className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover"
                            >
                                Back to Profile
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/", { replace: true })}
                                className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-text transition hover:bg-gray-100"
                            >
                                Go to Homepage
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
