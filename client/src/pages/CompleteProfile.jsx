
import logo from "../assets/agos_logo.png";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import {
    getProvinces,
    getCitiesByProvince,
    getBarangaysByCity,
} from "../services/locationService";

const fieldClass =
    "w-full min-h-11 rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "mb-1 block text-sm font-semibold text-text";

const normalizePhoneInput = (value) => {
    let digits = String(value ?? "").replace(/\D/g, "");

    if (digits.startsWith("63")) {
        digits = digits.slice(2);
    }

    if (digits.startsWith("0")) {
        digits = digits.slice(1);
    }

    return digits.slice(0, 10);
};

function CompleteProfile() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const [provinceID, setProvinceID] = useState("");
    const [cityId, setCityId] = useState("");
    const [barangayId, setBarangayId] = useState("");

    // Location options
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);

    // Location loading states
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);

    const [locationError, setLocationError] = useState("");
    const [provincesReloadKey, setProvincesReloadKey] = useState(0);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Load current user's information.
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate("/login", { replace: true });
            return;
        }

        const metadata = user.user_metadata ?? {};

        setName(metadata.name || metadata.full_name || "");
        setEmail(user.email || "");
        setPhoneNumber(
            normalizePhoneInput(metadata.phone_number || "")
        );

        setProvinceID(
            metadata.province_id != null
                ? String(metadata.province_id)
                : ""
        );

        setCityId(
            metadata.city_id != null
                ? String(metadata.city_id)
                : ""
        );

        setBarangayId(
            metadata.barangay_id != null
                ? String(metadata.barangay_id)
                : ""
        );
    }, [user, authLoading, navigate]);

    // Fetch provinces.
    useEffect(() => {
        let isMounted = true;

        const fetchProvinces = async () => {
            try {
                setIsLoadingProvinces(true);
                setLocationError("");

                const data = await getProvinces();

                if (isMounted) {
                    setProvinces(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Error fetching provinces:", err);

                if (isMounted) {
                    setProvinces([]);
                    setLocationError(
                        "Unable to load provinces. Please try again."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoadingProvinces(false);
                }
            }
        };

        fetchProvinces();

        return () => {
            isMounted = false;
        };
    }, [provincesReloadKey]);

    // Fetch cities when the province changes.
    useEffect(() => {
        if (!provinceID) {
            setCities([]);
            setIsLoadingCities(false);
            return;
        }

        let isMounted = true;

        const fetchCities = async () => {
            try {
                setIsLoadingCities(true);
                setLocationError("");

                const data = await getCitiesByProvince(provinceID);

                if (isMounted) {
                    setCities(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Error fetching cities:", err);

                if (isMounted) {
                    setCities([]);
                    setLocationError(
                        "Unable to load cities and municipalities."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoadingCities(false);
                }
            }
        };

        fetchCities();

        return () => {
            isMounted = false;
        };
    }, [provinceID]);

    // Fetch barangays when the city changes.
    useEffect(() => {
        if (!cityId) {
            setBarangays([]);
            setIsLoadingBarangays(false);
            return;
        }

        let isMounted = true;

        const fetchBarangays = async () => {
            try {
                setIsLoadingBarangays(true);
                setLocationError("");

                const data = await getBarangaysByCity(cityId);

                if (isMounted) {
                    setBarangays(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Error fetching barangays:", err);

                if (isMounted) {
                    setBarangays([]);
                    setLocationError("Unable to load barangays.");
                }
            } finally {
                if (isMounted) {
                    setIsLoadingBarangays(false);
                }
            }
        };

        fetchBarangays();

        return () => {
            isMounted = false;
        };
    }, [cityId]);

    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        setError("");

        if (authLoading || !user) {
            setError("Please sign in before completing your profile.");
            return;
        }

        if (
            !name.trim() ||
            !email ||
            !phoneNumber ||
            !provinceID ||
            !cityId ||
            !barangayId
        ) {
            setError("Please fill in all fields.");
            return;
        }

        if (!/^9\d{9}$/.test(phoneNumber)) {
            setError("Please enter a valid Philippine mobile number.");
            return;
        }

        if (isLoadingCities || isLoadingBarangays) {
            setError("Please wait for the location options to finish loading.");
            return;
        }

        // Make sure the selected locations belong to each other.
        const validProvince = provinces.some(
            (province) => province.psgc_code === provinceID
        );

        const validCity = cities.some(
            (city) => city.psgc_code === cityId
        );

        const validBarangay = barangays.some(
            (barangay) => barangay.psgc_code === barangayId
        );

        if (!validProvince || !validCity || !validBarangay) {
            setError("Please select a valid province, city, and barangay.");
            return;
        }

        setIsLoading(true);

        try {
            const profileData = {
                name: name.trim(),
                phone_number: `+63${phoneNumber}`,
                province_id: provinceID,
                city_id: cityId,
                barangay_id: barangayId,
            };

            // Update Supabase Auth user metadata.
            const { data, error: updateError } =
                await supabase.auth.updateUser({
                    data: profileData,
                });

            if (updateError) throw updateError;

            if (!data.user) {
                throw new Error(
                    "Unable to retrieve the updated user profile."
                );
            }

            // Update the corresponding public.profiles record.
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .update(profileData)
                .eq("id", user.id)
                .select("id")
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profile) {
                throw new Error(
                    "Profile record not found. Please contact the administrator."
                );
            }

            navigate("/", { replace: true });
        } catch (err) {
            console.error("Complete profile error:", err);

            setError(
                err.message ||
                "An error occurred while completing your profile. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <main className="flex min-h-dvh items-center justify-center bg-primary p-4">
                <LoaderCircle
                    className="animate-spin text-white"
                    size={28}
                />
            </main>
        );
    }

    return (
        <main className="flex min-h-dvh items-center justify-center bg-primary p-4 md:py-10">
            <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-2">

                {/* Logo section */}
                <section className="flex flex-col items-center justify-center gap-3 bg-primary/10 px-6 py-6 md:p-8">
                    <img
                        src={logo}
                        alt="AGOS Logo"
                        className="h-auto w-24 object-contain md:w-56"
                    />

                    <p className="hidden text-center text-sm font-bold italic text-secondary md:block">
                        Sa bawat AGOS, may gabay.
                    </p>
                </section>

                {/* Form section */}
                <section className="flex flex-col justify-center bg-white p-6 text-text md:p-8">
                    <h1 className="text-center text-2xl font-extrabold">
                        Complete your profile
                    </h1>

                    <p className="mb-5 mt-1 text-center text-sm text-text/70">
                        Just a few more details to get started with AGOS.
                    </p>

                    <form
                        noValidate
                        onSubmit={handleCompleteProfile}
                        className="flex flex-col gap-4"
                    >
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className={labelClass}>
                                Name
                            </label>

                            <input
                                type="text"
                                id="name"
                                name="name"
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className={fieldClass}
                                placeholder="e.g., Juan Dela Cruz"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className={labelClass}>
                                Email
                            </label>

                            <input
                                type="email"
                                readOnly
                                id="email"
                                name="email"
                                required
                                value={email}
                                className={fieldClass}
                                placeholder="e.g., juan@example.com"
                            />

                            <p className="mt-1 text-xs text-text/60">
                                Linked to your account and can't be changed here.
                            </p>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phone" className={labelClass}>
                                Phone Number
                            </label>

                            <div className="flex">
                                <span className="inline-flex min-h-11 items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 px-3 text-sm font-semibold text-text">
                                    +63
                                </span>

                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    autoComplete="tel-national"
                                    inputMode="numeric"
                                    value={phoneNumber}
                                    onChange={(e) =>
                                        setPhoneNumber(normalizePhoneInput(e.target.value))
                                    }
                                    required
                                    maxLength={10}
                                    placeholder="9XX XXX XXXX"
                                    className={`${fieldClass} rounded-l-none`}
                                />
                            </div>

                            <p className="mt-1 text-xs text-text/60">
                                Enter your 10-digit Philippine mobile number.
                            </p>
                        </div>

                        {/* Address */}
                        <fieldset className="m-0 min-w-0 border-0 p-0">
                            <legend className={labelClass}>
                                Address
                            </legend>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                                {/* Province */}
                                <label htmlFor="province" className="sr-only">
                                    Province
                                </label>

                                <select
                                    id="province"
                                    name="province"
                                    required
                                    value={provinceID}
                                    disabled={isLoadingProvinces}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        setProvinceID(value);
                                        setCityId("");
                                        setBarangayId("");
                                        setCities([]);
                                        setBarangays([]);
                                        setLocationError("");
                                        setIsLoadingCities(Boolean(value));
                                    }}
                                    className={fieldClass}
                                >
                                    <option value="">
                                        {isLoadingProvinces
                                            ? "Loading provinces..."
                                            : provinces.length === 0
                                                ? "No provinces available"
                                                : "Select province"}
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

                                {/* City / Municipality */}
                                <label htmlFor="city" className="sr-only">
                                    City / Municipality
                                </label>

                                <select
                                    id="city"
                                    name="city"
                                    required
                                    value={cityId}
                                    disabled={!provinceID || isLoadingCities}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        setCityId(value);
                                        setBarangayId("");
                                        setBarangays([]);
                                        setLocationError("");
                                        setIsLoadingBarangays(Boolean(value));
                                    }}
                                    className={fieldClass}
                                >
                                    <option value="">
                                        {!provinceID
                                            ? "Select province first"
                                            : isLoadingCities
                                                ? "Loading cities..."
                                                : cities.length === 0
                                                    ? "No cities available"
                                                    : "Select city / municipality"}
                                    </option>

                                    {cities.map((city) => (
                                        <option
                                            key={city.psgc_code}
                                            value={city.psgc_code}
                                        >
                                            {city.name}
                                            {city.type === "city"
                                                ? " (City)"
                                                : " (Municipality)"}
                                        </option>
                                    ))}
                                </select>

                                {/* Barangay */}
                                <label htmlFor="barangay" className="sr-only">
                                    Barangay
                                </label>

                                <select
                                    id="barangay"
                                    name="barangay"
                                    required
                                    value={barangayId}
                                    disabled={!cityId || isLoadingBarangays}
                                    onChange={(e) =>
                                        setBarangayId(e.target.value)
                                    }
                                    className={`${fieldClass} sm:col-span-2`}
                                >
                                    <option value="">
                                        {!cityId
                                            ? "Select city first"
                                            : isLoadingBarangays
                                                ? "Loading barangays..."
                                                : barangays.length === 0
                                                    ? "No barangays available"
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
                        </fieldset>

                        {/* Location error */}
                        {locationError && (
                            <div
                                role="alert"
                                className="flex flex-wrap items-center gap-2 text-sm text-red-700"
                            >
                                <span>{locationError}</span>

                                {provinces.length === 0 &&
                                    !isLoadingProvinces && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setProvincesReloadKey(
                                                    (key) => key + 1
                                                )
                                            }
                                            className="cursor-pointer font-semibold text-secondary underline underline-offset-4 hover:text-secondary-hover"
                                        >
                                            Try again
                                        </button>
                                    )}
                            </div>
                        )}

                        {/* Form error */}
                        {error && (
                            <p
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                            >
                                {error}
                            </p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={
                                isLoading ||
                                isLoadingProvinces ||
                                isLoadingCities ||
                                isLoadingBarangays
                            }
                            aria-busy={isLoading}
                            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading
                                ? "Completing..."
                                : "Complete Profile"}

                            {isLoading && (
                                <LoaderCircle
                                    className="animate-spin"
                                    size={16}
                                />
                            )}
                        </button>

                        <p className="text-center text-sm text-text/70">
                            Your profile helps AGOS provide relevant local disaster information.
                        </p>
                    </form>
                </section>
            </div>
        </main>
    );
}

export default CompleteProfile;
